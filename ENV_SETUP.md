# ContentFlow AI — Environment Setup

## Required Environment Variables

### Database
- DATABASE_URL — MySQL connection string (e.g., mysql://user:pass@host:3306/contentflow)

### Auth (Manus Platform)
- JWT_SECRET, VITE_APP_ID, OAUTH_SERVER_URL, VITE_OAUTH_PORTAL_URL
- OWNER_OPEN_ID, OWNER_NAME

### AI / LLM
- OPENAI_API_KEY — OpenAI key for content generation
- ANTHROPIC_API_KEY — Anthropic/Claude key
- BUILT_IN_FORGE_API_URL, BUILT_IN_FORGE_API_KEY — Manus LLM proxy
- VITE_FRONTEND_FORGE_API_KEY, VITE_FRONTEND_FORGE_API_URL

### Stripe Billing
- STRIPE_SECRET_KEY — Stripe secret key (sk_live_... or sk_test_...)
- STRIPE_WEBHOOK_SECRET — From Stripe Dashboard > Webhooks > Signing secret
  Register webhook: POST /api/stripe/webhook
  Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed

### Google OAuth
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- Redirect URI: https://yourdomain.com/api/oauth/google/callback

### Optional Integrations
- META_APP_ID, META_APP_SECRET — Facebook/Instagram
- TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET — TikTok
- REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET — Reddit
- RESEND_API_KEY, FROM_EMAIL — Email notifications
- CRON_SECRET — Secure the /api/cron/publish endpoint

## Render Deployment

Build Command: pnpm install && pnpm run build
Start Command: node dist/index.js
Node Version: 22

Set all environment variables in Render Dashboard > Environment.
