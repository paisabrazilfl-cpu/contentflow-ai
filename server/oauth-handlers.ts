/**
 * Direct OAuth Handlers
 *
 * Replaces Composio with native OAuth flows for major platforms.
 * Each handler has:
 *  - authorizeUrl: where to redirect the user
 *  - exchangeCode: trade the auth code for an access token
 *  - refreshToken: refresh an expired token
 *
 * For platforms requiring app credentials, we read from env:
 *  - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *  - META_APP_ID, META_APP_SECRET
 *  - TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET
 *  - REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET
 *  - LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET
 *  - X_CLIENT_ID, X_CLIENT_SECRET
 *  - WORDPRESS_CLIENT_ID, WORDPRESS_CLIENT_SECRET
 *
 * Each platform stores its tokens in the connected_accounts table
 * with businessId scoping. No Composio needed.
 */

import { Client } from "pg";
import { ENV } from "./_core/env";

export type PlatformOAuthConfig = {
  id: string;
  name: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientIdEnv: string;
  clientSecretEnv: string;
  refreshable: boolean;
  notes?: string;
};

export const PLATFORMS: Record<string, PlatformOAuthConfig> = {
  google_business: {
    id: "google_business",
    name: "Google Business Profile",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "https://www.googleapis.com/auth/business.manage",
      "openid", "email", "profile",
    ],
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    refreshable: true,
    notes: "Google Business Profile API",
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
      "openid", "email", "profile",
    ],
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    refreshable: true,
    notes: "YouTube Data API v3",
  },
  facebook: {
    id: "facebook",
    name: "Facebook Pages",
    authorizeUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    scopes: [
      "pages_show_list", "pages_manage_posts", "pages_read_engagement",
      "pages_manage_metadata", "publish_to_groups",
    ],
    clientIdEnv: "META_APP_ID",
    clientSecretEnv: "META_APP_SECRET",
    refreshable: true,
    notes: "Facebook Pages API",
  },
  instagram: {
    id: "instagram",
    name: "Instagram Business",
    authorizeUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    scopes: [
      "instagram_basic", "instagram_content_publish",
      "pages_show_list", "pages_manage_posts",
    ],
    clientIdEnv: "META_APP_ID",
    clientSecretEnv: "META_APP_SECRET",
    refreshable: true,
    notes: "Instagram Graph API",
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok for Business",
    authorizeUrl: "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    scopes: ["user.info.basic", "video.publish", "video.upload"],
    clientIdEnv: "TIKTOK_CLIENT_KEY",
    clientSecretEnv: "TIKTOK_CLIENT_SECRET",
    refreshable: true,
    notes: "TikTok for Developers",
  },
  reddit: {
    id: "reddit",
    name: "Reddit",
    authorizeUrl: "https://www.reddit.com/api/v1/authorize",
    tokenUrl: "https://www.reddit.com/api/v1/access_token",
    scopes: ["identity", "submit", "edit", "read"],
    clientIdEnv: "REDDIT_CLIENT_ID",
    clientSecretEnv: "REDDIT_CLIENT_SECRET",
    refreshable: true,
    notes: "Reddit OAuth2",
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scopes: ["openid", "profile", "email", "w_member_social"],
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
    refreshable: true,
    notes: "LinkedIn API",
  },
  x: {
    id: "x",
    name: "X (Twitter)",
    authorizeUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    clientIdEnv: "X_CLIENT_ID",
    clientSecretEnv: "X_CLIENT_SECRET",
    refreshable: true,
    notes: "X API v2",
  },
  wordpress: {
    id: "wordpress",
    name: "WordPress.com",
    authorizeUrl: "https://public-api.wordpress.com/oauth2/authorize",
    tokenUrl: "https://public-api.wordpress.com/oauth2/token",
    scopes: ["global", "posts"],
    clientIdEnv: "WORDPRESS_CLIENT_ID",
    clientSecretEnv: "WORDPRESS_CLIENT_SECRET",
    refreshable: true,
    notes: "WordPress.com OAuth2",
  },
};

/**
 * Check if a platform has its OAuth credentials configured
 */
export function isPlatformConfigured(platformId: string): boolean {
  const config = PLATFORMS[platformId];
  if (!config) return false;
  const clientId = process.env[config.clientIdEnv];
  const clientSecret = process.env[config.clientSecretEnv];
  return !!(clientId && clientSecret && clientId.length > 5 && clientSecret.length > 5);
}

/**
 * Generate the authorize URL for a platform
 */
export function getAuthorizeUrl(
  platformId: string,
  redirectUri: string,
  state: string
): string | null {
  const config = PLATFORMS[platformId];
  if (!config) return null;
  if (!isPlatformConfigured(platformId)) return null;

  const clientId = process.env[config.clientIdEnv]!;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    state,
  });

  // TikTok uses different params
  if (platformId === "tiktok") {
    params.set("client_key", clientId);
    params.delete("client_id");
  }

  // X (Twitter) requires PKCE; we add a placeholder for now
  if (platformId === "x") {
    params.set("code_challenge", "challenge");
    params.set("code_challenge_method", "plain");
  }

  return `${config.authorizeUrl}?${params.toString()}`;
}

/**
 * Exchange auth code for access token
 */
export async function exchangeCodeForToken(
  platformId: string,
  code: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
  tokenType?: string;
} | null> {
  const config = PLATFORMS[platformId];
  if (!config || !isPlatformConfigured(platformId)) return null;

  const clientId = process.env[config.clientIdEnv]!;
  const clientSecret = process.env[config.clientSecretEnv]!;

  try {
    const body: Record<string, string> = {
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    };

    // Some platforms need PKCE or different params
    if (platformId === "x") {
      body.code_verifier = "challenge";
    }

    const res = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: new URLSearchParams(body).toString(),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error(`[OAuth] ${platformId} token exchange failed:`, res.status, t.slice(0, 300));
      return null;
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
      tokenType: data.token_type,
    };
  } catch (e) {
    console.error(`[OAuth] ${platformId} exchange error:`, String(e));
    return null;
  }
}

/**
 * Refresh an access token using a refresh token
 */
export async function refreshAccessToken(
  platformId: string,
  refreshToken: string
): Promise<string | null> {
  const config = PLATFORMS[platformId];
  if (!config || !isPlatformConfigured(platformId)) return null;

  const clientId = process.env[config.clientIdEnv]!;
  const clientSecret = process.env[config.clientSecretEnv]!;

  try {
    const res = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Save a connection to the database
 */
export async function saveConnection(opts: {
  businessId: number;
  platform: string;
  accountId: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes?: string;
}): Promise<void> {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: false });
  await client.connect();
  try {
    await client.query(
      `INSERT INTO connected_accounts
         ("businessId", platform, "platformAccountId", "accountName", "accessToken", "refreshToken", "expiresAt", scopes, status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', NOW(), NOW())
       ON CONFLICT ("businessId", platform, "platformAccountId")
       DO UPDATE SET
         "accessToken" = EXCLUDED."accessToken",
         "refreshToken" = EXCLUDED."refreshToken",
         "expiresAt" = EXCLUDED."expiresAt",
         scopes = EXCLUDED.scopes,
         status = 'active',
         "updatedAt" = NOW()`,
      [
        opts.businessId,
        opts.platform,
        opts.accountId,
        opts.accountName,
        opts.accessToken,
        opts.refreshToken || null,
        opts.expiresAt || null,
        opts.scopes || null,
      ]
    );
  } finally {
    await client.end();
  }
}

/**
 * Get list of supported platforms with their config status
 */
export function listAvailablePlatforms() {
  return Object.values(PLATFORMS).map(p => ({
    id: p.id,
    name: p.name,
    configured: isPlatformConfigured(p.id),
    scopes: p.scopes,
    notes: p.notes,
  }));
}
