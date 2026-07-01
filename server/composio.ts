/**
 * Composio integration for OAuth connections.
 *
 * Uses Composio's REST API to manage OAuth connected accounts for:
 * Google Business, YouTube, Instagram, Facebook, TikTok, Reddit, WordPress, etc.
 *
 * Docs: https://docs.composio.dev
 * API base: https://backend.composio.dev/api/v1
 */

import { ENV } from "./_core/env";

const COMPOSIO_BASE = "https://backend.composio.dev/api/v1";

// Map our internal platform names → Composio toolkit slugs
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
  status: "active" | "pending" | "failed";
  accountId?: string;
  accountName?: string;
  redirectUrl?: string;
};

function hasKey(): boolean {
  return !!ENV.composioKey && ENV.composioKey.length > 0;
}

/**
 * Initiate OAuth connection for a platform.
 * Returns a redirect URL the user visits to grant access.
 */
export async function initiateConnection(
  userId: string,
  platform: string
): Promise<{ redirectUrl: string; connectionId: string } | { error: string }> {
  if (!hasKey()) return { error: "COMPOSIO_API_KEY not configured" };

  const toolkit = PLATFORM_TO_TOOLKIT[platform.toLowerCase()];
  if (!toolkit) return { error: `Unknown platform: ${platform}` };

  try {
    // First find or create auth config for this toolkit
    const cfgRes = await fetch(`${COMPOSIO_BASE}/auth_configs`, {
      method: "GET",
      headers: composioAuth(),
    });
    if (!cfgRes.ok) return { error: `Composio auth_configs failed: ${await cfgRes.text()}` };
    const cfgs = await cfgRes.json() as { items: Array<{ id: string; toolkit: string }> };
    let authConfigId = cfgs.items?.find(c => c.toolkit?.toLowerCase() === toolkit)?.id;

    if (!authConfigId) {
      // Create new auth config
      const createRes = await fetch(`${COMPOSIO_BASE}/auth_configs`, {
        method: "POST",
        headers: composioAuth(),
        body: JSON.stringify({
          toolkit: { slug: toolkit },
          authScheme: "OAUTH2",
          name: `contentflow-${toolkit}`,
        }),
      });
      if (!createRes.ok) return { error: `Composio create auth_config failed: ${await createRes.text()}` };
      const created = await createRes.json() as { id: string };
      authConfigId = created.id;
    }

    // Initiate connection
    const connRes = await fetch(`${COMPOSIO_BASE}/connected_accounts`, {
      method: "POST",
      headers: composioAuth(),
      body: JSON.stringify({
        authConfig: { id: authConfigId },
        userId,
        callbackUrl: `${process.env.VITE_APP_URL || "https://contentflow-ai-prod.onrender.com"}/platforms?connected=1`,
      }),
    });
    if (!connRes.ok) return { error: `Composio initiate connection failed: ${await connRes.text()}` };
    const conn = await connRes.json() as { id: string; redirectUrl?: string; connectionStatus?: string };

    return {
      redirectUrl: conn.redirectUrl || "",
      connectionId: conn.id,
    };
  } catch (err) {
    return { error: `Composio request failed: ${String(err)}` };
  }
}

/**
 * List all connected accounts for a user.
 */
export async function listConnections(userId: string): Promise<ComposioConnection[]> {
  if (!hasKey()) return [];

  try {
    const res = await fetch(`${COMPOSIO_BASE}/connected_accounts?userId=${encodeURIComponent(userId)}`, {
      method: "GET",
      headers: composioAuth(),
    });
    if (!res.ok) return [];
    const data = await res.json() as { items: Array<any> };
    return (data.items || []).map(item => ({
      id: item.id,
      toolkit: item.toolkit?.slug || item.authConfig?.toolkit?.slug || "",
      status: item.status === "ACTIVE" ? "active" : item.status === "INITIATED" ? "pending" : "failed",
      accountId: item.params?.id,
      accountName: item.params?.name || item.params?.email,
    }));
  } catch {
    return [];
  }
}

/**
 * Get connection status (poll after OAuth callback).
 */
export async function getConnection(connectionId: string): Promise<ComposioConnection | null> {
  if (!hasKey()) return null;
  try {
    const res = await fetch(`${COMPOSIO_BASE}/connected_accounts/${connectionId}`, {
      headers: composioAuth(),
    });
    if (!res.ok) return null;
    const item = await res.json() as any;
    return {
      id: item.id,
      toolkit: item.toolkit?.slug || item.authConfig?.toolkit?.slug || "",
      status: item.status === "ACTIVE" ? "active" : item.status === "INITIATED" ? "pending" : "failed",
      accountId: item.params?.id,
      accountName: item.params?.name || item.params?.email,
    };
  } catch {
    return null;
  }
}

/**
 * Disconnect (delete connected account).
 */
export async function disconnect(connectionId: string): Promise<boolean> {
  if (!hasKey()) return false;
  try {
    const res = await fetch(`${COMPOSIO_BASE}/connected_accounts/${connectionId}`, {
      method: "DELETE",
      headers: composioAuth(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Check if Composio is configured.
 */
export function composioEnabled(): boolean {
  return hasKey();
}