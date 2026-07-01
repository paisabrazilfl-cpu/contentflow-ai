# AI Notes

## Model: Manus (Manus Auth + Forge API)

### Why
- OAuth out of the box — auth flow is pre-wired (`/api/oauth/callback`)
- Forge API covers LLM, storage, notifications, data API — one key does everything
- Manus handles session JWT signing with `jose`

### Risks
- App is tightly coupled to Manus OAuth endpoints (`/webdev.v1.WebDevAuthPublicService/ExchangeToken`)
- If Manus auth server changes, login breaks
- No fallback auth mechanism

### Objective
- Replace Manus OAuth with Composio OAuth (user has Composio account)
- Make OAuth vars configurable so any OAuth provider can be swapped

---

## Next Steps

1. **Database** — Create PostgreSQL on Render and set `DATABASE_URL` (blocking everything)
2. **OAuth** — Configure `OAUTH_SERVER_URL` + `VITE_OAUTH_PORTAL_URL` with Composio or Manus auth
3. **Stripe** — Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and price IDs for billing
4. **Social OAuth** — `GOOGLE_CLIENT_ID/SECRET`, `META_APP_ID/SECRET`, `TIKTOK_CLIENT_KEY/SECRET`, `REDDIT_CLIENT_ID/SECRET`
5. **Video integration** — Connect A2E AI to actual video generation flow (currently wired but no server-side integration yet)
6. **Pictory/HeyGen** — Add API keys when ready, wire to Video tab in settings
