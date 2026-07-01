# ContentFlow AI

**Professional AI Content Automation Platform** — Generate, schedule, and publish content across Google Business, Instagram, Facebook, TikTok, YouTube, Reddit, and WordPress.

---

## Stack

- **Frontend:** React 19 + Tailwind 4 + shadcn/ui + tRPC 11
- **Backend:** Express 4 + tRPC 11 + Drizzle ORM
- **Auth:** Manus OAuth (server-side JWT sessions)
- **AI:** Manus Forge API (LLM, image, storage, notifications)
- **Database:** PostgreSQL (via Drizzle)
- **Deployment:** Docker on Render

---

## Key Features

- AI content generation (blog, social, video scripts, schema markup)
- Multi-platform publishing (Google Business, Instagram, Facebook, TikTok, YouTube, Reddit, WordPress)
- Automated scheduling with configurable posting times
- Business profile management (industry, audience, tone of voice)
- OAuth connections for all major social platforms
- Stripe billing (Starter / Pro / Agency plans)
- Video generation via A2E AI, Pictory, HeyGen

---

## Quick Start

```bash
npm install
npm run dev        # Development
npm run build      # Production build
npm start          # Run production
```

---

## Environment Variables

See `ENV_SETUP.md` for full env var reference.

---

## Repo Structure

```
client/src/pages/     → Feature UI pages
server/               → tRPC procedures + business logic
drizzle/schema.ts     → Database tables
```

For full architecture docs, see `AI_NOTES.md` and `CHANGELOG.md`.
