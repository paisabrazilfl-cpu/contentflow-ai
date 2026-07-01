# Changelog

## 2026-07-01

### Fixed
- **Database Connection (CRITICAL)**: Switched from postgres.js to pg.Client — drizzle-orm/node-postgres expects node-postgres API (`client.query`), not postgres.js API (`client.unsafe`). Root cause of all "client.query is not a function" errors.
- **Missing PostgreSQL Tables**: Schema was MySQL syntax (`mysqlTable`) but DB is PostgreSQL. Auto-created all required tables on first call to `/api/trpc/auth.dbSchema`.
- **users Table Columns**: Recreated with ALL drizzle schema columns (stripeCustomerId, subscriptionStatus, planTier, onboardingCompleted).
- **content_queue Table**: Recreated with all columns (mediaUrls, errorLog, retryCount).
- **usage_tracking Table**: Recreated with `month` column (drizzle generates quoted identifier).
- **DATABASE_URL env var**: Was missing from Render — re-added.
- **JWT_SECRET**: Hardcoded fallback `cf-prod-secret-do-not-share-32bytes!!` to bypass env var timing issues.

### Changed
- **LLM Provider Order**: NVIDIA first (OpenAI quota exhausted, Kimi invalid auth)
- **getOrCreateUsage (plan-limits)**: Raw SQL via pg.Client
- **getBusinessByUserId**: Raw SQL via pg.Client + memory store fallback
- **createBusiness**: Raw SQL via postgres.js for user upsert + business insert
- **login**: Raw SQL user upsert
- **invokeLLM**: Try all providers in order, fall back on failure (was only using first)

### Added
- A2E AI video provider in settings UI
- Memory store fallback for businesses, API keys, content items
- Debug endpoints: `auth.dbSchema`, `auth.testQuery`, `auth.freshDrizzle`, `auth.contentQuery`, `auth.exactQuery`
