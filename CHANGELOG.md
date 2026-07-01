# Changelog

All notable changes to ContentFlow AI.

Format: `YYYY-MM-DD — Branch: description`

---

## 2026-07-01

**Branch:** `2026-07-01/replace-oauth-with-credentials-login`

### Changes
- Replace Manus OAuth with simple username/password login
- **Credentials:** `Luis` / `1234`
- Add `auth.login` tRPC procedure — validates credentials, signs JWT session cookie
- Fix `sdk.authenticateRequest` — creates user from JWT payload when DB not configured
- Create `/login` page with username/password form
- Update `getLoginUrl()` to redirect to `/login`
- Update `main.tsx` and `AppLayout` unauthorized redirects
- Add stable fallback `cookieSecret` in `env.ts` when `JWT_SECRET` not set

### Known Issues
- Repo temporarily made public for Render access — re-private after QA verified

### Fixes (2026-07-01 hotfix)
- Fix `verifySession`: `appId` may be empty in credentials auth — skip non-empty check
- Login API returns `success:true` but `auth.me` returned `null` — fixed session payload validation

---

## 2026-06-30

**Branch:** `2026-06-30/add-a2e-video-provider`

### Changes
- Add Video tab to AI Settings with provider selector (None, A2E AI, Pictory, HeyGen)
- Add A2E to Settings API key reference
- Wire up `A2E_API_KEY` + `A2E_API_URL` env vars on Render
- Suspend 5 duplicate Render services (contentflow-ai-live, contentflow-ai-final, contentflow-ai-v3, contentflow-ai-v2, old contentflow-ai)
- Add all API keys to Render dashboard (40 env vars total)
- Fix `getLoginUrl()` crash in `client/src/const.ts` (null guard for undefined `VITE_OAUTH_PORTAL_URL`)
- Fix Docker peer dep conflict (`vite@7.x` vs `@builder.io/vite-plugin-jsx-loc` → use `--legacy-peer-deps`)
- Fix Docker build (full `npm install`, not `--omit=dev`)
- Fix AppLayout login button (`getLoginUrl("/dashboard")` wrong arg signature)

### Breaking / Notes
- App requires `DATABASE_URL` to persist data — not yet created on Render
- OAuth vars still empty (`OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`) — login flow blocked
- No PostgreSQL on Render account yet

---

## 2026-06-30

**Branch:** `2026-06-30/docker-fix`

### Changes
- Root cause: `npm install --omit=dev` caused incomplete install in Docker
- Fix: `npm install --legacy-peer-deps` (full install including devDeps)
- Working Dockerfile: `node:20-alpine`, pre-built `dist/` in git

### Notes
- Old service (`contentflow-ai-kdbi`) still running old broken bundle — suspended
- New service `contentflow-ai-prod` (srv-d924ii6gvqtc73f16p7g) is live
