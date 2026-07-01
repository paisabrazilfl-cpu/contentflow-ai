# AI Notes

## 2026-07-01 — MVP Release Day

### Architecture
- **Stack**: Node 20 + Express + tRPC + React 19 + Vite + PostgreSQL (Render)
- **Auth**: Credentials-based (Luis/1234), JWT sessions, hardcoded fallback secret
- **DB**: PostgreSQL via `pg.Client` (NOT postgres.js — drizzle-orm/node-postgres expects pg)
- **LLM**: Multi-provider with fallback chain (OpenAI → NVIDIA 8b → NVIDIA 70b → OpenRouter → Anthropic → Gemini → Kimi)
- **Scheduler**: In-process setInterval(30s) checks cron_jobs for due items
- **Background workers**: Cron scheduler, scheduled publishing (publishing-worker.ts)

### Key Fixes This Session
1. **drizzle-orm/node-postgres + postgres.js = BROKEN** — drizzle expects `client.query()`, postgres.js uses `client.unsafe()`. Use `pg.Client`.
2. **MySQL schema in PostgreSQL DB** — auto-create tables on first request via raw SQL
3. **Render ENV var ordering** — PUT replaces all, so need to merge when updating
4. **OpenAI quota exhausted** — switched to NVIDIA NIM (free, fast)
5. **Composio v1 deprecated** — needs v3 `comp_*` key

### File Layout
- `server/cron-router.ts` — Cron jobs tRPC + scheduler
- `server/_core/llm.ts` — Multi-provider LLM with fallback
- `server/_core/index.ts` — Boot, starts cron scheduler
- `server/scheduling-engine.ts` — Auto-publish workflow
- `server/db.ts` — pg.Client-based drizzle
- `client/src/components/CronJobsTab.tsx` — Cron jobs UI
- `client/src/pages/Settings.tsx` — Settings with 4 tabs

### Environment Variables (25 total, all set on Render)
- Core: NODE_ENV, PORT, DATABASE_URL, JWT_SECRET
- LLM: OPENAI_API_KEY, EMBEDDINGS_API_KEY, NVIDIA_API_KEY
- Email: RESEND_API_KEY, RESEND_FROM
- Scraping: FIRECRAWL_API_KEY, SCRAPINGBEE_API_KEY, SCRAPFLY_API_KEY, STEEL_API_KEY
- Screenshots: SCREENSHOTONE_ACCESS_KEY, SCREENSHOTONE_SECRET_KEY
- Integrations: COMPOSIO_API_KEY, EXA_API_KEY, TAVILY_API_KEY, HELICONE_API_KEY, E2B_API_KEY
- Vector/Events: PINECONE_API_KEY, INNGEST_EVENT_KEY
- Bot: DISCORD_BOT_TOKEN
- Video: A2E_API_KEY, A2E_API_URL
