-- =======================================================
-- Supabase Full Database Schema & Admin Setup for Trepola
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- =======================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ensure 'role' column exists in case the table already existed previously
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- 3. Ensure unique constraint on email if possible
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 4. Create Articles Table (for Admin publishing)
CREATE TABLE IF NOT EXISTS public.articles (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  image_url TEXT,
  source TEXT DEFAULT 'Redacción Trepola',
  read_time_minutes INTEGER DEFAULT 3,
  seo_keywords TEXT[],
  meta_description TEXT,
  is_urgent BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure 'slug' column exists in case the table already existed previously
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 5. Create Saved Articles Table
CREATE TABLE IF NOT EXISTS public.saved_articles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  article_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  article_id TEXT NOT NULL,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  is_neighborhood_resident BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. SAFE INSERT ADMIN USER
-- Replace 'ADMIN_EMAIL_HERE' below with the same address you set as ADMIN_EMAIL
-- in your server environment variables before running this script.
INSERT INTO public.users (uid, email, name, role)
SELECT 'admin_anwar', 'ADMIN_EMAIL_HERE', 'Administrador Trepola', 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = 'ADMIN_EMAIL_HERE'
);

-- Ensure the role is set to 'admin'
UPDATE public.users
SET role = 'admin', name = 'Administrador Trepola'
WHERE email = 'ADMIN_EMAIL_HERE';

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies
DROP POLICY IF EXISTS "Allow public read access on articles" ON public.articles;
CREATE POLICY "Allow public read access on articles" ON public.articles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on comments" ON public.comments;
CREATE POLICY "Allow public read access on comments" ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on users" ON public.users;
CREATE POLICY "Allow public read access on users" ON public.users FOR SELECT USING (true);

-- Writes are intentionally NOT exposed to the anon/authenticated PostgREST roles.
-- With RLS enabled and only the SELECT policies above present, INSERT/UPDATE/DELETE
-- via the public API (anon key) are denied by default. All writes go through the
-- backend server, which uses the Supabase service-role key or a direct Postgres
-- connection (Drizzle) — both bypass RLS entirely and are gated by the app's own
-- admin authentication (see src/middleware/auth.ts).
DROP POLICY IF EXISTS "Allow full control for admins" ON public.articles;
DROP POLICY IF EXISTS "Allow saved articles access" ON public.saved_articles;
DROP POLICY IF EXISTS "Allow insert/update for comments" ON public.comments;

-- These two were created directly in the Supabase dashboard at some point (not
-- part of this script) and were flagged by the Security Advisor as "always true"
-- INSERT/ALL policies — same class of issue as above, dropped for the same reason.
DROP POLICY IF EXISTS "Allow authenticated create comments" ON public.comments;
DROP POLICY IF EXISTS "Allow insert/update for users" ON public.users;
