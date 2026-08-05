import { relations } from 'drizzle-orm';
import { pgTable, serial, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Supabase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Saved Articles table
export const savedArticles = pgTable('saved_articles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  articleId: text('article_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Articles table
export const articles = pgTable('articles', {
  id: text('id').primaryKey(),
  slug: text('slug').unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt').notNull(),
  content: text('content').notNull(),
  // 'markdown' (default, plain-paragraph legacy content) | 'blocks' (content is a
  // JSON-serialized ContentBlock[], see src/types/articleBlocks.ts). This column
  // does not exist in the live DB yet — run the following manually in Supabase
  // before deploying anything that writes 'blocks' articles:
  //   ALTER TABLE articles ADD COLUMN content_format text DEFAULT 'markdown';
  contentFormat: text('content_format').default('markdown'),
  // Structured content for 'blocks' articles. `content` (above) stays the
  // source of truth for legacy markdown articles and as a fallback; new
  // AI Content Studio articles read/write `blocks`/`faq`/`heroImage` here
  // instead of re-serializing the whole array into `content` on every edit.
  // Requires manual migration — see the SQL block in this file's history /
  // the PR description before deploying anything that writes these columns:
  //   ALTER TABLE articles ADD COLUMN IF NOT EXISTS blocks jsonb;
  //   ALTER TABLE articles ADD COLUMN IF NOT EXISTS faq jsonb;
  //   ALTER TABLE articles ADD COLUMN IF NOT EXISTS hero_image jsonb;
  //   ALTER TABLE articles ADD COLUMN IF NOT EXISTS stage_status jsonb;
  //   ALTER TABLE articles ADD COLUMN IF NOT EXISTS status text DEFAULT 'published';
  blocks: jsonb('blocks'),
  faq: jsonb('faq'),
  heroImage: jsonb('hero_image'),
  // Per-stage progress for the AI workflow pipeline (see src/types/workflow.ts).
  stageStatus: jsonb('stage_status'),
  // 'draft' | 'published' — lets the Content Studio save progress across
  // generation/image steps before the article is actually publishable.
  status: text('status').default('published'),
  category: text('category').notNull(),
  neighborhood: text('neighborhood').notNull(),
  imageUrl: text('image_url'),
  source: text('source').default('Redacción Trepola'),
  readTimeMinutes: integer('read_time_minutes').default(3),
  seoKeywords: text('seo_keywords').array(),
  metaDescription: text('meta_description'),
  isUrgent: boolean('is_urgent').default(false),
  publishedAt: timestamp('published_at').defaultNow(),
});

// Generic Job records for any AI task that calls an external provider
// (images today; audio/video/translation/social/newsletter in the future).
// See src/types/workflow.ts for the JobType/JobStatus vocabulary and
// src/server/jobs/ for the handler registry that executes them.
//   CREATE TABLE IF NOT EXISTS jobs (
//     id text PRIMARY KEY,
//     type text NOT NULL,
//     status text NOT NULL DEFAULT 'queued',
//     article_id text REFERENCES articles(id) ON DELETE CASCADE,
//     target_ref text,
//     input jsonb,
//     output jsonb,
//     error text,
//     attempts integer NOT NULL DEFAULT 0,
//     created_at timestamp NOT NULL DEFAULT now(),
//     updated_at timestamp NOT NULL DEFAULT now()
//   );
//   CREATE INDEX IF NOT EXISTS jobs_article_id_idx ON jobs(article_id);
export const jobs = pgTable('jobs', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  status: text('status').notNull().default('queued'),
  articleId: text('article_id').references(() => articles.id, { onDelete: 'cascade' }),
  targetRef: text('target_ref'),
  input: jsonb('input'),
  output: jsonb('output'),
  error: text('error'),
  attempts: integer('attempts').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Comments table
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  articleId: text('article_id').notNull(),
  content: text('content').notNull(),
  likes: integer('likes').default(0),
  isNeighborhoodResident: boolean('is_neighborhood_resident').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  savedArticles: many(savedArticles),
  comments: many(comments),
}));

export const savedArticlesRelations = relations(savedArticles, ({ one }) => ({
  user: one(users, {
    fields: [savedArticles.userId],
    references: [users.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  author: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));
