/**
 * API Pinger — tests each provider's API key by making a real request
 *
 * Each provider has a ping function that returns:
 *   { ok: boolean, latencyMs: number, message: string, detail?: any }
 */

import { ENV } from "./_core/env";

export type PingResult = {
  ok: boolean;
  latencyMs: number;
  message: string;
  detail?: any;
  endpoint?: string;
};

export type PingableProvider = {
  id: string;
  name: string;
  description: string;
  docsUrl: string;
  ping: (key: string) => Promise<PingResult>;
};

// ─────────────────────────────────────────────────────────────
// Provider ping implementations
// ─────────────────────────────────────────────────────────────

async function pingOpenAI(key: string): Promise<PingResult> {
  const start = Date.now();
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });
    const latency = Date.now() - start;
    if (res.ok) {
      const data = await res.json();
      const count = (data.data || []).length;
      return { ok: true, latencyMs: latency, message: `Connected. ${count} models available.`, endpoint: "/v1/models" };
    }
    const err = await res.json().catch(() => ({}));
    return { ok: false, latencyMs: latency, message: `HTTP ${res.status}: ${err?.error?.message || res.statusText}`, endpoint: "/v1/models" };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, message: `Network error: ${e?.message || String(e)}`, endpoint: "/v1/models" };
  }
}

async function pingAnthropic(key: string): Promise<PingResult> {
  const start = Date.now();
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      }),
    });
    const latency = Date.now() - start;
    if (res.ok) return { ok: true, latencyMs: latency, message: "Connected. Claude API reachable.", endpoint: "/v1/messages" };
    const err = await res.json().catch(() => ({}));
    return { ok: false, latencyMs: latency, message: `HTTP ${res.status}: ${err?.error?.message || res.statusText}`, endpoint: "/v1/messages" };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, message: `Network error: ${e?.message || String(e)}` };
  }
}

async function pingNVIDIA(key: string): Promise<PingResult> {
  const start = Date.now();
  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });
    const latency = Date.now() - start;
    if (res.ok) {
      const data = await res.json();
      const count = (data.data || []).length;
      return { ok: true, latencyMs: latency, message: `Connected. ${count} models available.`, endpoint: "/v1/models" };
    }
    return { ok: false, latencyMs: latency, message: `HTTP ${res.status}`, endpoint: "/v1/models" };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, message: `Network error: ${e?.message || String(e)}` };
  }
}

async function pingGemini(key: string): Promise<PingResult> {
  const start = Date.now();
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
    const latency = Date.now() - start;
    if (res.ok) {
      const data = await res.json();
      const count = (data.models || []).length;
      return { ok: true, latencyMs: latency, message: `Connected. ${count} models available.`, endpoint: "/v1beta/models" };
    }
    return { ok: false, latencyMs: latency, message: `HTTP ${res.status}`, endpoint: "/v1beta/models" };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, message: `Network error: ${e?.message || String(e)}` };
  }
}

async function pingResend(key: string): Promise<PingResult> {
  const start = Date.now();
  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
    });
    const latency = Date.now() - start;
    if (res.ok) {
      const data = await res.json();
      const count = (data.data || []).length;
      return { ok: true, latencyMs: latency, message: `Connected. ${count} domains configured.`, endpoint: "/domains" };
    }
    return { ok: false, latencyMs: latency, message: `HTTP ${res.status}`, endpoint: "/domains" };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, message: `Network error: ${e?.message || String(e)}` };
  }
}

async function pingFirecrawl(key: string): Promise<PingResult> {
  const start = Date.now();
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: "test", limit: 1 }),
    });
    const latency = Date.now() - start;
    if (res.ok) return { ok: true, latencyMs: latency, message: "Connected. Search endpoint reachable.", endpoint: "/v1/search" };
    const err = await res.json().catch(() => ({}));
    return { ok: false, latencyMs: latency, message: `HTTP ${res.status}: ${err?.error || res.statusText}`, endpoint: "/v1/search" };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, message: `Network error: ${e?.message || String(e)}` };
  }
}

async function pingScrapingBee(key: string): Promise<PingResult> {
  const start = Date.now();
  try {
    const url = `https://app.scrapingbee.com/api/v1/?api_key=${encodeURIComponent(key)}&url=${encodeURIComponent("https://example.com")}`;
    const res = await fetch(url, { method: "HEAD" });
    const latency = Date.now() - start;
    if (res.ok) return { ok: true, latencyMs: latency, message: "Connected. API reachable.", endpoint: "/api/v1" };
    return { ok: false, latencyMs: latency, message: `HTTP ${res.status}`, endpoint: "/api/v1" };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, message: `Network error: ${e?.message || String(e)}` };
  }
}

async function pingScrapfly(key: string): Promise<PingResult> {
  const start = Date.now();
  try {
    const res = await fetch(`https://api.scrapfly.io/account?key=${encodeURIComponent(key)}`);
    const latency = Date.now() - start;
    if (res.ok) {
      const data = await res.json();
      return { ok: true, latencyMs: latency, message: `Connected. Account: ${data?.account?.email || "verified"}`, endpoint: "/account" };
    }
    return { ok: false, latencyMs: latency, message: `HTTP ${res.status}`, endpoint: "/account" };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, message: `Network error: ${e?.message || String(e)}` };
  }
}

async function pingScreenshotOne(accessKey: string, secretKey?: string): Promise<PingResult> {
  const start = Date.now();
  try {
    const url = `https://api.screenshotone.com/take?access_key=${encodeURIComponent(accessKey)}&url=${encodeURIComponent("https://example.com")}&viewport_width=100&viewport_height=100`;
    const res = await fetch(url);
    const latency = Date.now() - start;
    if (res.ok) return { ok: true, latencyMs: latency, message: "Connected. Screenshot API reachable.", endpoint: "/take" };
    return { ok: false, latencyMs: latency, message: `HTTP ${res.status}`, endpoint: "/take" };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, message: `Network error: ${e?.message || String(e)}` };
  }
}

async function pingComposio(key: string): Promise<PingResult> {
  const start = Date.now();
  try {
    const res = await fetch("https://backend.composio.dev/api/v3/toolkits?limit=1", {
      headers: { "x-api-key": key },
    });
    const latency = Date.now() - start;
    if (res.ok) return { ok: true, latencyMs: latency, message: "Connected. Composio v3 reachable.", endpoint: "/api/v3/toolkits" };
    return { ok: false, latencyMs: latency, message: `HTTP ${res.status}`, endpoint: "/api/v3/toolkits" };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, message: `Network error: ${e?.message || String(e)}` };
  }
}

async function pingExa(key: string): Promise<PingResult> {
  const start = Date.now();
  try {
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "x-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ query: "test", numResults: 1 }),
    });
    const latency = Date.now() - start;
    if (res.ok) return { ok: true, latencyMs: latency, message: "Connected. Search API reachable.", endpoint: "/search" };
    const err = await res.json().catch(() => ({}));
    return { ok: false, latencyMs: latency, message: `HTTP ${res.status}: ${err?.error || res.statusText}`, endpoint: "/search" };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, message: `Network error: ${e?.message || String(e)}` };
  }
}

async function pingTavily(key: string): Promise<PingResult> {
  const start = Date.now();
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: key, query: "test", max_results: 1 }),
    });
    const latency = Date.now() - start;
    if (res.ok) return { ok: true, latencyMs: latency, message: "Connected. Search API reachable.", endpoint: "/search" };
    return { ok: false, latencyMs: latency, message: `HTTP ${res.status}`, endpoint: "/search" };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, message: `Network error: ${e?.message || String(e)}` };
  }
}

async function pingHelicone(key: string): Promise<PingResult> {
  // Helicone just verifies the key format since there's no public "me" endpoint
  return key.startsWith("sk-helicone-") && key.length > 20
    ? { ok: true, latencyMs: 0, message: "Format valid (sk-helicone-...)", endpoint: "(format check)" }
    : { ok: false, latencyMs: 0, message: "Invalid format — should start with sk-helicone-", endpoint: "(format check)" };
}

async function pingE2B(key: string): Promise<PingResult> {
  const start = Date.now();
  try {
    const res = await fetch("https://api.e2b.dev/healthcheck", {
      headers: { "X-API-Key": key },
    });
    const latency = Date.now() - start;
    if (res.ok) return { ok: true, latencyMs: latency, message: "Connected. Sandbox API reachable.", endpoint: "/healthcheck" };
    return { ok: false, latencyMs: latency, message: `HTTP ${res.status}`, endpoint: "/healthcheck" };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, message: `Network error: ${e?.message || String(e)}` };
  }
}

async function pingPinecone(key: string): Promise<PingResult> {
  const start = Date.now();
  try {
    // Try to list indexes — needs controller host which we don't know
    // Just verify key format
    if (!key.startsWith("pcsk_")) {
      return { ok: false, latencyMs: 0, message: "Invalid format — should start with pcsk_", endpoint: "(format check)" };
    }
    return { ok: true, latencyMs: 0, message: "Format valid (pcsk_...)", endpoint: "(format check)" };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, message: `Error: ${e?.message || String(e)}` };
  }
}

async function pingInngest(key: string): Promise<PingResult> {
  return key.length > 20
    ? { ok: true, latencyMs: 0, message: "Format valid", endpoint: "(format check)" }
    : { ok: false, latencyMs: 0, message: "Key too short", endpoint: "(format check)" };
}

async function pingSteel(key: string): Promise<PingResult> {
  return key.startsWith("ste-")
    ? { ok: true, latencyMs: 0, message: "Format valid (ste-...)", endpoint: "(format check)" }
    : { ok: false, latencyMs: 0, message: "Invalid format — should start with ste-", endpoint: "(format check)" };
}

async function pingDiscord(token: string): Promise<PingResult> {
  const start = Date.now();
  try {
    const res = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bot ${token}` },
    });
    const latency = Date.now() - start;
    if (res.ok) {
      const data = await res.json();
      return { ok: true, latencyMs: latency, message: `Connected. Bot: ${data?.username || "verified"}#${data?.discriminator || "0000"}`, endpoint: "/users/@me" };
    }
    return { ok: false, latencyMs: latency, message: `HTTP ${res.status}`, endpoint: "/users/@me" };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, message: `Network error: ${e?.message || String(e)}` };
  }
}

async function pingStripe(key: string): Promise<PingResult> {
  const start = Date.now();
  try {
    const res = await fetch("https://api.stripe.com/v1/balance", {
      headers: { Authorization: `Bearer ${key}` },
    });
    const latency = Date.now() - start;
    if (res.ok) return { ok: true, latencyMs: latency, message: "Connected. Stripe API reachable.", endpoint: "/v1/balance" };
    return { ok: false, latencyMs: latency, message: `HTTP ${res.status}`, endpoint: "/v1/balance" };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, message: `Network error: ${e?.message || String(e)}` };
  }
}

async function pingGoogleOAuth(clientId: string): Promise<PingResult> {
  // Just verify format — full OAuth needs secret + redirect
  return clientId.endsWith(".apps.googleusercontent.com") || clientId.length > 20
    ? { ok: true, latencyMs: 0, message: "Format valid (Google client ID)", endpoint: "(format check)" }
    : { ok: false, latencyMs: 0, message: "Invalid format — Google client IDs end in .apps.googleusercontent.com", endpoint: "(format check)" };
}

async function pingMetaApp(appId: string): Promise<PingResult> {
  return /^\d{10,20}$/.test(appId)
    ? { ok: true, latencyMs: 0, message: "Format valid (Meta App ID — numeric)", endpoint: "(format check)" }
    : { ok: false, latencyMs: 0, message: "Invalid format — Meta App ID should be a long numeric string", endpoint: "(format check)" };
}

async function pingTikTok(clientKey: string): Promise<PingResult> {
  return clientKey.length > 10
    ? { ok: true, latencyMs: 0, message: "Format valid", endpoint: "(format check)" }
    : { ok: false, latencyMs: 0, message: "Key too short", endpoint: "(format check)" };
}

async function pingReddit(clientId: string): Promise<PingResult> {
  return clientId.length > 10
    ? { ok: true, latencyMs: 0, message: "Format valid", endpoint: "(format check)" }
    : { ok: false, latencyMs: 0, message: "Key too short", endpoint: "(format check)" };
}

// ─────────────────────────────────────────────────────────────
// Provider registry
// ─────────────────────────────────────────────────────────────

export const PINGABLE_PROVIDERS: Record<string, PingableProvider> = {
  OPENAI_API_KEY: {
    id: "OPENAI_API_KEY", name: "OpenAI", description: "GPT-based content generation (GPT-4o, GPT-4, etc.)",
    docsUrl: "https://platform.openai.com/api-keys",
    ping: pingOpenAI,
  },
  ANTHROPIC_API_KEY: {
    id: "ANTHROPIC_API_KEY", name: "Anthropic", description: "Claude-based content generation",
    docsUrl: "https://console.anthropic.com/settings/keys",
    ping: pingAnthropic,
  },
  GOOGLE_CLIENT_ID: {
    id: "GOOGLE_CLIENT_ID", name: "Google OAuth", description: "Google Business / YouTube OAuth",
    docsUrl: "https://console.cloud.google.com/apis/credentials",
    ping: pingGoogleOAuth,
  },
  META_APP_ID: {
    id: "META_APP_ID", name: "Meta App", description: "Instagram / Facebook OAuth",
    docsUrl: "https://developers.facebook.com/apps/",
    ping: pingMetaApp,
  },
  TIKTOK_CLIENT_KEY: {
    id: "TIKTOK_CLIENT_KEY", name: "TikTok", description: "TikTok for Business OAuth",
    docsUrl: "https://developers.tiktok.com/apps/",
    ping: pingTikTok,
  },
  REDDIT_CLIENT_ID: {
    id: "REDDIT_CLIENT_ID", name: "Reddit", description: "Reddit OAuth",
    docsUrl: "https://www.reddit.com/prefs/apps",
    ping: pingReddit,
  },
  STRIPE_SECRET_KEY: {
    id: "STRIPE_SECRET_KEY", name: "Stripe", description: "Payment processing",
    docsUrl: "https://dashboard.stripe.com/apikeys",
    ping: pingStripe,
  },
  COMPOSIO_API_KEY: {
    id: "COMPOSIO_API_KEY", name: "Composio", description: "Universal OAuth hub (1000+ toolkits)",
    docsUrl: "https://dashboard.composio.dev/",
    ping: pingComposio,
  },
  A2E_API_KEY: {
    id: "A2E_API_KEY", name: "A2E AI", description: "AI video generation provider",
    docsUrl: "https://api.a2e.ai/v1/docs",
    ping: async (key: string): Promise<PingResult> => ({ ok: !!key, latencyMs: 0, message: key ? "Set" : "Not set", endpoint: "(no live ping)" }),
  },
  RESEND_API_KEY: {
    id: "RESEND_API_KEY", name: "Resend", description: "Transactional email service",
    docsUrl: "https://resend.com/api-keys",
    ping: pingResend,
  },
  FIRECRAWL_API_KEY: {
    id: "FIRECRAWL_API_KEY", name: "Firecrawl", description: "Web scraping + search",
    docsUrl: "https://firecrawl.dev/app/api-keys",
    ping: pingFirecrawl,
  },
  SCRAPINGBEE_API_KEY: {
    id: "SCRAPINGBEE_API_KEY", name: "ScrapingBee", description: "Web scraping API",
    docsUrl: "https://app.scrapingbee.com/account",
    ping: pingScrapingBee,
  },
  SCRAPFLY_API_KEY: {
    id: "SCRAPFLY_API_KEY", name: "Scrapfly", description: "Premium scraping service",
    docsUrl: "https://scrapfly.io/dashboard",
    ping: pingScrapfly,
  },
  SCREENSHOTONE_ACCESS_KEY: {
    id: "SCREENSHOTONE_ACCESS_KEY", name: "ScreenshotOne", description: "Screenshot generation API",
    docsUrl: "https://screenshotone.com/dashboard/",
    ping: (key: string) => pingScreenshotOne(key),
  },
  STEEL_API_KEY: {
    id: "STEEL_API_KEY", name: "Steel", description: "Browser automation API",
    docsUrl: "https://app.steel.dev/",
    ping: pingSteel,
  },
  EXA_API_KEY: {
    id: "EXA_API_KEY", name: "Exa", description: "AI-powered web search",
    docsUrl: "https://dashboard.exa.ai/api-keys",
    ping: pingExa,
  },
  TAVILY_API_KEY: {
    id: "TAVILY_API_KEY", name: "Tavily", description: "Web search for AI agents",
    docsUrl: "https://app.tavily.com/home",
    ping: pingTavily,
  },
  HELICONE_API_KEY: {
    id: "HELICONE_API_KEY", name: "Helicone", description: "LLM observability",
    docsUrl: "https://www.helicone.ai/settings/api-keys",
    ping: pingHelicone,
  },
  E2B_API_KEY: {
    id: "E2B_API_KEY", name: "E2B", description: "Cloud sandboxed code execution",
    docsUrl: "https://e2b.dev/dashboard",
    ping: pingE2B,
  },
  PINECONE_API_KEY: {
    id: "PINECONE_API_KEY", name: "Pinecone", description: "Vector database for embeddings",
    docsUrl: "https://app.pinecone.io/",
    ping: pingPinecone,
  },
  INNGEST_EVENT_KEY: {
    id: "INNGEST_EVENT_KEY", name: "Inngest", description: "Event-driven workflow engine",
    docsUrl: "https://www.inngest.com/env",
    ping: pingInngest,
  },
  DISCORD_BOT_TOKEN: {
    id: "DISCORD_BOT_TOKEN", name: "Discord Bot", description: "Discord bot integration",
    docsUrl: "https://discord.com/developers/applications",
    ping: pingDiscord,
  },
  NVIDIA_API_KEY: {
    id: "NVIDIA_API_KEY", name: "NVIDIA NIM", description: "Free LLM inference (Llama, Mistral, etc.)",
    docsUrl: "https://build.nvidia.com/explore/discover",
    ping: pingNVIDIA,
  },
  GEMINI_API_KEY: {
    id: "GEMINI_API_KEY", name: "Gemini", description: "Google Gemini models",
    docsUrl: "https://aistudio.google.com/app/apikey",
    ping: pingGemini,
  },
};

/**
 * Get the env var value for a provider
 */
export function getProviderEnvValue(providerId: string): string {
  const value = process.env[providerId];
  return value || "";
}

/**
 * Ping a provider — auto-detects key from env if not provided
 */
export async function pingProvider(providerId: string, overrideKey?: string): Promise<PingResult> {
  const provider = PINGABLE_PROVIDERS[providerId];
  if (!provider) {
    return { ok: false, latencyMs: 0, message: `Unknown provider: ${providerId}` };
  }
  const key = overrideKey || getProviderEnvValue(providerId);
  if (!key) {
    return { ok: false, latencyMs: 0, message: "No key set. Paste a key or set the env var." };
  }
  return provider.ping(key);
}

/**
 * List all pingable providers with current env status
 */
export function listProviders() {
  return Object.values(PINGABLE_PROVIDERS).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    docsUrl: p.docsUrl,
    isSet: !!getProviderEnvValue(p.id),
    hasMaskedValue: getProviderEnvValue(p.id).length > 0,
  }));
}