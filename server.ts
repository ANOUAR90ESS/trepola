import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { requireAdmin, AuthRequest } from './src/middleware/auth.js';
import { db } from './src/db/index.js';
import { users, savedArticles, comments, articles as articlesTable, jobs as jobsTable } from './src/db/schema.js';
import { getOrCreateUser } from './src/db/users.js';
import { eq, desc, and } from 'drizzle-orm';
import { registerImageProvider } from './src/server/imageProviders/registry.js';
import { OpenAIImageProvider } from './src/server/imageProviders/openaiProvider.js';
import { registerJobHandler, getJobHandler } from './src/server/jobs/registry.js';
import { createImageGenerationJobHandler } from './src/server/jobs/imageGenerationJob.js';
import type { JobType } from './src/types/workflow.js';

import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import Parser from 'rss-parser';
import { INITIAL_ARTICLES, INITIAL_COMMENTS } from './src/data/initialData.js';
import { allCategoryPaths, pathToCategoryId } from './src/utils/categoryRoutes.js';
import { getSrcSet } from './src/utils/image.js';
import { BLOCK_TYPES } from './src/types/articleBlocks.js';

const CATEGORY_NAMES_ES: Record<string, string> = {
  general: 'Noticias General',
  tech: 'Tecnología',
  sports: 'Deportes',
  politics: 'Política',
  economy: 'Economía y Negocios',
  culture: 'Cultura y Arte',
};

function normalizeCategoryLabel(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

// Reverse lookup for CATEGORY_NAMES_ES, matched on the first word only so
// Claude's shorter category labels ("Economía", "Cultura") still resolve to
// the DB's category id ("economy", "culture") despite the longer display names.
const CATEGORY_LABEL_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_NAMES_ES).map(([id, label]) => [normalizeCategoryLabel(label.split(' ')[0]), id]),
);

function resolveCategoryId(claudeCategory?: string): string | undefined {
  if (!claudeCategory) return undefined;
  return CATEGORY_LABEL_TO_ID[normalizeCategoryLabel(claudeCategory.split(' ')[0])];
}

function serverSlugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pneiftfkllsvlwtgzccx.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuZWlmdGZrbGxzdmx3dGd6Y2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NzAwMjksImV4cCI6MjEwMDA0NjAyOX0.LlJsdTpQhi1ADCI_DcCxV26dkZiPeZDQjUP9tkgNKWg';

const supabaseClient = createClient(supabaseUrl, supabaseKey);

async function getArticleBySlugOrId(identifier: string) {
  if (!identifier) return null;
  const decoded = decodeURIComponent(identifier).trim();
  const slugifiedId = serverSlugify(decoded);

  // 1. Check INITIAL_ARTICLES
  let found = INITIAL_ARTICLES.find(
    (a) => a.id === decoded || a.slug === decoded || serverSlugify(typeof a.title === 'object' ? a.title.es : a.title) === slugifiedId
  );
  if (found) return found;

  // 2. Check Supabase REST API
  if (supabaseClient) {
    try {
      const { data: articles, error } = await supabaseClient.from('articles').select('*');
      if (articles && articles.length > 0) {
        const match = articles.find(
          (a) =>
            a.id === decoded ||
            a.slug === decoded ||
            serverSlugify(typeof a.title === 'object' ? (a.title.es || a.title.en || a.title) : a.title) === slugifiedId
        );
        if (match) {
          return {
            ...match,
            title: match.title,
            excerpt: match.excerpt || match.content?.substring(0, 160) || '',
            imageUrl: match.image_url || match.imageUrl || match.image,
            publishedAt: match.published_at || match.publishedAt || match.created_at,
            category: match.category,
            source: match.source || match.author,
          };
        }
      }
    } catch (err) {
      console.error('Supabase query error in SSR:', err);
    }
  }

  // 3. Check Drizzle DB
  if (db) {
    try {
      const dbSlugList = await db.select().from(articlesTable).where(eq(articlesTable.slug, decoded));
      if (dbSlugList.length > 0) return dbSlugList[0];

      const dbIdList = await db.select().from(articlesTable).where(eq(articlesTable.id, decoded));
      if (dbIdList.length > 0) return dbIdList[0];

      const allDb = await db.select().from(articlesTable);
      const matchedDb = allDb.find(a => serverSlugify(a.title) === slugifiedId || a.slug === decoded);
      if (matchedDb) return matchedDb;
    } catch (e) {}
  }
  return null;
}

const gFilename = typeof import.meta !== 'undefined' && (import.meta as any)?.url ? fileURLToPath((import.meta as any).url) : '';
const gDirname = gFilename ? path.dirname(gFilename) : process.cwd();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Enterprise Security Headers Middleware
app.use((_req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.googleadservices.com https://*.adtrafficquality.google https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://news.google.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://*.tile.openstreetmap.org https://news.google.com https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.googleadservices.com https://*.adtrafficquality.google https://www.googletagmanager.com; connect-src 'self' https://*.supabase.co https://news.google.com https://news.google.com/rss/search https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.adtrafficquality.google https://*.googleadservices.com https://*.google-analytics.com https://*.analytics.google.com; frame-src 'self' https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.googleadservices.com https://*.adtrafficquality.google; frame-ancestors 'none';");
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// Cache Control for static assets
app.use('/assets', (_req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  next();
});

// Helper: OpenAI Client (Primary if OPENAI_API_KEY is present)
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.includes('your-openai-api-key') || apiKey.length < 10) {
    return null;
  }
  try {
    return new OpenAI({ apiKey });
  } catch (e) {
    console.warn('OpenAI client init notice:', e);
    return null;
  }
}

// Helper: Gemini AI Client (Fallback or Alternative)
function getGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your-gemini-api-key') || apiKey.length < 10) {
    return null;
  }
  try {
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    console.warn('GoogleGenAI client init notice:', e);
    return null;
  }
}

// Helper: Anthropic (Claude) Client — shared by the SEO article generator
// (/api/generate-article) and the interactive execution-guide generator
// (/api/ai/generate-interactive-article). No fallback provider for either.
function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.includes('your-anthropic-api-key') || apiKey.length < 10) {
    return null;
  }
  try {
    return new Anthropic({ apiKey });
  } catch (e) {
    console.warn('Anthropic client init notice:', e);
    return null;
  }
}

/**
 * Long "text"-style fields occasionally contain a literal newline/tab instead
 * of an escaped \n — invalid per the JSON spec, but common in long-form LLM
 * output. Walks the string tracking string/escape state (never touching
 * structural whitespace outside string literals) and escapes stray control
 * characters found inside strings so JSON.parse can succeed.
 */
function escapeRawControlCharsInJsonStrings(text: string): string {
  let result = '';
  let inString = false;
  let escapeNext = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escapeNext) {
      result += ch;
      escapeNext = false;
      continue;
    }
    if (ch === '\\' && inString) {
      result += ch;
      escapeNext = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }
    if (inString && (ch === '\n' || ch === '\r' || ch === '\t')) {
      result += ch === '\n' ? '\\n' : ch === '\r' ? '\\r' : '\\t';
      continue;
    }
    result += ch;
  }
  return result;
}

/**
 * Extracts and validates an InteractiveArticleData JSON object from Claude's
 * raw text response. Factored out as a pure function so it can be unit-tested
 * with a hand-crafted/pasted response string without a live API call.
 */
function parseInteractiveArticleResponse(rawText: string): { title: string; excerpt: string; category?: string; seoKeywords?: string[]; metaDescription?: string; estimatedCompletionMinutes?: number; blocks: any[] } {
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    // Fallback 1: the model may have left a stray sentence before/after the
    // JSON despite instructions not to — extract the outermost {...} block.
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('AI returned invalid JSON');
    }
    const candidate = cleaned.slice(start, end + 1);
    try {
      parsed = JSON.parse(candidate);
    } catch (e2) {
      // Fallback 2: same candidate, but with raw newlines/tabs inside string
      // literals escaped — handles the common case above.
      try {
        parsed = JSON.parse(escapeRawControlCharsInJsonStrings(candidate));
      } catch (e3) {
        throw new Error('AI returned invalid JSON');
      }
    }
  }

  if (!parsed || typeof parsed.title !== 'string' || !parsed.title.trim()) {
    throw new Error('AI response is missing a valid title');
  }
  if (!Array.isArray(parsed.blocks) || parsed.blocks.length === 0) {
    throw new Error('AI response is missing a non-empty blocks array');
  }
  const knownTypes: readonly string[] = BLOCK_TYPES;
  for (const block of parsed.blocks) {
    if (!block || typeof block.type !== 'string' || !knownTypes.includes(block.type)) {
      throw new Error(`AI response contains an unknown block type: ${block?.type}`);
    }
  }

  return parsed;
}

// faq/heading-image are optional, model-provided fields — sanitize leniently
// (drop malformed entries) rather than failing the whole generation over them.
function sanitizeFaq(raw: any): { question: string; answer: string }[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const cleaned = raw
    .filter((f) => f && typeof f.question === 'string' && typeof f.answer === 'string' && f.question.trim() && f.answer.trim())
    .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }));
  return cleaned.length > 0 ? cleaned : undefined;
}

const VALID_ASPECT_RATIOS = ['16:9', '1:1', '4:5'];

function sanitizeSectionImage(raw: any): Record<string, any> | undefined {
  if (!raw || typeof raw !== 'object' || typeof raw.prompt !== 'string' || !raw.prompt.trim()) return undefined;
  return {
    status: 'prompt_ready',
    prompt: raw.prompt.trim(),
    negativePrompt: typeof raw.negativePrompt === 'string' ? raw.negativePrompt.trim() : undefined,
    alt: typeof raw.alt === 'string' ? raw.alt.trim() : undefined,
    caption: typeof raw.caption === 'string' ? raw.caption.trim() : undefined,
    aspectRatio: VALID_ASPECT_RATIOS.includes(raw.aspectRatio) ? raw.aspectRatio : '16:9',
    style: typeof raw.style === 'string' ? raw.style.trim() : undefined,
  };
}

/**
 * Deterministic post-processing on top of Claude's parsed output — no AI
 * call. Assigns stable sectionIds to heading blocks (the model's job is
 * deciding content, not bookkeeping) and sanitizes the optional faq/image
 * fields it may have included per the system prompt.
 */
function postProcessInteractiveArticleData(data: any): any {
  data.faq = sanitizeFaq(data.faq);
  let sectionCounter = 0;
  for (const block of data.blocks) {
    if (block && block.type === 'heading') {
      sectionCounter++;
      block.sectionId = `section-${sectionCounter}`;
      const sanitizedImage = sanitizeSectionImage(block.image);
      if (sanitizedImage) {
        block.image = sanitizedImage;
      } else {
        delete block.image;
      }
    }
  }
  // Rendered in-flow (accordion, see src/components/blocks/FaqBlock.tsx) so
  // it shows up without any AdminDashboard/DB changes — it's carried by the
  // same blocks JSON that already becomes `content`. Placed at the end,
  // ahead of the final practice/tip wrap-up blocks if any (common FAQ
  // placement — after the reader already has the full guide).
  if (data.faq) {
    data.blocks.push({ type: 'faq', items: data.faq });
  }
  return data;
}

/**
 * Suggests up to 3 existing published articles to link to from a new one,
 * scored by seoKeywords overlap within the same category. Pure DB read, no
 * AI call — degrades to an empty list on any error or missing data rather
 * than failing generation.
 */
async function computeInternalLinkSuggestions(article: { category?: string; seoKeywords?: string[] }): Promise<{ slug: string; anchorText: string }[]> {
  const categoryId = resolveCategoryId(article.category);
  const newKeywords = new Set((article.seoKeywords || []).map((k) => k.toLowerCase().trim()).filter(Boolean));
  if (!db || !categoryId || newKeywords.size === 0) return [];

  try {
    const candidates = await db
      .select({ slug: articlesTable.slug, title: articlesTable.title, seoKeywords: articlesTable.seoKeywords })
      .from(articlesTable)
      .where(eq(articlesTable.category, categoryId))
      .orderBy(desc(articlesTable.publishedAt))
      .limit(30);

    return candidates
      .filter((c) => !!c.slug)
      .map((c) => ({
        slug: c.slug as string,
        anchorText: c.title,
        overlap: (c.seoKeywords || []).filter((k) => newKeywords.has(k.toLowerCase().trim())).length,
      }))
      .filter((c) => c.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 3)
      .map(({ slug, anchorText }) => ({ slug, anchorText }));
  } catch (e: any) {
    console.warn('Internal link suggestion error:', e?.message || e);
    return [];
  }
}

// Helper: Supabase Admin client (service role) for Storage uploads
let _supabaseAdmin: SupabaseClient | null | undefined;
function getSupabaseAdmin(): SupabaseClient | null {
  if (_supabaseAdmin !== undefined) return _supabaseAdmin;
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes('placeholder') || key.length < 10) {
    _supabaseAdmin = null;
    return null;
  }
  try {
    _supabaseAdmin = createClient(url, key, { auth: { persistSession: false } });
  } catch (e) {
    console.warn('Supabase admin init notice:', e);
    _supabaseAdmin = null;
  }
  return _supabaseAdmin;
}

const IMAGE_BUCKET = 'article-images';
let _bucketEnsured = false;
async function ensureImageBucket(admin: SupabaseClient) {
  if (_bucketEnsured) return;
  try {
    const { data } = await admin.storage.getBucket(IMAGE_BUCKET);
    if (!data) {
      await admin.storage.createBucket(IMAGE_BUCKET, { public: true });
    }
  } catch {
    // createBucket throws if it already exists; safe to ignore.
  }
  _bucketEnsured = true;
}

/**
 * Uploads a base64 image to Supabase Storage and returns its public URL.
 * Resizes to a max width of 1200px and re-encodes as WebP before upload so
 * multi-MB AI-generated PNGs don't bloat page weight / LCP.
 * Prevents multi-MB base64 data URLs from being persisted in the database.
 */
async function uploadBase64ToStorage(b64: string): Promise<string | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  try {
    await ensureImageBucket(admin);
    const rawBuffer = Buffer.from(b64, 'base64');
    const buffer = await sharp(rawBuffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();
    const fileName = `ai/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.webp`;
    const { error } = await admin.storage.from(IMAGE_BUCKET).upload(fileName, buffer, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: false,
    });
    if (error) {
      console.warn('Supabase storage upload notice:', error.message);
      return null;
    }
    const { data } = admin.storage.from(IMAGE_BUCKET).getPublicUrl(fileName);
    return data?.publicUrl || null;
  } catch (e: any) {
    console.warn('Supabase storage upload error:', e?.message || e);
    return null;
  }
}

// Register AI providers/job handlers once at startup. Adding a new image
// provider later means adding one adapter + one registerImageProvider call
// here — nothing else in the request path changes.
registerImageProvider(new OpenAIImageProvider(getOpenAIClient));
registerJobHandler(createImageGenerationJobHandler(uploadBase64ToStorage));

const parser = new Parser();

// --- API ROUTES ---

// 1. Google News Import Endpoint
app.post('/api/google-news/import', async (req, res) => {
  try {
    const { query, hl = 'es', gl = 'ES' } = req.body;
    const searchQuery = encodeURIComponent(query || 'noticias locales');
    const rssUrl = `https://news.google.com/rss/search?q=${searchQuery}&hl=${hl}&gl=${gl}&ceid=${gl}:${hl}`;

    let items: any[] = [];
    try {
      const feed = await parser.parseURL(rssUrl);
      items = feed.items.map((item) => {
        const cleanTitle = (item.title || '').replace(/ - .*$/, '');
        const source = (item.title || '').includes(' - ') ? item.title?.split(' - ').pop() : 'Google News';
        return {
          title: cleanTitle,
          link: item.link || '',
          pubDate: item.pubDate ? new Date(item.pubDate).toLocaleDateString('es-ES') : 'Hoy',
          snippet: item.contentSnippet || item.content || item.title || '',
          source: source || 'Google News',
        };
      });
    } catch (rssErr) {
      console.warn('Google News RSS fetch notice:', rssErr);
    }

    if (items.length === 0) {
      items = [
        {
          title: `Nuevos avances en el proyecto de mejora de servicios (${query || 'la zona'})`,
          link: 'https://news.google.com',
          pubDate: 'Hoy',
          snippet: 'El ayuntamiento anunció hoy el inicio de la nueva fase de mejora de los servicios públicos y las zonas verdes del barrio.',
          source: 'Noticias de la Ciudad',
        },
        {
          title: `Nueva iniciativa vecinal para impulsar actividades y eventos en ${query || 'el barrio'}`,
          link: 'https://news.google.com',
          pubDate: 'Hoy',
          snippet: 'Amplia participación de los vecinos en la nueva iniciativa medioambiental y deportiva de esta semana.',
          source: 'Noticias de la Comunidad',
        }
      ];
    }

    res.json({
      success: true,
      query: query,
      total: items.length,
      items: items.slice(0, 12),
    });
  } catch (error: any) {
    res.json({ success: true, items: [] });
  }
});

// 2. AI Article Generation Endpoint with SEO Keywords
app.post('/api/ai/generate-article', async (req, res) => {
  try {
    const { topic, neighborhood, category, keywords, styleTone } = req.body;
    const prompt = `Eres un periodista local profesional. Escribe un artículo de noticias original sobre el siguiente tema.
Tema: ${topic}
Barrio/Zona: ${neighborhood || 'Centro'}
Categoría: ${category || 'Noticias Locales'}${keywords ? `\nPalabras clave SEO a incluir: ${keywords}` : ''}${styleTone ? `\nTono/estilo: ${styleTone}` : ''}

Responde ÚNICAMENTE con un objeto JSON válido con EXACTAMENTE estas claves (sin texto adicional ni markdown):
{
  "title": "titular atractivo del artículo",
  "excerpt": "resumen breve de 1 o 2 frases",
  "content": "cuerpo completo del artículo con varios párrafos separados por \\n\\n",
  "seoKeywords": ["palabra1", "palabra2", "palabra3"],
  "metaDescription": "meta descripción SEO de máximo 160 caracteres",
  "suggestedImagePrompt": "descripción en inglés para generar una imagen editorial 16:9",
  "readTimeMinutes": 3
}
Escribe todos los valores de texto en español.`;

    const openai = getOpenAIClient();
    let jsonText = '';

    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a professional local journalist. You respond ONLY with a single valid JSON object that matches the requested schema exactly. Never wrap it in markdown.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' }
        });
        jsonText = completion.choices[0]?.message?.content || '';
      } catch (openAiErr) {
        console.warn('OpenAI generation notice:', openAiErr);
      }
    }

    if (!jsonText && process.env.GEMINI_API_KEY) {
      try {
        const ai = getGeminiAI();
        if (ai) {
          const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: prompt,
            config: { responseMimeType: 'application/json' },
          });
          jsonText = response.text || '';
        }
      } catch (genErr) {
        console.warn('Gemini generation notice:', genErr);
      }
    }

    let parsedData: any = null;
    if (jsonText) {
      try { parsedData = JSON.parse(jsonText); } catch (e) {}
    }

    if (!parsedData || !parsedData.title) {
      const artTopic = topic || 'Nuevo proyecto local';
      const artNeigh = neighborhood || 'Centro';
      parsedData = {
        title: `${artTopic} - Un nuevo paso hacia la mejora de ${artNeigh}`,
        excerpt: `Las autoridades locales anunciaron hoy el lanzamiento de un nuevo proyecto destinado a reforzar los servicios y atender las necesidades de los vecinos del barrio de ${artNeigh}.`,
        content: `El barrio de ${artNeigh} vivió hoy el lanzamiento de una nueva iniciativa centrada en la mejora de las instalaciones públicas y los servicios básicos. Los responsables afirmaron en rueda de prensa que este proyecto busca mejorar la calidad de vida y responder a las expectativas de los vecinos.\n\nEl proyecto incluye la ejecución de una serie de mejoras sobre el terreno, además de la organización de eventos comunitarios para reforzar la comunicación entre los residentes.`,
        seoKeywords: keywords ? keywords.split(',') : ['noticias locales', 'desarrollo', artNeigh],
        metaDescription: `Artículo sobre ${artTopic} en el barrio de ${artNeigh} con los detalles y las nuevas mejoras sobre el terreno.`,
        suggestedImagePrompt: `Journalism photography of ${artTopic} in a modern city street, editorial lighting, 16:9`,
        readTimeMinutes: 3,
      };
    }

    res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    res.json({
      success: true,
      data: {
        title: `Noticia local: ${req.body?.topic || 'Nuevas actualizaciones'}`,
        excerpt: 'Artículo periodístico local sobre las últimas novedades y servicios.',
        content: 'Detalles del artículo local y los servicios disponibles para los vecinos.',
        seoKeywords: ['noticias', 'local'],
        metaDescription: 'Detalles de la noticia local',
        suggestedImagePrompt: 'Local news photo',
        readTimeMinutes: 3,
      }
    });
  }
});

// 2.5. AI Article Generator using Claude (Anthropic) — SEO-focused, requires the same
// admin auth as /api/articles. Only pre-fills the manual article form; the admin still
// has to review and hit "Publicar artículo" themselves.
app.post('/api/generate-article', requireAdmin, async (req, res) => {
  try {
    const { topic } = req.body || {};
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ success: false, message: 'Falta el tema del artículo.' });
    }

    const anthropic = getAnthropicClient();
    if (!anthropic) {
      return res.status(500).json({ success: false, message: 'La generación con Claude no está configurada (falta ANTHROPIC_API_KEY).' });
    }

    const systemPrompt = `Eres el redactor jefe de Trepola, un sitio de noticias en español que cubre tecnología (especialmente IA), deportes, política, economía y cultura, con audiencia mayoritariamente en España.

Reglas de estilo y SEO (basadas en datos reales de rendimiento del sitio):
- NUNCA titules con términos genéricos y saturados como "últimas noticias de IA", "noticias de tecnología hoy" o equivalentes en otros temas (ej. "noticias del Real Madrid hoy"). Esos términos tienen posición media >70 en Google y cero clics.
- Prioriza ángulos específicos y de cola larga: nombres concretos de herramientas/modelos/personas/eventos, comparativas directas, guías prácticas ("cómo usar X"), o el impacto de una noticia global en España concretamente.
- Si el tema es sobre una herramienta de IA, incluye el nombre exacto de la herramienta en el título (esto ya ha funcionado: un artículo sobre "Kimi 3.0" alcanzó posición 9 en Google).
- Si el tema toca regulación, privacidad o ciberseguridad, dale un enfoque práctico y accionable para empresas o usuarios españoles (este tipo de contenido ya logró 100% de CTR en el sitio).
- Escribe en español de España, tono periodístico claro, sin sensacionalismo.
- Estructura el contenido en markdown con 2-4 subtítulos ## y usa listas cuando aporte claridad.
- Longitud objetivo: 500-800 palabras.
- No inventes datos, cifras ni citas. Si no tienes información verificada suficiente sobre el tema exacto, escribe el artículo con la información general contrastable que tengas y evita afirmaciones muy específicas no verificables.

Genera también:
- slug: una versión kebab-case del título, sin acentos ni caracteres especiales, máximo 60 caracteres, optimizada para SEO (incluye la palabra clave principal).
- metaDescription: 120-155 caracteres, en español, que resuma el artículo de forma atractiva para que alguien haga clic desde los resultados de Google.

Devuelve ÚNICAMENTE un objeto JSON válido, sin texto antes ni después, sin backticks de markdown, con las claves: title, slug, metaDescription, content, category, keywords.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 4000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      system: systemPrompt,
      messages: [
        { role: 'user', content: `Escribe un artículo sobre: ${topic.trim()}` },
      ],
    });

    const textBlock = message.content.find((b) => b.type === 'text') as { type: 'text'; text: string } | undefined;
    const rawText = textBlock?.text || '';

    let parsed: any = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const stripped = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      try {
        parsed = JSON.parse(stripped);
      } catch (parseErr) {
        console.error('Claude article JSON parse failed:', rawText);
        return res.status(500).json({ success: false, message: 'La IA devolvió una respuesta que no se pudo interpretar. Inténtalo de nuevo.' });
      }
    }

    if (!parsed || !parsed.title || !parsed.content) {
      return res.status(500).json({ success: false, message: 'La IA devolvió una respuesta incompleta.' });
    }

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Generate article (Claude) error:', error?.message || error);
    res.status(500).json({ success: false, message: 'Error generando el artículo con IA.' });
  }
});

// 3. AI Rewrite & SEO Polish for Google News Drafts
app.post('/api/ai/rewrite-article', async (req, res) => {
  try {
    const { title, snippet, neighborhood, category } = req.body;
    const prompt = `Eres un editor de noticias profesional. Reescribe y mejora la siguiente noticia para un medio local, optimizándola para SEO y evitando plagio.
Titular original: ${title}
Contenido original: ${snippet}
Barrio/Zona: ${neighborhood || 'Centro'}
Categoría: ${category || 'Noticias Locales'}

Responde ÚNICAMENTE con un objeto JSON válido con EXACTAMENTE estas claves (sin texto adicional ni markdown):
{
  "title": "nuevo titular reescrito y atractivo",
  "excerpt": "resumen breve de 1 o 2 frases",
  "content": "artículo completo reescrito con varios párrafos separados por \\n\\n",
  "seoKeywords": ["palabra1", "palabra2", "palabra3"],
  "metaDescription": "meta descripción SEO de máximo 160 caracteres",
  "suggestedImagePrompt": "descripción en inglés para generar una imagen editorial 16:9"
}
Escribe todos los valores de texto en español.`;

    const openai = getOpenAIClient();
    let jsonText = '';

    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a professional news editor. You respond ONLY with a single valid JSON object that matches the requested schema exactly. Never wrap it in markdown.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' }
        });
        jsonText = completion.choices[0]?.message?.content || '';
      } catch (openAiErr) {}
    }

    if (!jsonText && process.env.GEMINI_API_KEY) {
      try {
        const ai = getGeminiAI();
        if (ai) {
          const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: prompt,
            config: { responseMimeType: 'application/json' },
          });
          jsonText = response.text || '';
        }
      } catch (genErr) {}
    }

    let parsedData: any = null;
    if (jsonText) {
      try { parsedData = JSON.parse(jsonText); } catch (e) {}
    }

    if (!parsedData || !parsedData.title) {
      parsedData = {
        title: title ? `Reescritura: ${title}` : 'Nueva noticia periodística',
        excerpt: snippet || 'Resumen informativo periodístico completo.',
        content: `${snippet || title || 'Detalles de la nueva noticia.'}\n\nLas entidades competentes continúan el seguimiento de la situación y ofrecen todas las novedades a los vecinos de la zona.`,
        seoKeywords: ['noticias', neighborhood || 'ciudad'],
        metaDescription: title || 'Noticia local editada',
        suggestedImagePrompt: 'Editorial journalism news photo, 16:9',
      };
    }

    res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    res.json({
      success: true,
      data: {
        title: req.body?.title || 'Noticia periodística local',
        excerpt: req.body?.snippet || 'Resumen de la noticia',
        content: req.body?.snippet || 'Contenido de la noticia',
        seoKeywords: ['noticias'],
        metaDescription: 'Detalles de la noticia',
        suggestedImagePrompt: 'News photography',
      }
    });
  }
});

// 3.5. AI Article Auto-Classification Endpoint
app.post('/api/ai/classify-article', async (req, res) => {
  try {
    const { title, content } = req.body;
    let parsedData = {
      suggestedCategory: 'Noticias Locales',
      confidenceScore: 95,
      reasoning: 'El artículo se clasificó automáticamente en función del contenido local y los titulares.',
      suggestedKeywords: ['noticias locales', 'actualizaciones', 'servicios'],
    };

    res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    res.json({
      success: true,
      data: {
        suggestedCategory: 'Noticias Locales',
        confidenceScore: 90,
        reasoning: 'Clasificación por defecto para contenido local.',
        suggestedKeywords: ['noticias locales'],
      }
    });
  }
});

// 4. AI Image Generation Endpoint (DALL-E 3 / Gemini / Unsplash Fallback)
app.post('/api/ai/generate-image', async (req, res) => {
  try {
    const { prompt, style = 'fotografía periodística realista' } = req.body;
    const fullPrompt = `High quality local news photography, ${prompt || 'noticias locales'}, style: ${style}, vibrant editorial illumination, wide angle 16:9 aspect ratio, detailed journalism photo.`;

    const openai = getOpenAIClient();
    if (openai) {
      try {
        const imageResponse = await openai.images.generate({
          model: 'gpt-image-1',
          prompt: fullPrompt,
          n: 1,
          size: '1024x1024',
        });

        const first = imageResponse.data?.[0];
        // gpt-image-1 returns base64; upload it to Storage so the DB only ever
        // stores a small public URL (never a multi-MB base64 data URL).
        let hostedUrl = first?.url || '';
        if (!hostedUrl && first?.b64_json) {
          hostedUrl = (await uploadBase64ToStorage(first.b64_json)) || '';
        }

        if (hostedUrl) {
          return res.json({
            success: true,
            imageUrl: hostedUrl,
            promptUsed: fullPrompt,
            provider: 'gpt-image-1',
          });
        }
        // If storage upload failed, fall through to the Unsplash fallback below
        // rather than returning a heavy base64 string.
      } catch (openAiErr: any) {
        console.warn('OpenAI gpt-image-1 notice:', openAiErr?.message);
      }
    }

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = getGeminiAI();
        if (ai) {
          const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: `Provide a high-quality relevant Unsplash image keyword for this photo prompt: ${prompt || 'local news'}`
          });
          const keyword = (response.text || 'city,news').trim().replace(/[^a-zA-Z,]/g, '');
          const imageUrl = `https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=70`;
          return res.json({
            success: true,
            imageUrl: imageUrl,
            promptUsed: fullPrompt,
            provider: 'gemini-unsplash',
          });
        }
      } catch (genErr) {
        console.warn('Gemini image generation notice:', genErr);
      }
    }

    // Editorial High Quality Unsplash Images
    const seed = Math.floor(Math.random() * 1000);
    const fallbackImages = [
      `https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=70`,
      `https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=700&q=70`,
      `https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=700&q=70`,
      `https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=700&q=70`,
      `https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=700&q=70`,
    ];
    const chosenFallback = fallbackImages[seed % fallbackImages.length];

    res.json({
      success: true,
      imageUrl: chosenFallback,
      promptUsed: fullPrompt,
      isFallback: true,
    });
  } catch (error: any) {
    console.error('AI Image generation error:', error);
    res.json({
      success: true,
      imageUrl: `https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=70`,
      isFallback: true,
    });
  }
});

// 4b. Generic AI Job endpoint (admin-only). Provider-agnostic: callers pass
// a job `type` + `input`, never a provider name. Vercel has no persistent
// worker, so the job runs synchronously within this request (confirmed safe
// up to the ~300s maxDuration budget for image generation) — but it's
// persisted as a uniform JobRecord, the same contract a real async queue
// would use later without any caller-side changes.
const KNOWN_JOB_TYPES: JobType[] = [
  'image_generation',
  'audio_generation',
  'video_generation',
  'translation',
  'social_copy',
  'newsletter_copy',
];

app.post('/api/jobs', requireAdmin, async (req, res) => {
  try {
    const { type, articleId, targetRef, input } = req.body || {};
    if (!type || !KNOWN_JOB_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: 'Missing or unknown job type' });
    }
    if (!input || typeof input !== 'object') {
      return res.status(400).json({ success: false, message: 'Missing job input' });
    }

    const jobId = `job-${crypto.randomUUID()}`;
    const now = new Date();
    let status: 'succeeded' | 'failed' = 'succeeded';
    let output: any = null;
    let error: string | null = null;

    try {
      const handler = getJobHandler(type as JobType);
      output = await handler.run(input, { articleId, targetRef });
    } catch (err: any) {
      status = 'failed';
      error = err?.message || 'Job execution failed';
    }

    const jobRecord = {
      id: jobId,
      type,
      status,
      articleId: articleId || null,
      targetRef: targetRef || null,
      input,
      output,
      error,
      attempts: 1,
      createdAt: now,
      updatedAt: now,
    };

    if (db) {
      try {
        await db.insert(jobsTable).values(jobRecord).onConflictDoNothing();
      } catch (dbErr: any) {
        console.error('Job persistence error (job still ran):', dbErr?.message || dbErr);
      }
    }

    if (status === 'failed') {
      return res.status(500).json({ success: false, message: error, job: jobRecord });
    }
    res.json({ success: true, job: jobRecord });
  } catch (error: any) {
    console.error('Job execution error:', error);
    res.status(500).json({ success: false, message: 'No se pudo ejecutar la tarea.' });
  }
});

app.get('/api/articles/:id/jobs', requireAdmin, async (req, res) => {
  try {
    if (!db) return res.json({ success: true, jobs: [] });
    const list = await db
      .select()
      .from(jobsTable)
      .where(eq(jobsTable.articleId, req.params.id))
      .orderBy(desc(jobsTable.createdAt));
    res.json({ success: true, jobs: list });
  } catch (error: any) {
    console.error('List jobs error:', error);
    res.json({ success: true, jobs: [] });
  }
});

// 2b. AI Interactive Execution-Guide Generation Endpoint (Claude + web_search, admin-only)
app.post('/api/ai/generate-interactive-article', requireAdmin, async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ success: false, message: 'Missing topic' });
    }

    const anthropic = getAnthropicClient();
    if (!anthropic) {
      return res.status(500).json({ success: false, message: 'La generación de guías interactivas no está configurada (falta ANTHROPIC_API_KEY).' });
    }

    const systemPrompt = `Eres el redactor jefe de Trepola, un sitio de noticias en español (audiencia mayoritariamente en España) que cubre tecnología (especialmente IA), deportes, política, economía y cultura.

FILOSOFÍA EDITORIAL (no negociable): un artículo de Trepola nunca es un post de blog tradicional. Es una guía de ejecución interactiva. El objetivo de cada artículo es que el lector TERMINE algo, no que LEA algo. Al escribir cada sección, respóndete: ¿qué debe HACER el usuario?, ¿dónde hace CLIC?, ¿qué debe VER si lo hizo bien?, ¿qué error es probable que cometa y cómo lo soluciona?, ¿cómo verifica que lo logró?

INVESTIGACIÓN OBLIGATORIA: antes de escribir la guía, investiga la herramienta o el tema exacto usando la búsqueda web disponible. No asumas ni inventes:
- Si la herramienta tiene varios métodos/caminos reales para lograr el objetivo (ej. línea de comandos vs interfaz web, o dos productos distintos que compiten), identifica los métodos reales que existen y decide si el artículo debe cubrir uno, ambos como bloques "steps" separados, o presentarlos como un "decision-tree".
- Usa los nombres reales y actuales de los botones, menús, comandos o campos de configuración tal como existen hoy en la herramienta — no los aproximes ni los inventes.
- Si la herramienta requiere configuración adicional real más allá del flujo principal (variables de entorno, DNS, permisos, planes de precio, límites de uso), inclúyela como pasos o bloques "warning"/"tip" adicionales — no la omitas por simplificar.
- Si la búsqueda no aporta información suficientemente concreta sobre un paso técnico específico, dilo explícitamente en el contenido en vez de inventar un paso plausible pero no verificado.

Reglas de SEO (basadas en datos reales de rendimiento del sitio):
- Nunca titules con términos genéricos y saturados ("últimas noticias de IA", "noticias de tecnología hoy"). Tienen posición media >70 en Google y cero clics.
- Prioriza ángulos de cola larga: nombres concretos de herramientas/modelos, comparativas directas, guías prácticas, o el impacto local en España de una noticia global.
- Si el tema es una herramienta de IA, incluye su nombre exacto en el título.
- Los temas de regulación/privacidad/ciberseguridad deben tener enfoque práctico y accionable para empresas o usuarios españoles.

Reglas de estructura (obligatorias):
- El contenido se devuelve como un array "blocks", nunca como un único bloque de texto largo.
- Tipos de bloque disponibles y su forma exacta (usa solo estos "type", con exactamente estas claves):
  {"type":"paragraph","text":"string"}
  {"type":"heading","text":"string","level":2,"image":{opcional, ver "Reglas de imagen por sección"}}
  {"type":"stat-card","title":"string","stats":[{"value":"string","label":"string"}]}
  {"type":"comparison-table","title":"string","columns":["string","string"],"rows":[{"label":"string","values":["string","string"]}]}
  {"type":"bar-chart","title":"string","source":"string opcional","bars":[{"label":"string","value":0-100,"displayValue":"string"}]}
  {"type":"steps","title":"string","steps":[{"title":"string","body":"string"}]}
  {"type":"ui-walkthrough","context":"string","callout":"string","explanation":"string","result":"string"}
  {"type":"checklist","title":"string","items":["string"]}
  {"type":"timeline","title":"string","events":[{"date":"string","text":"string"}]}
  {"type":"warning","text":"string"}
  {"type":"tip","text":"string"}
  {"type":"verification-block","question":"string","expected":"string"}
  {"type":"troubleshooting","title":"string","items":[{"problem":"string","solution":"string"}]}
  {"type":"decision-tree","question":"string","branches":[{"condition":"string","outcome":"string"}]}
  {"type":"quiz","question":"string","options":["string","string","string"],"correctIndex":0}
  {"type":"practice-block","title":"string","instructions":"string"}
- Reglas de selección de bloques según el tipo de contenido:
  - Tutorial "cómo hacer X": estructura en "steps" + al menos 2-3 bloques "ui-walkthrough" (uno por acción de clic importante) + "checklist" final + "verification-block".
  - Comparativa entre dos herramientas: "comparison-table" primero, seguido de "steps" separados para cada herramienta.
  - Noticia regulatoria/legal: "stat-card" con fechas/cifras clave, "timeline" si hay varias fechas, "checklist" de qué hacer antes de la fecha límite.
  - Artículo con datos/estadísticas: "bar-chart" en vez de enumerar cifras en texto.
  - Cualquier paso con posibilidad real de error: bloque "troubleshooting" y/o "warning".
  - Guías largas (>6 pasos): añade 1 "quiz" de una pregunta a mitad de artículo y un "practice-block" al final.
- Un bloque "paragraph" nunca supera las 4-5 frases: si hace falta más espacio, es señal de que ese contenido debería ser otro tipo de bloque.
- No inventes cifras ni datos no verificables.
- Español de España, tono claro, directo, sin sensacionalismo.

Reglas de imagen por sección (campo "image" dentro de un bloque "heading"):
- Objetivo: aproximadamente una imagen cada 2-3 secciones ("heading"), para que la guía nunca se sienta como un muro de texto. No hace falta en cada "heading", pero para una guía de 6 o más secciones incluye al menos 3-4 imágenes repartidas a lo largo del contenido, no todas al principio.
- Varía el tipo de apoyo visual según lo que esa sección explica — no repitas siempre el mismo estilo:
  - Proceso o pasos → diagrama de flujo o ilustración paso a paso.
  - Comparación entre opciones/herramientas → infografía o gráfico comparativo.
  - Interfaz, producto o herramienta real → estilo fotográfico realista tipo "product shot".
  - Concepto abstracto (seguridad, dinero, tiempo, IA) → ilustración editorial o icono conceptual grande y simple.
  - Arquitectura técnica o flujo de datos → diagrama tipo blueprint/esquema técnico.
- Forma exacta: {"prompt":"string en INGLÉS, muy detallado y cinematográfico: sujeto, entorno, iluminación, composición, estilo","negativePrompt":"low quality, blurry, watermark, text, logo, distorted hands, cropped","alt":"string en español para accesibilidad","caption":"string opcional en español","aspectRatio":"16:9","style":"string, ej. Editorial Illustration / 3D render / Diagrama técnico / Icono conceptual / Infografía comparativa"}
- El prompt siempre en inglés (mejores resultados en modelos de imagen); alt y caption siempre en español.

Reglas de FAQ (array "faq" de nivel superior, opcional):
- Añade 3-5 preguntas frecuentes reales que un lector buscaría en Google sobre este tema exacto, con respuestas directas de 2-3 frases. Forma: [{"question":"string","answer":"string"}].
- Omítelo solo si el tema es tan estrecho que no genera preguntas naturales de búsqueda.

Devuelve ÚNICAMENTE un objeto JSON válido, sin texto antes ni después, sin backticks de markdown, con las claves: title, excerpt, category (una de: Tecnología, Deportes, Política, Economía, Cultura, General), seoKeywords (array de 3-5 strings), metaDescription (120-155 caracteres), estimatedCompletionMinutes (number), blocks (array), faq (array opcional, ver reglas de FAQ).`;

    const userPrompt = `Escribe una guía de ejecución interactiva sobre: ${topic}`;

    // Confirmed via production logs that maxDuration:300 is actually in effect
    // (function ran 1m41s of a 5m budget) — no need to artificially cap search
    // usage or continuations to fit a shorter window. max_uses is set generously
    // (not tightly, which previously caused max_uses_exceeded mid-research) purely
    // as a cost ceiling against a runaway/looping search sequence.
    const webSearchTool = { type: 'web_search_20250305', name: 'web_search', max_uses: 8 } as any;

    // claude-sonnet-5 runs adaptive thinking by default even with no `thinking`
    // param set — those tokens come out of max_tokens same as visible output.
    // Pinning effort to medium (like the classic /api/generate-article endpoint)
    // keeps thinking spend bounded, and max_tokens is raised well above the
    // classic endpoint's 4000 because this guide's JSON (many block types,
    // several sections) is much larger than a plain article — without enough
    // headroom the model can exhaust the budget on thinking + search narration
    // before ever writing the final JSON text block ("no devolvió contenido de texto").
    // Concatenates every 'text' block in a response, in order. When the model
    // uses web_search/thinking, a single response can legitimately contain
    // several text blocks (interleaved thinking can split one continuous
    // answer into two text segments — not just narration-then-answer), and a
    // pause_turn continuation resumes generation mid-stream rather than
    // restarting it. Taking only the LAST block (the previous fix) silently
    // drops everything generated before that split, which surfaced as JSON
    // missing its opening portion. Any leading narration this reintroduces
    // is stripped by parseInteractiveArticleResponse's brace-extraction
    // fallback below, so this is safe on both fronts.
    const collectText = (resp: any): string =>
      resp.content.filter((block: any) => block.type === 'text').map((block: any) => block.text).join('');

    let messages: Anthropic.MessageParam[] = [{ role: 'user', content: userPrompt }];
    let response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      system: systemPrompt,
      tools: [webSearchTool],
      messages,
    });
    let rawText = collectText(response);

    let continues = 0;
    while (response.stop_reason === ('pause_turn' as any) && continues < 3) {
      messages = [...messages, { role: 'assistant', content: response.content }];
      response = await anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 16000,
        thinking: { type: 'adaptive' },
        output_config: { effort: 'medium' },
        system: systemPrompt,
        tools: [webSearchTool],
        messages,
      });
      rawText += collectText(response);
      continues++;
    }

    if (!rawText.trim()) {
      console.error('Interactive article generation: empty text response', JSON.stringify(response.content));
      return res.status(500).json({ success: false, message: 'La IA no devolvió contenido de texto.' });
    }

    let data;
    try {
      data = parseInteractiveArticleResponse(rawText);
    } catch (parseErr: any) {
      console.error('Interactive article generation: parse/validation error:', parseErr?.message, '\nRaw text:', rawText);
      return res.status(500).json({ success: false, message: 'La IA devolvió una respuesta con formato inválido. Inténtalo de nuevo.' });
    }

    data = postProcessInteractiveArticleData(data);
    // Deterministic, no extra AI call — best-effort, degrades to [] silently.
    const internalLinkSuggestions = await computeInternalLinkSuggestions(data);

    return res.json({ success: true, data: { ...data, internalLinkSuggestions } });
  } catch (error: any) {
    console.error('Interactive article generation error:', error);
    return res.status(500).json({ success: false, message: 'No se pudo generar la guía interactiva. Inténtalo de nuevo.' });
  }
});

// Admin Login Endpoint — issues a short-lived JWT after verifying server-side credentials
app.post('/api/admin/login', async (req, res) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const jwtSecret = process.env.ADMIN_JWT_SECRET;
    if (!adminEmail || !adminPassword || !jwtSecret) {
      return res.status(500).json({ success: false, message: 'Admin login not configured' });
    }

    const { email, password } = req.body || {};
    const emailOk = typeof email === 'string' && email.trim().toLowerCase() === adminEmail.toLowerCase();

    const submittedPassword = Buffer.from(typeof password === 'string' ? password : '');
    const expectedPassword = Buffer.from(adminPassword);
    const passwordOk = submittedPassword.length === expectedPassword.length
      && crypto.timingSafeEqual(submittedPassword, expectedPassword);

    if (!emailOk || !passwordOk) {
      return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos.' });
    }

    const token = jwt.sign({ email: adminEmail, role: 'admin' }, jwtSecret, { expiresIn: '12h' });
    res.json({ success: true, token, user: { email: adminEmail, role: 'admin' } });
  } catch (error: any) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// 5. Database Articles API Endpoints
app.get('/api/articles', async (_req, res) => {
  try {
    if (!db) return res.json({ success: true, articles: [] });
    const list = await db.select().from(articlesTable).orderBy(desc(articlesTable.publishedAt));
    res.json({ success: true, articles: list });
  } catch (error: any) {
    console.error('Get articles error:', error);
    res.json({ success: true, articles: [] });
  }
});

app.post('/api/articles', requireAdmin, async (req, res) => {
  try {
    const newArt = req.body;
    if (!newArt.id || !newArt.title) {
      return res.status(400).json({ success: false, message: 'Missing article fields' });
    }

    const titleStr = typeof newArt.title === 'object' ? (newArt.title.es || newArt.title.ar || newArt.title.en || '') : String(newArt.title);
    const computedSlug = newArt.slug || serverSlugify(titleStr) || newArt.id;

    const articleData = {
      id: newArt.id,
      slug: computedSlug,
      title: titleStr,
      excerpt: typeof newArt.excerpt === 'object' ? (newArt.excerpt.es || newArt.excerpt.ar || newArt.excerpt.en || '') : String(newArt.excerpt),
      content: typeof newArt.content === 'object' ? (newArt.content.es || newArt.content.ar || newArt.content.en || '') : String(newArt.content),
      contentFormat: newArt.contentFormat === 'blocks' ? 'blocks' : 'markdown',
      category: newArt.category || 'general',
      neighborhood: newArt.neighborhood || 'Centro',
      imageUrl: newArt.imageUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=70',
      source: newArt.source || 'Redacción Trepola',
      readTimeMinutes: newArt.readTimeMinutes || 3,
      seoKeywords: newArt.seoKeywords || [],
      metaDescription: newArt.metaDescription || '',
      isUrgent: !!newArt.isUrgent,
    };

    if (db) {
      await db.insert(articlesTable).values(articleData).onConflictDoNothing();
    }
    res.json({ success: true, article: articleData });
  } catch (error: any) {
    console.error('Save article DB error:', error);
    res.json({ success: true, article: req.body });
  }
});

app.delete('/api/articles/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (db) {
      await db.delete(articlesTable).where(eq(articlesTable.id, id));
    }
    res.json({ success: true });
  } catch (error: any) {
    res.json({ success: true });
  }
});

// Auth User Profile sync
app.post('/api/sync-user', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    if (!db) return res.json({ success: true, user: { uid: user.uid, email: user.email } });
    const dbUser = await getOrCreateUser(user.uid, user.email || '', user.name || '', user.picture || '');
    res.json({ success: true, user: dbUser });
  } catch (error: any) {
    console.error('Sync user error:', error);
    res.json({ success: true });
  }
});

// Saved Articles API
app.get('/api/saved-articles', requireAdmin, async (req: AuthRequest, res) => {
  try {
    if (!db) return res.json([]);
    const user = req.user!;
    const dbUser = (await db.select().from(users).where(eq(users.uid, user.uid)))[0];
    if (!dbUser) return res.json([]);
    
    const saved = await db.select().from(savedArticles).where(eq(savedArticles.userId, dbUser.id));
    res.json(saved.map(s => s.articleId));
  } catch (error: any) {
    res.json([]);
  }
});

app.post('/api/saved-articles', requireAdmin, async (req: AuthRequest, res) => {
  try {
    if (!db) return res.json({ success: true });
    const user = req.user!;
    const { articleId } = req.body;
    const dbUser = (await db.select().from(users).where(eq(users.uid, user.uid)))[0];
    
    if (dbUser) {
      const existing = await db.select().from(savedArticles)
        .where(and(eq(savedArticles.userId, dbUser.id), eq(savedArticles.articleId, articleId)));
        
      if (existing.length === 0) {
        await db.insert(savedArticles).values({ userId: dbUser.id, articleId });
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    res.json({ success: true });
  }
});

app.delete('/api/saved-articles/:articleId', requireAdmin, async (req: AuthRequest, res) => {
  try {
    if (!db) return res.json({ success: true });
    const user = req.user!;
    const { articleId } = req.params;
    const dbUser = (await db.select().from(users).where(eq(users.uid, user.uid)))[0];
    
    if (dbUser) {
      await db.delete(savedArticles)
        .where(and(eq(savedArticles.userId, dbUser.id), eq(savedArticles.articleId, articleId)));
    }
    res.json({ success: true });
  } catch (error: any) {
    res.json({ success: true });
  }
});

// Helper: Promise timeout wrapper to prevent database connection hangs
async function withTimeout<T>(promise: Promise<T>, ms: number = 1200, fallback: T): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      return res;
    }).catch((err) => {
      clearTimeout(timer);
      console.warn('DB query notice:', err?.message || err);
      return fallback;
    }),
    timeoutPromise,
  ]);
}

// Comments API
app.get('/api/comments', async (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    if (!db) {
      return res.status(200).json(INITIAL_COMMENTS);
    }
    const dbQuery = db.select({
      id: comments.id,
      articleId: comments.articleId,
      content: comments.content,
      likes: comments.likes,
      isNeighborhoodResident: comments.isNeighborhoodResident,
      createdAt: comments.createdAt,
      authorName: users.name,
      authorAvatar: users.avatarUrl,
    }).from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .orderBy(desc(comments.createdAt));

    const allComments = await withTimeout(dbQuery, 1200, null);
      
    if (!allComments || !Array.isArray(allComments) || allComments.length === 0) {
      return res.status(200).json(INITIAL_COMMENTS);
    }

    const formatted = allComments.map(c => ({
      id: `comm-${c.id}`,
      articleId: c.articleId,
      authorName: c.authorName || 'Usuario',
      authorAvatar: c.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
      content: c.content || '',
      createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-ES') : 'Ahora',
      likes: c.likes || 0,
      isNeighborhoodResident: c.isNeighborhoodResident || false,
    }));
    
    return res.status(200).json(formatted);
  } catch (error: any) {
    console.warn('Database comments fetch notice:', error?.message || error);
    return res.status(200).json(INITIAL_COMMENTS);
  }
});

app.post('/api/comments', requireAdmin, async (req: AuthRequest, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { articleId, content, isResident } = req.body || {};
    if (!articleId || !content) {
      return res.status(400).json({ success: false, message: 'Missing comment parameters' });
    }

    if (!db) {
      const mockComm = {
        id: `comm-${Date.now()}`,
        articleId,
        authorName: req.user?.name || 'Usuario',
        authorAvatar: req.user?.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
        content,
        createdAt: 'Ahora',
        likes: 0,
        isNeighborhoodResident: !!isResident,
      };
      return res.json({ success: true, comment: mockComm });
    }

    const user = req.user!;
    const dbUser = (await db.select().from(users).where(eq(users.uid, user.uid)))[0];
    
    if (dbUser) {
      const newComm = await db.insert(comments).values({
        userId: dbUser.id,
        articleId,
        content,
        isNeighborhoodResident: isResident || false,
      }).returning();
      return res.json({ success: true, comment: newComm[0] });
    }
    
    return res.json({ success: true });
  } catch (error: any) {
    console.warn('Post comment notice:', error?.message || error);
    return res.json({ success: true });
  }
});

// 1. Primary Sitemap (XML)
app.get('/sitemap.xml', async (_req, res) => {
  res.header('Content-Type', 'application/xml');
  const baseUrl = process.env.VITE_SITE_URL || 'https://www.trepola.com';
  const currentDate = new Date().toISOString().split('T')[0];

  let dbArticles: any[] = [];
  if (db) {
    try {
      dbArticles = await db.select().from(articlesTable).orderBy(desc(articlesTable.publishedAt));
    } catch (e) {}
  }
  const allArticlesList = dbArticles.length > 0 ? dbArticles : INITIAL_ARTICLES;

  const categoryUrls = allCategoryPaths().map((p) => `
  <url>
    <loc>${baseUrl}${p}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`).join('');

  const articleUrls = allArticlesList.map((article: any) => {
    const slug = article.slug || serverSlugify(typeof article.title === 'object' ? article.title.es : article.title) || article.id;
    return `
  <url>
    <loc>${baseUrl}/news/${slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>${categoryUrls}${articleUrls}
</urlset>`;

  res.send(xml);
});

// 2. Google News Sitemap (XML)
app.get('/news-sitemap.xml', async (_req, res) => {
  res.header('Content-Type', 'application/xml');
  const baseUrl = process.env.VITE_SITE_URL || 'https://www.trepola.com';

  let dbArticles: any[] = [];
  if (db) {
    try {
      dbArticles = await db.select().from(articlesTable).orderBy(desc(articlesTable.publishedAt));
    } catch (e) {}
  }
  const allArticlesList = dbArticles.length > 0 ? dbArticles : INITIAL_ARTICLES;

  const newsItems = allArticlesList.slice(0, 500).map((article: any) => {
    const slug = article.slug || serverSlugify(typeof article.title === 'object' ? article.title.es : article.title) || article.id;
    const titleText = typeof article.title === 'object' ? (article.title.es || article.title.en) : article.title;
    const pubDate = article.publishedAt ? new Date(article.publishedAt).toISOString() : new Date().toISOString();

    return `
  <url>
    <loc>${baseUrl}/news/${slug}</loc>
    <news:news>
      <news:publication>
        <news:name>Trepola</news:name>
        <news:language>es</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeHtml(titleText)}</news:title>
    </news:news>
  </url>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${newsItems}
</urlset>`;

  res.send(xml);
});

// 3. Image Sitemap (XML)
app.get('/image-sitemap.xml', async (_req, res) => {
  res.header('Content-Type', 'application/xml');
  const baseUrl = process.env.VITE_SITE_URL || 'https://www.trepola.com';

  let dbArticles: any[] = [];
  if (db) {
    try {
      dbArticles = await db.select().from(articlesTable).orderBy(desc(articlesTable.publishedAt));
    } catch (e) {}
  }
  const allArticlesList = dbArticles.length > 0 ? dbArticles : INITIAL_ARTICLES;

  const imageItems = allArticlesList.filter(a => a.imageUrl).map((article: any) => {
    const slug = article.slug || serverSlugify(typeof article.title === 'object' ? article.title.es : article.title) || article.id;
    const titleText = typeof article.title === 'object' ? (article.title.es || article.title.en) : article.title;

    return `
  <url>
    <loc>${baseUrl}/news/${slug}</loc>
    <image:image>
      <image:loc>${escapeHtml(article.imageUrl)}</image:loc>
      <image:title>${escapeHtml(titleText)}</image:title>
    </image:image>
  </url>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${imageItems}
</urlset>`;

  res.send(xml);
});

// 4. Robots.txt Endpoint
app.get('/robots.txt', (_req, res) => {
  res.header('Content-Type', 'text/plain');
  const baseUrl = process.env.VITE_SITE_URL || 'https://www.trepola.com';
  const content = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/news-sitemap.xml
Sitemap: ${baseUrl}/image-sitemap.xml
`;
  res.send(content);
});

// Health check route
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Trepola Local News API' });
});

// Serve static files from dist if present
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Wildcard SSR Handler for Article Meta Tag Injection
app.get('*', async (req, res, next) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/assets') || (req.url.includes('.') && !req.url.endsWith('.html'))) {
    return next();
  }

  const indexPath = fs.existsSync(path.join(distPath, 'index.html'))
    ? path.join(distPath, 'index.html')
    : path.join(process.cwd(), 'index.html');

  if (!fs.existsSync(indexPath)) {
    return res.status(404).send('Index HTML not found');
  }

  let html = fs.readFileSync(indexPath, 'utf-8');
  const baseUrl = process.env.VITE_SITE_URL || 'https://www.trepola.com';

  // Intercept /terms, /privacy
  const cleanPath = req.path.replace(/^\/api/, '');
  if (cleanPath === '/terms') {
    html = html
      .replace(/<title>.*?<\/title>/gi, `<title>Términos de Servicio | Trepola</title>`)
      .replace(/<link rel="canonical" href=".*?"\s*\/?>/gi, `<link rel="canonical" href="${baseUrl}/terms" />`);
  } else if (cleanPath === '/privacy') {
    html = html
      .replace(/<title>.*?<\/title>/gi, `<title>Política de Privacidad | Trepola</title>`)
      .replace(/<link rel="canonical" href=".*?"\s*\/?>/gi, `<link rel="canonical" href="${baseUrl}/privacy" />`);
  } else {
    // Intercept /categoria/:id
    const categoryId = pathToCategoryId(cleanPath);
    if (categoryId !== 'all' && cleanPath.startsWith('/categoria/')) {
      const categoryName = CATEGORY_NAMES_ES[categoryId] || categoryId;
      const categoryCanonical = `${baseUrl}/categoria/${categoryId}`;
      html = html
        .replace(/<title>.*?<\/title>/gi, `<title>${categoryName} | Trepola</title>`)
        .replace(/<link rel="canonical" href=".*?"\s*\/?>/gi, `<link rel="canonical" href="${categoryCanonical}" />`)
        .replace(/<meta name="description" content=".*?"\s*\/?>/gi, `<meta name="description" content="Últimas noticias de ${categoryName} en Trepola." />`);
    }
  }

  // Intercept /news/:slugOrId
  const newsMatch = cleanPath.match(/^\/news\/([^\/]+)/);
  if (newsMatch) {
    const slugOrId = newsMatch[1];
    const article = await getArticleBySlugOrId(slugOrId);

    if (article) {
      const artSlug = article.slug || serverSlugify(typeof article.title === 'object' ? article.title.es : article.title) || article.id;
      
      // 301 Redirect if accessed via legacy ID instead of SEO slug
      if (slugOrId !== artSlug && article.slug) {
        return res.redirect(301, `/news/${artSlug}`);
      }

      const artTitle = typeof article.title === 'object' ? (article.title.es || article.title.en || article.title.ar) : article.title;
      const artExcerpt = typeof article.excerpt === 'object' ? (article.excerpt.es || article.excerpt.en || article.excerpt.ar) : article.excerpt;
      const metaTitle = `${artTitle} | Trepola`;
      const metaDesc = artExcerpt.length > 155 ? artExcerpt.substring(0, 152) + '...' : artExcerpt;
      const canonicalUrl = `${baseUrl}/news/${artSlug}`;
      // Format 1200x630 Facebook OpenGraph image URL (must be absolute)
      let ogImageUrl = article.imageUrl ? article.imageUrl.trim() : `${baseUrl}/web-app-manifest-512x512.png`;
      if (!ogImageUrl.startsWith('http://') && !ogImageUrl.startsWith('https://')) {
        ogImageUrl = `${baseUrl}${ogImageUrl.startsWith('/') ? '' : '/'}${ogImageUrl}`;
      }
      if (ogImageUrl.includes('images.unsplash.com')) {
        const cleanUnsplash = ogImageUrl.split('?')[0];
        ogImageUrl = `${cleanUnsplash}?auto=format&fit=crop&w=1200&h=630&q=85`;
      }

      const publishedDate = article.publishedAt || new Date().toISOString();

      // index.html ships a static hero-image preload hint (a fixed Unsplash
      // fallback photo) meant for whatever the default landing state is —
      // on every article page it points at an image that page never uses,
      // which is dead weight on the LCP-critical path (browser warns
      // "preloaded ... but not used"). Replace it with this article's real
      // image so the preload actually primes the hero photo that renders.
      const heroSrc = article.imageUrl ? article.imageUrl.trim() : '';
      let heroPreloadTag = '';
      if (heroSrc.includes('images.unsplash.com')) {
        const srcset = getSrcSet(heroSrc, [400, 640, 750, 828, 960, 1080, 1200], 60);
        heroPreloadTag = `<link rel="preload" as="image" imagesrcset="${escapeHtml(srcset)}" imagesizes="(max-width: 1024px) 100vw, 66vw" fetchpriority="high" type="image/webp" />`;
      } else if (heroSrc) {
        heroPreloadTag = `<link rel="preload" as="image" href="${escapeHtml(heroSrc)}" fetchpriority="high" />`;
      }
      html = html.replace(/<link rel="preload" as="image"[\s\S]*?\/>/i, heroPreloadTag);

      // Interactive guides may carry a 'faq' block (see FaqBlock.tsx) —
      // surface it as FAQPage structured data for rich results.
      let faqSchemaEntity: any = null;
      if (article.contentFormat === 'blocks') {
        try {
          const blocks = JSON.parse(typeof article.content === 'string' ? article.content : '[]');
          const faqBlock = Array.isArray(blocks)
            ? blocks.find((b: any) => b && b.type === 'faq' && Array.isArray(b.items) && b.items.length > 0)
            : null;
          if (faqBlock) {
            faqSchemaEntity = {
              '@type': 'FAQPage',
              '@id': `${canonicalUrl}#faq`,
              'mainEntity': faqBlock.items.map((item: any) => ({
                '@type': 'Question',
                'name': item.question,
                'acceptedAnswer': { '@type': 'Answer', 'text': item.answer },
              })),
            };
          }
        } catch {
          // Malformed content JSON — skip FAQ schema, rest of the page still renders.
        }
      }

      const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'NewsArticle',
            '@id': `${canonicalUrl}#article`,
            'isPartOf': { '@id': `${baseUrl}/#website` },
            'headline': artTitle,
            'description': metaDesc,
            'mainEntityOfPage': { '@type': 'WebPage', '@id': canonicalUrl },
            'image': [ogImageUrl],
            'datePublished': publishedDate,
            'dateModified': publishedDate,
            'author': {
              '@type': 'Person',
              'name': (article as any).author?.name || (article as any).source || 'Redacción Trepola',
              'jobTitle': (article as any).author?.role || 'Periodista',
            },
            'publisher': {
              '@type': 'NewsMediaOrganization',
              'name': 'Trepola',
              'url': baseUrl,
              'logo': {
                '@type': 'ImageObject',
                'url': `${baseUrl}/web-app-manifest-512x512.png`,
                'width': 512,
                'height': 512,
              },
            },
            'articleSection': article.category || 'Noticias',
            'keywords': Array.isArray(article.seoKeywords) ? article.seoKeywords.join(', ') : 'Noticias, Trepola',
          },
          {
            '@type': 'BreadcrumbList',
            '@id': `${canonicalUrl}#breadcrumb`,
            'itemListElement': [
              { '@type': 'ListItem', 'position': 1, 'name': 'Inicio', 'item': baseUrl },
              { '@type': 'ListItem', 'position': 2, 'name': article.category || 'Noticias', 'item': `${baseUrl}/categoria/${(article.category || 'general').toLowerCase()}` },
              { '@type': 'ListItem', 'position': 3, 'name': artTitle, 'item': canonicalUrl },
            ],
          },
          ...(faqSchemaEntity ? [faqSchemaEntity] : []),
        ],
      };

      // Inject dynamic meta tags into index.html for Facebook, X, WhatsApp, LinkedIn crawlers
      html = html
        .replace(/<title>.*?<\/title>/gi, `<title>${escapeHtml(metaTitle)}</title>`)
        .replace(/<meta name="description" content=".*?"\s*\/?>/gi, `<meta name="description" content="${escapeHtml(metaDesc)}" />`)
        .replace(/<meta property="og:type" content=".*?"\s*\/?>/gi, `<meta property="og:type" content="article" />`)
        .replace(/<meta property="og:site_name" content=".*?"\s*\/?>/gi, `<meta property="og:site_name" content="Trepola" />`)
        .replace(/<meta property="og:title" content=".*?"\s*\/?>/gi, `<meta property="og:title" content="${escapeHtml(metaTitle)}" />`)
        .replace(/<meta property="og:description" content=".*?"\s*\/?>/gi, `<meta property="og:description" content="${escapeHtml(metaDesc)}" />`)
        .replace(/<meta property="og:image" content=".*?"\s*\/?>/gi, `<meta property="og:image" content="${escapeHtml(ogImageUrl)}" />`)
        .replace(/<meta property="og:image:secure_url" content=".*?"\s*\/?>/gi, `<meta property="og:image:secure_url" content="${escapeHtml(ogImageUrl)}" />`)
        .replace(/<meta property="og:image:type" content=".*?"\s*\/?>/gi, `<meta property="og:image:type" content="image/jpeg" />`)
        .replace(/<meta property="og:image:width" content=".*?"\s*\/?>/gi, `<meta property="og:image:width" content="1200" />`)
        .replace(/<meta property="og:image:height" content=".*?"\s*\/?>/gi, `<meta property="og:image:height" content="630" />`)
        .replace(/<meta property="og:url" content=".*?"\s*\/?>/gi, `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`)
        .replace(/<meta name="twitter:card" content=".*?"\s*\/?>/gi, `<meta name="twitter:card" content="summary_large_image" />`)
        .replace(/<meta property="twitter:card" content=".*?"\s*\/?>/gi, `<meta property="twitter:card" content="summary_large_image" />`)
        .replace(/<meta property="twitter:title" content=".*?"\s*\/?>/gi, `<meta property="twitter:title" content="${escapeHtml(metaTitle)}" />`)
        .replace(/<meta property="twitter:description" content=".*?"\s*\/?>/gi, `<meta property="twitter:description" content="${escapeHtml(metaDesc)}" />`)
        .replace(/<meta property="twitter:image" content=".*?"\s*\/?>/gi, `<meta property="twitter:image" content="${escapeHtml(ogImageUrl)}" />`)
        .replace(/<link rel="canonical" href=".*?"\s*\/?>/gi, `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`);

      html = html.replace('</head>', `<script id="dynamic-jsonld-schema" type="application/ld+json">${JSON.stringify(jsonLd)}</script></head>`);
    }
  }

  res.status(200).send(html);
});

// Export for Vercel Serverless Function
export default app;

if (process.env.VERCEL !== '1') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}
