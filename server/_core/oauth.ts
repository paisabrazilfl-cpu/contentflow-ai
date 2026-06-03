import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import * as googleOAuth from "../google-oauth";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/dashboard");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  // Google OAuth initiation endpoint
  app.get("/api/oauth/google/init", (req: Request, res: Response) => {
    const redirectUri = `${req.protocol}://${req.get("host")}/api/oauth/google/callback`;
    const state = Buffer.from(JSON.stringify({ redirectUri })).toString("base64");
    const authUrl = googleOAuth.getGoogleAuthUrl(redirectUri, state);
    res.redirect(302, authUrl);
  });

  // Google OAuth callback handler
  app.get("/api/oauth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const stateData = JSON.parse(Buffer.from(state, "base64").toString());
      const redirectUri = stateData.redirectUri || `${req.protocol}://${req.get("host")}/api/oauth/google/callback`;

      // Exchange code for tokens
      const tokens = await googleOAuth.exchangeCodeForTokens(code, redirectUri);

      // Get user info
      const userInfo = await googleOAuth.getGoogleUserInfo(tokens.accessToken);

      // Get the current user from session
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      // Get or create business for this user
      const business = await db.getBusinessByUserId(user.id);
      if (!business) {
        res.status(404).json({ error: "Business not found" });
        return;
      }

      // Store the connected account
      await db.addConnectedAccount({
        businessId: business.id,
        platform: "google",
        platformAccountId: userInfo.email,
        accountName: userInfo.name || userInfo.email,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || null,
        expiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        scopes: "https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/webmasters",
      });

      // Log activity (if logActivity exists)
      if (db.logActivity) {
        await db.logActivity({
          businessId: business.id,
          action: "Connected Google account",
          platform: "google",
          description: `Connected ${userInfo.email}`,
        });
      }

      // Redirect back to Platforms page with success
      res.redirect(302, `/platforms?connected=google&email=${encodeURIComponent(userInfo.email)}`);
    } catch (error: any) {
      console.error("[Google OAuth] Callback failed", error);
      res.redirect(302, `/platforms?error=${encodeURIComponent(error.message || "Google connection failed")}`);
    }
  });
}
