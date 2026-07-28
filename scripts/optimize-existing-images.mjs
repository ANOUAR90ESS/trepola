/**
 * One-off maintenance script.
 * Finds articles whose image_url points into the Supabase "article-images"
 * bucket, downloads the current file, resizes it to a max width of 1200px
 * and re-encodes it as WebP (quality 75), re-uploads it, and updates the
 * articles.image_url column. Fixes multi-MB PNGs uploaded before the
 * upload pipeline started compressing images.
 *
 * Run: node scripts/optimize-existing-images.mjs
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'article-images';
const SKIP_UNDER_BYTES = 300 * 1024; // already small enough, don't reprocess

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

const { data: rows, error } = await admin
  .from('articles')
  .select('id, image_url')
  .like('image_url', `%/${BUCKET}/%`);

if (error) {
  console.error('Query error:', error.message);
  process.exit(1);
}

console.log(`Found ${rows.length} article(s) with an image in the "${BUCKET}" bucket.`);

let optimized = 0, skipped = 0, failed = 0;
for (const row of rows) {
  const currentUrl = row.image_url || '';
  try {
    const res = await fetch(currentUrl);
    if (!res.ok) {
      console.warn(`  fetch fail (${row.id}): ${res.status}`);
      failed++;
      continue;
    }
    const original = Buffer.from(await res.arrayBuffer());
    if (original.byteLength < SKIP_UNDER_BYTES) {
      skipped++;
      continue;
    }

    const optimizedBuffer = await sharp(original)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();

    const fileName = `ai/optimized-${row.id}-${Date.now()}.webp`;
    const { error: upErr } = await admin.storage.from(BUCKET).upload(fileName, optimizedBuffer, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: true,
    });
    if (upErr) {
      console.warn(`  upload fail (${row.id}):`, upErr.message);
      failed++;
      continue;
    }

    const newUrl = admin.storage.from(BUCKET).getPublicUrl(fileName).data?.publicUrl;
    if (!newUrl) {
      console.warn(`  no public URL (${row.id})`);
      failed++;
      continue;
    }

    const { error: updErr } = await admin.from('articles').update({ image_url: newUrl }).eq('id', row.id);
    if (updErr) {
      console.warn(`  db update fail (${row.id}):`, updErr.message);
      failed++;
      continue;
    }

    optimized++;
    console.log(`  ${row.id}: ${(original.byteLength / 1024).toFixed(0)}KiB -> ${(optimizedBuffer.byteLength / 1024).toFixed(0)}KiB`);
  } catch (e) {
    console.warn(`  error (${row.id}):`, e?.message || e);
    failed++;
  }
}

console.log('\nDone:', { total: rows.length, optimized, skipped, failed });
