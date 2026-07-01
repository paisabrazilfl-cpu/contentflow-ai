# ContentFlow AI

AI-powered content generation and social media management platform.

## Live
- **URL**: https://contentflow-ai-prod.onrender.com
- **Credentials**: `Luis` / `1234`

## Stack
- Node.js 20 + Express + tRPC
- React + Vite + TailwindCSS
- PostgreSQL (Render)
- Docker (Render deployment)
- Multi-provider LLM: NVIDIA NIM, OpenAI, Anthropic, Gemini, Kimi

## Local Dev
```bash
npm install --legacy-peer-deps
npm run build
npm start
```

## Environment Variables
See `CHANGELOG.md` for current Render env var configuration.

## Tables
Auto-created on first request via `auth.dbSchema` endpoint:
- users, businesses, content_queue, api_keys, connected_accounts
- analytics_logs, activity_feed, usage_tracking
