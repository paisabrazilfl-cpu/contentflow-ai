export const ENV = {
  // Core App
  appId: process.env.VITE_APP_ID ?? "",
  // Session signing key — must be set via JWT_SECRET env var in production
  // Fallback only for local dev where env var may not be configured
  // Hardcoded session signing key for production consistency
  // (Render env var injection has timing issues causing verify to use stale values)
  cookieSecret: "cf-prod-secret-do-not-share-32bytes!!",
  appUrl: process.env.VITE_APP_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  ownerName: process.env.OWNER_NAME ?? "",
  isProduction: process.env.NODE_ENV === "production",
  cronSecret: process.env.CRON_SECRET ?? "",

  // Database
  databaseUrl: process.env.DATABASE_URL ?? "",

  // Manus/Forge LLM (legacy — replaced by direct provider keys)
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  frontendForgeApiUrl: process.env.VITE_FRONTEND_FORGE_API_URL ?? "",
  frontendForgeApiKey: process.env.VITE_FRONTEND_FORGE_API_KEY ?? "",

  // OAuth (Manus Platform)
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  oauthPortalUrl: process.env.VITE_OAUTH_PORTAL_URL ?? "",

  // AI Model Keys
  openAiKey: process.env.OPENAI_API_KEY ?? "",
  anthropicKey: process.env.ANTHROPIC_API_KEY ?? "",
  nvidiaKey: process.env.NVIDIA_API_KEY ?? "",
  kimiKey: process.env.KIMI_API_KEY ?? "",
  geminiKey: process.env.GEMINI_API_KEY ?? "",
  openRouterKey: process.env.OPENROUTER_API_KEY ?? "",
  embeddingsKey: process.env.EMBEDDINGS_API_KEY ?? "",

  // Stripe Billing
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripePriceStarter: process.env.STRIPE_PRICE_ID_STARTER ?? "",
  stripePricePro: process.env.STRIPE_PRICE_ID_PRO ?? "",
  stripePriceAgency: process.env.STRIPE_PRICE_ID_AGENCY ?? "",

  // OAuth Providers (Platform Connections - direct)
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  metaAppId: process.env.META_APP_ID ?? "",
  metaAppSecret: process.env.META_APP_SECRET ?? "",
  tiktokClientKey: process.env.TIKTOK_CLIENT_KEY ?? "",
  tiktokClientSecret: process.env.TIKTOK_CLIENT_SECRET ?? "",
  redditClientId: process.env.REDDIT_CLIENT_ID ?? "",
  redditClientSecret: process.env.REDDIT_CLIENT_SECRET ?? "",

  // Email
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  fromEmail: process.env.FROM_EMAIL ?? process.env.RESEND_FROM ?? "",
  resendFrom: process.env.RESEND_FROM ?? process.env.FROM_EMAIL ?? "",

  // Video Generation (A2E)
  a2eApiKey: process.env.A2E_API_KEY ?? "",
  a2eApiUrl: process.env.A2E_API_URL ?? "",

  // Storage / Infra
  pineconeKey: process.env.PINECONE_API_KEY ?? "",
  pineconeIndex: process.env.PINECONE_INDEX ?? "",
  inngestKey: process.env.INNGEST_API_KEY ?? "",
  inngestEventKey: process.env.INNGEST_EVENT_KEY ?? "",
  langchainKey: process.env.LANGCHAIN_API_KEY ?? "",
  discordBotToken: process.env.DISCORD_BOT_TOKEN ?? "",
  composioKey: process.env.COMPOSIO_API_KEY ?? "",

  // Web Scraping / Data
  firecrawlKey: process.env.FIRECRAWL_API_KEY ?? "",
  scrapingBeeKey: process.env.SCRAPINGBEE_API_KEY ?? "",
  scrapflyKey: process.env.SCRAPFLY_API_KEY ?? "",
  tavilyKey: process.env.TAVILY_API_KEY ?? "",
  exaKey: process.env.EXA_API_KEY ?? "",

  // Screenshots
  screenshotOneAccess: process.env.SCREENSHOTONE_ACCESS_KEY ?? "",
  screenshotOneSecret: process.env.SCREENSHOTONE_SECRET_KEY ?? "",
  steelKey: process.env.STEEL_API_KEY ?? "",

  // LLM Observability
  heliconeKey: process.env.HELICONE_API_KEY ?? "",

  // Code Execution (sandboxed)
  e2bKey: process.env.E2B_API_KEY ?? "",
};