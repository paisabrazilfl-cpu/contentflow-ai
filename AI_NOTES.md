# AI Notes

## 2026-07-01 Session

### The Big Bug
**drizzle-orm/node-postgres expects `pg` library, not `postgres.js`.**

The `drizzle-orm/node-postgres` driver calls `client.query(sql, params)` internally. `postgres.js` doesn't have a `client.query()` method — it uses `client.unsafe()` or `client\`\`` template literals.

**Symptom**: `"Failed query: select ... from ..."` with `cause: "client.query is not a function"`

**Fix**: Use `import { Client } from "pg"` and `new Client({ connectionString })`.

### Schema vs DB Mismatch
The drizzle schema uses MySQL syntax (`mysqlTable`, `mysqlEnum`) but the actual DB is PostgreSQL. This is a pre-existing issue. We worked around it by:
1. Auto-creating tables on first request via raw SQL
2. Using raw SQL for all queries that fail through drizzle
3. Memory store fallback for fast in-memory access

### LLM Provider Strategy
With OpenAI out of quota and Kimi having invalid auth, we lean on NVIDIA NIM. The 8b model has better rate limits than 70b. Fallback chain: NVIDIA 8b → NVIDIA 70b → OpenAI → OpenRouter → Anthropic → Gemini → Kimi.

### Hardcoded Secrets
- JWT_SECRET = `cf-prod-secret-do-not-share-32bytes!!` (Render env var timing issue)
- DATABASE_URL hardcoded in env (avoids having to set it in multiple places)

### Working State
- App: https://contentflow-ai-prod.onrender.com
- Login: Luis / 1234
- Full flow works: login → create business → AI generate → save to content_queue
- AI generates full Instagram post with title, content, hashtags, platformNotes
