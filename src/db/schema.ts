import { relations } from 'drizzle-orm';
import { pgTable, serial, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

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
