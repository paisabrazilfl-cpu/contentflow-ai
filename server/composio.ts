/**
 * Composio v3 integration for OAuth connections.
 *
 * Uses Composio's v3 REST API to manage OAuth connected accounts.
 * Supports 1000+ toolkits — Google Business, YouTube, Instagram, Facebook,
 * TikTok, Reddit, WordPress, LinkedIn, X, and more.
 *
 * Docs: https://docs.composio.dev/reference
 * API base: https://backend.composio.dev/api/v3
 * Auth: x-api-key header
 */

import { ENV } from "./_core/env";

const COMPOSIO_BASE = "https://backend.composio.dev/api/v3";

// Map our internal platform names → Composio toolkit slugs
// (Composio v3 uses toolkit slugs like "gmail", "googlebusiness", etc.)
export const PLATFORM_TO_TOOLKIT: Record<string, string> = {
  google: "googlebusiness",
  google_business: "googlebusiness",
  youtube: "youtube",
  instagram: "instagram",
  facebook: "facebook",
  tiktok: "tiktok",
  reddit: "reddit",
  wordpress: "wordpress",
  twitter: "twitter",
  x: "twitter",
  linkedin: "linkedin",
  pinterest: "pinterest",
  slack: "slack",
  github: "github",
  notion: "notion",
  gmail: "gmail",
  google_sheets: "googlesheets",
  google_drive: "googledrive",
};

const composioAuth = () => ({
  "content-type": "application/json",
  "x-api-key": ENV.composioKey || "",
});

export type ComposioConnection = {
  id: string;
  toolkit: string;
  status: "active" | "pending" | "failed" | "INITIALIZING" | "ACTIVE" | "FAILED" | "EXPIRED" | "DISABLED";
  accountId?: string;
  accountName?: string;
  redirectUrl?: string;
};

export function composioEnabled(): boolean {
  return !!ENV.composioKey && ENV.composioKey.length > 0;
}

async function composioFetch(path: string, init?: RequestInit): Promise<any> {
  if (!composioEnabled()) {
    return { error: "Composio not configured. Set COMPOSIO_API_KEY in env." };
  }

  const url = `${COMPOSIO_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...composioAuth(),
      ...(init?.headers || {}),
    },
  });

  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    return {
      error: data?.error?.message || data?.message || text || `HTTP ${res.status}`,
      status: res.status,
      response: data,
    };
  }

  return data;
}

/**
 * List all connected accounts for a user.
 * v3: GET /api/v3/connected_accounts?user_id=...
 */
export async function listConnections(userId: string): Promise<ComposioConnection[]> {
  if (!composioEnabled()) return [];

  const data = await composioFetch(`/connected_accounts?user_id=${encodeURIComponent(userId)}&limit=100`);
  if (data?.error) {
    console.warn("[Composio] listConnections error:", data.error);
    return [];
  }

  const items = data?.items || [];
  return items.map((c: any) => ({
    id: c.id || c.uuid || c.nanoid,
    toolkit: c.toolkit?.slug || c.toolkit_slug || "",
    status: normalizeStatus(c.status),
    accountId: c.account_id || c.id,
    accountName: c.account_name || c.toolkit?.name || c.toolkit_slug,
  }));
}

function normalizeStatus(s: any): ComposioConnection["status"] {
  if (!s) return "active";
  const lower = String(s).toUpperCase();
  if (["ACTIVE", "CONNECTED", "ENABLED"].includes(lower)) return "active";
  if (["INITIALIZING", "PENDING", "INITIATED"].includes(lower)) return "pending";
  if (["FAILED", "ERROR"].includes(lower)) return "failed";
  return "active";
}

/**
 * Initiate OAuth connection for a platform.
 * v3: POST /api/v3/connected_accounts
 */
export async function initiateConnection(
  userId: string,
  platform: string
): Promise<{ redirectUrl: string; connectionId: string } | { error: string }> {
  if (!composioEnabled()) {
    return { error: "Composio not configured" };
  }

  const toolkitSlug = PLATFORM_TO_TOOLKIT[platform] || platform;

  // v3 endpoint: POST /api/v3/connected_accounts
  // Body needs: auth_config, user_id, callback_url (optional)
  const body = {
    user_id: userId,
    toolkit: { slug: toolkitSlug },
  };

  // First, try to create with managed auth (composio-hosted OAuth)
  const data = await composioFetch(`/connected_accounts`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (data?.error) {
    // Try alternative: use auth_configs first to find or create one
    return { error: `Composio v3 init failed: ${data.error}. Try using direct OAuth handlers in oauth-handlers.ts instead.` };
  }

  // v3 response: { id, status, redirect_url?, ... }
  return {
    redirectUrl: data.redirect_url || data.redirectUrl || "",
    connectionId: data.id || data.nanoid || data.uuid,
  };
}

/**
 * Get a specific connection
 * v3: GET /api/v3/connected_accounts/{id}
 */
export async function getConnection(connectionId: string): Promise<ComposioConnection | null> {
  if (!composioEnabled()) return null;

  const data = await composioFetch(`/connected_accounts/${encodeURIComponent(connectionId)}`);
  if (data?.error) return null;

  return {
    id: data.id || data.nanoid || connectionId,
    toolkit: data.toolkit?.slug || "",
    status: normalizeStatus(data.status),
    accountId: data.id,
    accountName: data.account_name || data.toolkit?.name,
  };
}

/**
 * Disconnect / delete a connection
 * v3: DELETE /api/v3/connected_accounts/{id}
 */
export async function disconnect(connectionId: string): Promise<boolean> {
  if (!composioEnabled()) return false;

  const data = await composioFetch(`/connected_accounts/${encodeURIComponent(connectionId)}`, {
    method: "DELETE",
  });
  if (data?.error) return false;
  return true;
}

/**
 * List available toolkits (for the UI)
 * v3: GET /api/v3/toolkits
 */
export async function listToolkits(): Promise<any[]> {
  if (!composioEnabled()) return [];
  const data = await composioFetch(`/toolkits?limit=100`);
  if (data?.error) return [];
  return data.items || [];
}

/**
 * List auth configs (for OAuth app management)
 * v3: GET /api/v3/auth_configs
 */
export async function listAuthConfigs(): Promise<any[]> {
  if (!composioEnabled()) return [];
  const data = await composioFetch(`/auth_configs?limit=100`);
  if (data?.error) return [];
  return data.items || [];
}

/**
 * Execute a tool on a connected account (proxy request)
 * v3: POST /api/v3/tools/execute/proxy
 */
export async function executeTool(opts: {
  toolkit: string;
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  connectedAccountId: string;
  body?: any;
  parameters?: any[];
}): Promise<any> {
  if (!composioEnabled()) {
    return { error: "Composio not configured" };
  }

  const data = await composioFetch(`/tools/execute/proxy`, {
    method: "POST",
    body: JSON.stringify({
      toolkit: opts.toolkit,
      endpoint: opts.endpoint,
      method: opts.method || "GET",
      connected_account_id: opts.connectedAccountId,
      body: opts.body,
      parameters: opts.parameters,
    }),
  });
  return data;
}
