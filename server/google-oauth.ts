/**
 * Google OAuth 2.0 Handler
 * 
 * Handles the OAuth flow for Google Business Profile, YouTube, and Search Console.
 * Scopes requested:
 * - https://www.googleapis.com/auth/youtube (YouTube channel management)
 * - https://www.googleapis.com/auth/business.manage (Google Business Profile)
 * - https://www.googleapis.com/auth/webmasters (Search Console)
 */

import { URL } from "url";
import { ENV } from "./_core/env";

const GOOGLE_CLIENT_ID = ENV.googleClientId;
const GOOGLE_CLIENT_SECRET = ENV.googleClientSecret;
const GOOGLE_AUTH_URI = "https://accounts.google.com/o/oauth2/auth";
const GOOGLE_TOKEN_URI = "https://oauth2.googleapis.com/token";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/business.manage",
  "https://www.googleapis.com/auth/webmasters",
];

/**
 * Generate the Google OAuth authorization URL
 */
export function getGoogleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    state,
    access_type: "offline",
    prompt: "consent",
  });

  return `${GOOGLE_AUTH_URI}?${params.toString()}`;
}

/**
 * Exchange authorization code for access and refresh tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}> {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  const response = await fetch(GOOGLE_TOKEN_URI, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google token exchange failed: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in || 3600,
  };
}

/**
 * Get user's Google account info (email, name)
 */
export async function getGoogleUserInfo(accessToken: string): Promise<{
  email: string;
  name?: string;
}> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Google user info");
  }

  const data = await response.json();
  return {
    email: data.email,
    name: data.name,
  };
}
