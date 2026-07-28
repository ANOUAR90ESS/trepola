/**
 * One-off maintenance script.
 * Finds articles whose image_url is a base64 data URL (which bloated the
 * homepage payload to ~2MB) and migrates the image into Supabase Storage,
 * replacing the column with a small public URL.
 *
 * Run: node scripts/migrate-base64-images.mjs
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'article-images';
const FALLBACK = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1080&fm=webp&q=60';

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

try {
  await admin.storage.createBucket(BUCKET, { public: true });
  console.log(`Bucket "${BUCKET}" created.`);
} catch {
  console.log(`Bucket "${BUCKET}" already exists (ok).`);
}

const { data: rows, error } = await admin
  .from('articles')
  .select('id, image_url')
  .like('image_url', 'data:%');

if (error) {
  console.error('Query error:', error.message);
  process.exit(1);
}

console.log(`Found ${rows.length} article(s) with base64 image_url.`);

let migrated = 0, fallbacks = 0, failed = 0;
for (const row of rows) {
  const u = row.image_url || '';
  const m = u.match(/^data:(image\/[\w+]+);base64,([\s\S]*)$/);
  let newUrl = null;

  if (m) {
    try {
      const buffer = Buffer.from(m[2], 'base64');
      const ext = m[1].includes('png') ? 'png' : m[1].includes('webp') ? 'webp' : 'jpg';
      const fileName = `ai/migrated-${row.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await admin.storage.from(BUCKET).upload(fileName, buffer, {
        contentType: m[1],
        cacheControl: '31536000',
        upsert: true,
      });
      if (!upErr) {
        newUrl = admin.storage.from(BUCKET).getPublicUrl(fileName).data?.publicUrl || null;
      } else {
        console.warn(`  upload fail (${row.id}):`, upErr.message);
      }
    } catch (e) {
      console.warn(`  decode/upload error (${row.id}):`, e?.message || e);
    }
  }

  if (!newUrl) {
    newUrl = FALLBACK;
    fallbacks++;
  }

  const { error: updErr } = await admin.from('articles').update({ image_url: newUrl }).eq('id', row.id);
  if (updErr) {
    console.warn(`  db update fail (${row.id}):`, updErr.message);
    failed++;
    continue;
  }
  migrated++;
  console.log(`  ${row.id} -> ${newUrl.slice(0, 90)}`);
}

console.log('\nDone:', { total: rows.length, migrated, usedFallback: fallbacks, failed });
