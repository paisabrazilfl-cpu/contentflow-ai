export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Generate the Manus OAuth login URL.
 *
 * If VITE_APP_URL is set (e.g. on Render pointing to the Manus domain),
 * the OAuth callback will use that domain — ensuring the redirect_uri
 * matches whatever is registered in each OAuth provider's console.
 *
 * On the Manus deployment itself, VITE_APP_URL is not needed because
 * window.location.origin is already the authorized domain.
 */
export const getLoginUrl = (postAuthPath = "/dashboard") => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // Guard: if env vars aren't set, auth is unavailable — redirect to setup page
  if (!oauthPortalUrl || !appId) {
    return `${window.location.origin}/?setup_error=oauth_not_configured`;
  }

  // Use VITE_APP_URL override when provided (e.g. Render → Manus domain),
  // otherwise fall back to the current origin.
  const appOrigin =
    (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, "") ||
    window.location.origin;

  const redirectUri = `${appOrigin}/api/oauth/callback`;
  const state = btoa(JSON.stringify({ redirectUri, postAuthPath }));

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
