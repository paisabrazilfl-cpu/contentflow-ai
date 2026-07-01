# ContentFlow AI

AI-powered content generation and social media management. **Live now** at https://contentflow-ai-prod.onrender.com

**Login**: `Luis` / `1234`

## Features (MVP)
- 🎨 Multi-provider AI content generation (OpenAI, NVIDIA NIM)
- 📅 Prompt-based scheduled jobs (6 agents: ABBY, FORGE, CRAWLER, VAULT, WIRE, MR.NICE)
- 📱 Social platform integrations (via Composio)
- 🔍 AI visibility tracking
- 📊 Analytics + ROI dashboard
- 📝 Content quality scoring
- 🔐 JWT-based credentials auth
- 🗃️ PostgreSQL persistence

## Cron Jobs
The system runs a background scheduler every 30s. Users can create prompt-based jobs assigned to agents:
- **MR.NICE** posts to social media
- **FORGE** generates content
- **CRAWLER** researches the web
- **VAULT** manages data
- **WIRE** handles integrations
- **ABBY** orchestrates the swarm

Schedules: every minute → weekly Monday (8 options).

## Integrations
- **Email**: Resend (verify domain to enable)
- **Scraping**: Firecrawl, ScrapingBee, Scrapfly, Steel
- **Screenshots**: ScreenshotOne
- **LLM**: OpenAI, NVIDIA NIM
- **OAuth**: Composio (universal hub)
- **Vector DB**: Pinecone
- **Compute**: E2B
- **Analytics**: Helicone
- **Events**: Inngest
- **Bot**: Discord

## Local Dev
```bash
npm install --legacy-peer-deps
npm run build
npm start
```

See `CHANGELOG.md` and `AI_NOTES.md` for full architecture details.
