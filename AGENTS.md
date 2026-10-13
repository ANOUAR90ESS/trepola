# Development findings

- `docker-compose.base44.yml` runs the repository source, not the production bundle. Use `tsx watch` for Express plus Vite middleware for the browser. Node's native `--watch --import tsx` repeatedly restarted the middleware server during module transforms; do not substitute it.
- First boot orders PostgreSQL health → one-shot Drizzle schema push → web. Both installers are ordered; never run concurrent npm installers against the shared node_modules volume. Schema push here is for the isolated local database, not a production migration procedure.
- Run checks inside the web container: `npm run lint` (TypeScript), `npm run build`. Read-only probes: `/api/health`, `/src/main.tsx`, `/`.
- The public reader works without external credentials. Admin login requires ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_JWT_SECRET; no development account is seeded. AI/storage integrations need real provider credentials, and must not be exercised against real providers during ordinary UI checks.
- Routes are manual history/popstate handlers in App.tsx: `/`, `/categoria/{general,tech,sports,politics,economy,culture}`, `/news/:slug`, and `/about`, `/privacy`, `/terms`, `/cookie`, `/security`, `/contact`. Verify browser back/forward, not only direct paths.
- Browser persistence includes nabd_articles, nabd_comments, nabd_saved_ids, nabd_theme and trepola_reading_history. Preserve existing data and undo test bookmarks/history/preferences.
- Contact currently opens the pre-existing editorial email address; there is no contact delivery API. Newsletter signup is explicitly unavailable until a delivery service is connected. Never show successful delivery/subscription without a real response.
- Existing legal/about/security bodies remain English; translated headings include an explicit English-content notice. Translation is not a legal review.
- Further audit remains necessary: authenticated admin article/comment/bookmark persistence; legacy AI endpoints and their authorization/fallback behavior; consent enforcement for third-party scripts; editorial verification of seeded stories and metrics. Public UI checks do not certify these systems.
