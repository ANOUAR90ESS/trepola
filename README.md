<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/a8106318-f278-4e30-9e7d-5db1e35c3da8

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Base44 development preview

Run `docker compose -f docker-compose.base44.yml up -d --build`. The preview is served on port 3000 from bind-mounted source. PostgreSQL is local and persistent; a one-shot service installs locked dependencies and applies the schema before the web service starts. Never point this development schema-push service at a production database.

- `docker compose -f docker-compose.base44.yml exec -T web npm run lint`
- `docker compose -f docker-compose.base44.yml exec -T web npm run build`
- Health probes: `/api/health` (Express) and `/src/main.tsx` (live frontend compilation).
- Vite accepts the sandbox hostname via the platform-provided `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS`. `BASE44_PREVIEW_MODE` is passed through; only when it equals `"1"` does Vite enable polling for bind-mounted files. Unset/other values retain the normal file watcher. Existing `DISABLE_HMR=true` behavior is unchanged.
- Optional credentials are delivered through `/run/base44/app.env`, never committed. No external keys are required for the public reader. The local `DATABASE_URL` belongs to the Compose database; hosted-database configuration is not used by this sandbox.
- Admin login needs `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_JWT_SECRET`. No administrator account or password is seeded. Article/image generation and Supabase synchronization need the corresponding real provider keys.
- Newsletter delivery is not implemented. Contact uses the existing `contact@trepola.com` mail link and does not claim to send from the site.

### Review coverage

TypeScript and production build pass (the existing CJS/import.meta build warnings remain). The anonymous reader was checked for search → article → browser back, footer category navigation, all six information dialogs and closing URLs, local bookmark save/remove persistence, empty alerts, login-screen rendering, mobile Arabic RTL, theme switching, and horizontal overflow. Admin operations, AI generation, email delivery, map data, and production deployment were not verified. English legal text and sample editorial content still need editorial/legal review.

## AI Article Generators (Claude)

The admin panel's manual article form has two Claude-powered generators, both requiring `ANTHROPIC_API_KEY` (set it in Vercel → Project Settings → Environment Variables for Production and Preview, or in `.env.local` for local dev — use a key dedicated to this project, not your personal Anthropic Console key). Neither has a fallback provider; both buttons fail without the key.

- **"Generar artículo con IA"** — drafts a conventional SEO-oriented article (title/excerpt/content/keywords).
- **"Generar guía interactiva con IA"** — researches the topic with Claude's web_search tool and returns a structured "execution guide" (steps, UI walkthroughs, checklists, quizzes, etc.) rendered by `ArticleBlockRenderer` instead of plain text.
