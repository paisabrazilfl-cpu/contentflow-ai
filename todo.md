# ContentFlow AI - Project TODO

## Database Schema
- [x] Extend drizzle/schema.ts with: connected_accounts, content_queue, usage_tracking, subscriptions tables
- [x] Generate and apply migrations

## Backend - OAuth Flows
- [x] Google OAuth (YouTube + Business Profile) connect/callback/disconnect/token refresh
- [x] Meta/Facebook OAuth (Instagram + Pages) connect/callback/disconnect/token refresh
- [x] TikTok OAuth connect/callback/disconnect/token refresh
- [x] Reddit OAuth connect/callback/disconnect/token refresh
- [x] Store tokens in connected_accounts table

## Backend - Stripe Billing
- [x] Checkout session creation for Starter/Pro/Agency plans
- [x] Stripe webhook handler (subscription.created, payment_succeeded, payment_failed, subscription.cancelled)
- [x] Usage tracking tied to subscription tier
- [x] Customer portal session

## Backend - Publishing Worker
- [x] YouTube post (video upload + community post)
- [x] Facebook/Instagram post via Meta Graph API
- [x] TikTok post via content posting API
- [x] Reddit post via Reddit API
- [x] Cron job: check content_queue every 5 minutes for due items

## Backend - Rate Limiting
- [x] Starter: 50 AI generations/month
- [x] Pro: 200 AI generations/month
- [x] Agency: unlimited
- [x] Track usage in usage_tracking table
- [x] Return clear error when limit reached

## Backend - Email (Resend)
- [x] Welcome email on signup
- [x] Billing receipt email
- [x] Usage alert email (80% and 100% of limit)

## Backend - AI Content Generation
- [x] Generate platform-optimized content via invokeLLM
- [x] Brand voice customization
- [x] SEO/AEO optimization
- [x] Per-platform formatting (blog, social, video script)

## Backend - tRPC Routers
- [x] oauth router (connect, callback, disconnect, list)
- [x] billing router (createCheckout, webhook, getSubscription, createPortalSession)
- [x] content router (generate, queue, list, delete)
- [x] publishing router (publishNow, getQueue, updateQueue)
- [x] analytics router (getStats, getUsage)
- [x] settings router (getBrandVoice, updateBrandVoice)

## Frontend - Global
- [x] Dark theme with orange accents in index.css
- [x] App.tsx with all routes
- [x] DashboardLayout with sidebar navigation

## Frontend - Pages
- [x] Landing page (Home.tsx) - marketing, pricing, CTA
- [x] Dashboard page - stats, recent activity, quick actions
- [x] Content Generator page - AI generation form with platform selector
- [x] Platform Connections page - OAuth connect/disconnect UI
- [x] Content Queue / Scheduler page - scheduled posts list and calendar
- [x] Billing page - current plan, upgrade/downgrade, usage
- [x] Analytics page - charts, platform stats
- [x] Settings page - brand voice, account settings

## Environment
- [x] ENV_TEMPLATE.md with all required variables and descriptions

## Tests
- [x] Vitest tests for OAuth flow
- [x] Vitest tests for rate limiting
- [x] Vitest tests for billing webhook handler
