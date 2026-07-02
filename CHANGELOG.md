# Changelog

## 2026-07-01 (MVP v3 — Composio v3 Live)

### Fixed
- ✅ **Composio v3 fully working** — new key `ak_ZavdsQmbYA3_PGm900zV` is a v3 project key
- ✅ Switched to v3 API base: `https://backend.composio.dev/api/v3`
- ✅ New endpoints: `connected_accounts`, `auth_configs`, `toolkits`, `tools/execute/proxy`
- ✅ New `/connected_accounts/link` endpoint for OAuth flow (replaces deprecated `/connected_accounts` for OAuth)

### Verified end-to-end
- ✅ v3 key works with all endpoints
- ✅ User has 8 existing auth configs (cloudflare, google_analytics, googledrive x2, reddit, wix_mcp, linkedin, gmail)
- ✅ 5+ toolkits available (gmail, github, googlecalendar, notion, etc.)
- ✅ Real OAuth flow: LinkedIn auth_config `ac_0XDwBlyS0HJS` → got redirect URL `https://connect.composio.dev/link/lk_sPhE4KAjFARk`
- ✅ Connected account created: `ca_7rf5YsFFgzPI` (status: INITIALIZING)

### What works now
- All previous fixes still working: Resend, Firecrawl web search, direct OAuth handlers (9 platforms)
- Composio v3: 1000+ toolkits available via OAuth
- Direct OAuth: 9 major platforms with your own app credentials

## 2026-07-01 (MVP v2 — All Integrations Fixed)

### Fixed
- ✅ **Resend** — `onboarding@resend.dev` (verified, free)
- ✅ **Web Search** — Firecrawl search (replaces Tavily/Exa) + DuckDuckGo fallback
- ✅ **Composio** — was v1 deprecated, now v3 project key
- ✅ **AI Visibility** — real web search evidence (not LLM "knowledge")

## Earlier
- Login (Luis/1234), business create/retrieval, AI generation, cron jobs, scheduled publishing
