# ContentFlow AI - Project TODO

## Core Infrastructure
- [x] Dark theme with orange accents (CSS variables)
- [x] Database schema (users, businesses, connected_accounts, content_queue, analytics, billing)
- [x] Multi-tenant Row Level Security
- [x] tRPC routers for all features

## Landing Page
- [x] Hero section with dark theme and orange accents
- [x] Features section
- [x] Pricing tiers (Starter $97/mo, Pro $197/mo, Enterprise $497/mo)
- [x] Testimonials section
- [x] Comparison table
- [x] CTA sections

## Authentication
- [x] Login/signup via Manus OAuth
- [x] Protected routes
- [x] Session management

## Onboarding Wizard
- [x] Step 1: Business info (name, industry, website URL)
- [x] Step 2: Connect platforms (OAuth buttons)
- [x] Step 3: Content preferences (tone, topics, frequency)
- [x] Step 4: Plan selection
- [x] Step 5: Confirmation/completion

## Main Dashboard
- [x] Posts published stat
- [x] Active platforms stat
- [x] Search impressions chart
- [x] AI citations detected stat
- [x] Live activity feed
- [x] Quick actions panel

## Content Hub
- [x] Content queue (upcoming posts)
- [x] Published posts history
- [x] Content calendar view
- [x] Manual post creation
- [x] Content approval workflow

## Platform Connections
- [x] Connected accounts with status indicators
- [x] Add/remove connections (Google, Meta, TikTok, YouTube, Reddit, WordPress)
- [x] Platform-specific settings

## AI Content Settings
- [x] Brand voice configuration
- [x] Topic clusters
- [x] Content types (blog, social, video, schema)
- [x] Per-platform posting schedule
- [x] Auto-approve toggle

## Analytics Dashboard
- [x] Platform-by-platform performance
- [x] AI citation tracker
- [x] Search impressions over time chart
- [x] Top performing content
- [x] Engagement metrics

## Billing Page
- [x] Current plan display
- [x] Usage stats
- [x] Upgrade/downgrade flow
- [x] Invoice history
- [x] Payment method management (Stripe)

## Settings Page
- [x] API keys configuration (OpenAI/Anthropic, platform keys)
- [x] Team members management
- [x] Notifications settings
- [x] Webhooks configuration
- [x] Data export

## Admin Panel
- [x] All tenants/users overview
- [x] Revenue dashboard
- [x] System health monitoring
- [x] Content moderation
- [x] User management

## MVP Wiring — Remove All Mock Data

- [x] Dashboard: real stats from DB, real activity feed, real chart data
- [x] ContentHub: render queueData from tRPC instead of hardcoded array
- [x] Platforms: render real connected_accounts, working disconnect
- [x] Analytics: add tRPC calls, real charts from analytics_logs
- [x] AISettings: persist to DB via business.update mutation
- [x] Settings: persist API keys, load on mount, real team/webhook CRUD
- [x] AdminPanel: render real users/businesses, real revenue from DB
- [x] Billing: wire Stripe Checkout, real subscription status
- [x] Publishing Worker: real HTTP calls to platform APIs
- [x] Final: tests pass, build passes, redeploy

## Market-Ready Features (Round 3)

- [x] 1. Onboarding Intelligence: business analyzer via LLM, auto-generate content strategy
- [x] 2. Content Quality Control: scoring, brand voice check, duplicate detection
- [x] 3. Scheduling Engine: /api/cron/publish endpoint, auto-generate + publish
- [x] 4. ROI Analytics: AI visibility score, citation detection, ROI summary card
- [x] 5. Multi-Tenant Isolation: middleware audit, business_id scoping
- [x] 6. Email System: welcome, weekly report, publish notification, citation alert
- [x] 7. White-Label Publishing: per-business OAuth scoping, publishing destinations UI
- [x] 8. Error Handling & Retry: exponential backoff, error display, retry button
- [x] 9. AI Visibility Score: search AI engines, score 0-100, dashboard metric
- [x] 10. Legal Pages: ToS, Privacy Policy, GDPR export/delete

## Stripe Billing & Plan Enforcement (Round 4)

- [x] Stripe checkout endpoint with real session creation
- [x] Stripe webhook handler (checkout.completed, subscription.updated/deleted, invoice.failed)
- [x] Stripe customer portal redirect
- [x] Usage tracking table (month, posts_published, platforms_connected)
- [x] Plan limits function (Starter/Pro/Enterprise)
- [x] Plan enforcement middleware on all actions
- [x] Frontend feature gating (lock icons, upgrade prompts)
- [x] Billing page with real subscription data
- [x] Usage display on dashboard
- [x] Tests pass, build passes, redeploy
