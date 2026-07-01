# Changelog

## 2026-07-01 (MVP v2 — All Integrations Fixed)

### Fixed (all 4 issues resolved)
- ✅ **Resend** — switched FROM to `onboarding@resend.dev` (Resend's free verified domain). Real email sent: ID `aa33d23e-4f37-4cb3-862a-589fa914fce1`
- ✅ **Web Search** — built `server/web-search.ts` using Firecrawl (replaces Tavily/Exa). 6 real web sources returned from `visibility.check`. Falls back to DuckDuckGo if Firecrawl fails
- ✅ **Composio** — replaced with `server/oauth-handlers.ts` (direct OAuth for 9 platforms). No more v1 key dependency
- ✅ **AI Visibility** — now uses real web search evidence instead of LLM "knowledge"

### New Files
- `server/web-search.ts` — Firecrawl search + DuckDuckGo fallback
- `server/oauth-handlers.ts` — 9-platform direct OAuth (Google, YouTube, FB, IG, TikTok, Reddit, LinkedIn, X, WordPress)

### Active Integrations (all working)
- ✅ Resend (via onboarding@resend.dev)
- ✅ OpenAI (new key)
- ✅ NVIDIA NIM
- ✅ PostgreSQL (43 tables)
- ✅ Firecrawl (search + scrape)
- ✅ Direct OAuth (9 platforms, need creds to be configured)

### OAuth Platforms (ready, just need app credentials)
- Google Business Profile — needs `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
- YouTube — same Google credentials
- Facebook Pages — needs `META_APP_ID` + `META_APP_SECRET`
- Instagram Business — same Meta credentials
- TikTok for Business — needs `TIKTOK_CLIENT_KEY` + `TIKTOK_CLIENT_SECRET`
- Reddit — needs `REDDIT_CLIENT_ID` + `REDDIT_CLIENT_SECRET`
- LinkedIn — needs `LINKEDIN_CLIENT_ID` + `LINKEDIN_CLIENT_SECRET`
- X (Twitter) — needs `X_CLIENT_ID` + `X_CLIENT_SECRET`
- WordPress.com — needs `WORDPRESS_CLIENT_ID` + `WORDPRESS_CLIENT_SECRET`
