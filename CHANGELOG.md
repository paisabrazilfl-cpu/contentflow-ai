# Changelog

## 2026-07-01 (MVP Release)

### Verified Live at https://contentflow-ai-prod.onrender.com
- **Credentials**: `Luis` / `1234` (case-insensitive username, trim whitespace)

### Active Integrations (verified 2026-07-01)
| Integration | Status | Notes |
|---|---|---|
| OpenAI | ✅ Working | New key `sk-proj-EW3YWgghqUt...` tested, generates IG posts |
| NVIDIA NIM | ✅ Working | Llama 8b + 70b models, free tier |
| PostgreSQL | ✅ Working | 43 tables auto-created |
| Firecrawl | ✅ Working | Scrape endpoint tested |
| Resend | ⚠️ Domain not verified | `notifications.abbycrm.com` needs verification in Resend dashboard |
| Composio | ⚠️ v1 key deprecated | `oak_*` key, needs v3 `comp_*` key from Composio |
| Tavily | ❌ Key rejected | Need fresh key from Tavily |
| Exa | ❌ Credits exhausted | Top up at dashboard.exa.ai |
| Steel | ✅ Configured | API key set |
| E2B | ✅ Configured | API key set |
| Pinecone | ✅ Configured | API key set |
| Helicone | ✅ Configured | API key set |
| Inngest | ✅ Configured | API key set |
| Discord Bot | ✅ Configured | Token set |

### Tested Flows (end-to-end, all PASS)
1. ✅ Login (Luis/1234)
2. ✅ Auth.me (returns user, role=admin)
3. ✅ Business get (loads from memory store)
4. ✅ Business create (raw SQL via pg.Client)
5. ✅ AI Generate (Instagram post with title, content, hashtags)
6. ✅ Cron Agents (6 agents: ABBY, FORGE, CRAWLER, VAULT, WIRE, MR.NICE)
7. ✅ Cron List (jobs persisted in DB)
8. ✅ Cron Create (new job scheduled)
9. ✅ Cron Run Now (executes in ~3s)
10. ✅ **Cron Scheduler** (background job runs automatically — Job #1 has 2 runs)
11. ✅ Content Score (returns 0-10 scores with suggestions)
12. ✅ Content Process Queue (publishing worker)
13. ✅ Analytics ROI (returns aggregated metrics)
14. ✅ Scheduled Publishing (`/api/cron/publish` endpoint)

### Known Issues
- Business.create returns `(void 0) is not a function` error after success — non-blocking, business is created
- Tavily key is invalid
- Exa out of credits
- Resend domain needs verification
- Composio v1 key needs upgrade to v3
