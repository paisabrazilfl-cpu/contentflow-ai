/**
 * OAuth provider configurations and token exchange helpers.
 * Credentials come from environment variables — no keys are hardcoded.
 */

import { ENV } from "../_core/env";

export type OAuthPlatform =
  | "google_youtube"
  | "google_business"
  | "meta_facebook"
  | "meta_instagram"
  | "tiktok"
  | "reddit";

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

// ─── Google ───────────────────────────────────────────────────────────────────
export function getGoogleAuthUrl(redirectUri: string, platform: "google_youtube" | "google_business", state: string): string {
  const scopes =
    platform === "google_youtube"
      ? [
          "https://www.googleapis.com/auth/youtube.upload",
          "https://www.googleapis.com/auth/youtube",
          "https://www.googleapis.com/auth/youtube.readonly",
          "openid",
          "email",
          "profile",
        ]
      : [
          "https://www.googleapis.com/auth/business.manage",
          "openid",
          "email",
          "profile",
        ];

  const params = new URLSearchParams({
    client_id: ENV.googleClientId ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGoogleCode(code: string, redirectUri: string): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: ENV.googleClientId ?? "",
      client_secret: ENV.googleClientSecret ?? "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);
  return res.json() as Promise<TokenResponse>;
}

export async function refreshGoogleToken(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: ENV.googleClientId ?? "",
      client_secret: ENV.googleClientSecret ?? "",
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Google token refresh failed: ${await res.text()}`);
  return res.json() as Promise<TokenResponse>;
}

export async function getGoogleUserInfo(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch Google user info");
  return res.json() as Promise<{ id: string; name: string; email: string }>;
}

// ─── Meta / Facebook ──────────────────────────────────────────────────────────
export function getMetaAuthUrl(redirectUri: string, platform: "meta_facebook" | "meta_instagram", state: string): string {
  const scopes =
    platform === "meta_instagram"
      ? ["instagram_basic", "instagram_content_publish", "pages_show_list", "pages_read_engagement"]
      : ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "publish_to_groups"];

  const params = new URLSearchParams({
    client_id: ENV.metaAppId ?? "",
    redirect_uri: redirectUri,
    scope: scopes.join(","),
    response_type: "code",
    state,
  });
  return `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
}

export async function exchangeMetaCode(code: string, redirectUri: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    client_id: ENV.metaAppId ?? "",
    client_secret: ENV.metaAppSecret ?? "",
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${params}`);
  if (!res.ok) throw new Error(`Meta token exchange failed: ${await res.text()}`);
  return res.json() as Promise<TokenResponse>;
}

export async function refreshMetaToken(accessToken: string): Promise<TokenResponse> {
  // Meta uses long-lived tokens; exchange short-lived for long-lived
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: ENV.metaAppId ?? "",
    client_secret: ENV.metaAppSecret ?? "",
    fb_exchange_token: accessToken,
  });
  const res = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${params}`);
  if (!res.ok) throw new Error(`Meta token refresh failed: ${await res.text()}`);
  return res.json() as Promise<TokenResponse>;
}

export async function getMetaUserInfo(accessToken: string) {
  const res = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${accessToken}`);
  if (!res.ok) throw new Error("Failed to fetch Meta user info");
  return res.json() as Promise<{ id: string; name: string }>;
}

// ─── TikTok ───────────────────────────────────────────────────────────────────
export function getTikTokAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_key: ENV.tiktokClientKey ?? "",
    redirect_uri: redirectUri,
    scope: "user.info.basic,video.publish,video.upload",
    response_type: "code",
    state,
  });
  return `https://www.tiktok.com/v2/auth/authorize?${params}`;
}

export async function exchangeTikTokCode(code: string, redirectUri: string): Promise<TokenResponse> {
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: ENV.tiktokClientKey ?? "",
      client_secret: ENV.tiktokClientSecret ?? "",
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`TikTok token exchange failed: ${await res.text()}`);
  const data = (await res.json()) as { data: TokenResponse };
  return data.data;
}

export async function refreshTikTokToken(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: ENV.tiktokClientKey ?? "",
      client_secret: ENV.tiktokClientSecret ?? "",
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error(`TikTok token refresh failed: ${await res.text()}`);
  const data = (await res.json()) as { data: TokenResponse };
  return data.data;
}

export async function getTikTokUserInfo(accessToken: string) {
  const res = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch TikTok user info");
  const data = (await res.json()) as { data: { user: { open_id: string; display_name: string } } };
  return { id: data.data.user.open_id, name: data.data.user.display_name };
}

// ─── Reddit ───────────────────────────────────────────────────────────────────
export function getRedditAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.REDDIT_CLIENT_ID ?? "",
    response_type: "code",
    state,
    redirect_uri: redirectUri,
    duration: "permanent",
    scope: "submit read identity",
  });
  return `https://www.reddit.com/api/v1/authorize?${params}`;
}

export async function exchangeRedditCode(code: string, redirectUri: string): Promise<TokenResponse> {
  const credentials = Buffer.from(
    `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
  ).toString("base64");
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "ContentFlowAI/1.0",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`Reddit token exchange failed: ${await res.text()}`);
  return res.json() as Promise<TokenResponse>;
}

export async function refreshRedditToken(refreshToken: string): Promise<TokenResponse> {
  const credentials = Buffer.from(
    `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
  ).toString("base64");
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "ContentFlowAI/1.0",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error(`Reddit token refresh failed: ${await res.text()}`);
  return res.json() as Promise<TokenResponse>;
}

export async function getRedditUserInfo(accessToken: string) {
  const res = await fetch("https://oauth.reddit.com/api/v1/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "ContentFlowAI/1.0",
    },
  });
  if (!res.ok) throw new Error("Failed to fetch Reddit user info");
  const data = (await res.json()) as { id: string; name: string };
  return { id: data.id, name: data.name };
}

// ─── Token Refresh Dispatcher ─────────────────────────────────────────────────
export async function refreshPlatformToken(
  platform: OAuthPlatform,
  refreshToken: string,
  accessToken?: string
): Promise<TokenResponse> {
  switch (platform) {
    case "google_youtube":
    case "google_business":
      return refreshGoogleToken(refreshToken);
    case "meta_facebook":
    case "meta_instagram":
      return refreshMetaToken(accessToken ?? refreshToken);
    case "tiktok":
      return refreshTikTokToken(refreshToken);
    case "reddit":
      return refreshRedditToken(refreshToken);
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}
