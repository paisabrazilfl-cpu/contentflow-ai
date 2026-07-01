import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  deleteConnectedAccount,
  getConnectedAccount,
  getConnectedAccountsByUserId,
  upsertConnectedAccount,
} from "../db";
import {
  exchangeGoogleCode,
  exchangeMetaCode,
  exchangeRedditCode,
  exchangeTikTokCode,
  getGoogleAuthUrl,
  getGoogleUserInfo,
  getMetaAuthUrl,
  getMetaUserInfo,
  getRedditAuthUrl,
  getRedditUserInfo,
  getTikTokAuthUrl,
  getTikTokUserInfo,
} from "../services/oauthProviders";
import { protectedProcedure, router } from "../_core/trpc";
import { enforcePlatformConnectionLimit, getUserTierSummary } from "../services/tierEnforcement";
import { ENV } from "../_core/env";

const PLATFORM_SCHEMA = z.enum([
  "google_youtube",
  "google_business",
  "meta_facebook",
  "meta_instagram",
  "tiktok",
  "reddit",
]);

// Returns which platforms have their OAuth env vars set on the server.
// This is safe to expose to the frontend — it only reveals presence, not values.
function getConfiguredPlatforms(): string[] {
  const configured: string[] = [];
  if (ENV.googleClientId && ENV.googleClientSecret) {
    configured.push("google_youtube", "google_business");
  }
  if (ENV.metaAppId && ENV.metaAppSecret) {
    configured.push("meta_facebook", "meta_instagram");
  }
  if (ENV.tiktokClientKey && ENV.tiktokClientSecret) {
    configured.push("tiktok");
  }
  if (ENV.redditClientId && ENV.redditClientSecret) {
    configured.push("reddit");
  }
  return configured;
}

export const oauthRouter = router({
  // Which platforms have server-side OAuth credentials configured
  getConfiguredPlatforms: protectedProcedure.query(() => {
    return getConfiguredPlatforms();
  }),

  // List all connected accounts for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const accounts = await getConnectedAccountsByUserId(ctx.user.id);
    return accounts.map((a) => ({
      id: a.id,
      platform: a.platform,
      platformUsername: a.platformUsername,
      platformUserId: a.platformUserId,
      scopes: a.scopes,
      connectedAt: a.createdAt,
      tokenExpiresAt: a.tokenExpiresAt,
    }));
  }),

  // Generate the OAuth redirect URL for a given platform
  getAuthUrl: protectedProcedure
    .input(
      z.object({
        platform: PLATFORM_SCHEMA,
        redirectUri: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Enforce platform connection limit before generating the auth URL
      await enforcePlatformConnectionLimit(ctx.user.id);
      // Encode userId + platform in state for CSRF protection
      const state = Buffer.from(JSON.stringify({ userId: ctx.user.id, platform: input.platform })).toString("base64url");

      let url: string;
      switch (input.platform) {
        case "google_youtube":
        case "google_business":
          url = getGoogleAuthUrl(input.redirectUri, input.platform, state);
          break;
        case "meta_facebook":
        case "meta_instagram":
          url = getMetaAuthUrl(input.redirectUri, input.platform, state);
          break;
        case "tiktok":
          url = getTikTokAuthUrl(input.redirectUri, state);
          break;
        case "reddit":
          url = getRedditAuthUrl(input.redirectUri, state);
          break;
        default:
          throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown platform" });
      }
      return { url };
    }),

  // Handle OAuth callback — exchange code for tokens and store
  handleCallback: protectedProcedure
    .input(
      z.object({
        platform: PLATFORM_SCHEMA,
        code: z.string(),
        redirectUri: z.string().url(),
        state: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let accessToken: string;
      let refreshToken: string | null = null;
      let tokenExpiresAt: Date | null = null;
      let platformUserId: string | null = null;
      let platformUsername: string | null = null;
      let scopes: string | null = null;

      try {
        switch (input.platform) {
          case "google_youtube":
          case "google_business": {
            const tokens = await exchangeGoogleCode(input.code, input.redirectUri);
            accessToken = tokens.access_token;
            refreshToken = tokens.refresh_token ?? null;
            tokenExpiresAt = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null;
            scopes = tokens.scope ?? null;
            const info = await getGoogleUserInfo(accessToken);
            platformUserId = info.id;
            platformUsername = info.name;
            break;
          }
          case "meta_facebook":
          case "meta_instagram": {
            const tokens = await exchangeMetaCode(input.code, input.redirectUri);
            accessToken = tokens.access_token;
            tokenExpiresAt = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null;
            const info = await getMetaUserInfo(accessToken);
            platformUserId = info.id;
            platformUsername = info.name;
            break;
          }
          case "tiktok": {
            const tokens = await exchangeTikTokCode(input.code, input.redirectUri);
            accessToken = tokens.access_token;
            refreshToken = tokens.refresh_token ?? null;
            tokenExpiresAt = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null;
            scopes = tokens.scope ?? null;
            const info = await getTikTokUserInfo(accessToken);
            platformUserId = info.id;
            platformUsername = info.name;
            break;
          }
          case "reddit": {
            const tokens = await exchangeRedditCode(input.code, input.redirectUri);
            accessToken = tokens.access_token;
            refreshToken = tokens.refresh_token ?? null;
            tokenExpiresAt = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null;
            scopes = tokens.scope ?? null;
            const info = await getRedditUserInfo(accessToken);
            platformUserId = info.id;
            platformUsername = info.name;
            break;
          }
          default:
            throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown platform" });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `OAuth callback failed: ${msg}` });
      }

      // Re-check limit at callback time (race condition protection)
      // Only enforce if this is a NEW connection (not a re-auth of existing)
      const existing = await getConnectedAccount(ctx.user.id, input.platform);
      if (!existing) {
        await enforcePlatformConnectionLimit(ctx.user.id);
      }

      await upsertConnectedAccount({
        id: existing?.id,
        userId: ctx.user.id,
        platform: input.platform,
        accessToken,
        refreshToken,
        tokenExpiresAt,
        platformUserId,
        platformUsername,
        scopes,
      });

      return { success: true, platformUsername };
    }),

  // Get full tier summary for the current user
  getTierSummary: protectedProcedure.query(async ({ ctx }) => {
    return getUserTierSummary(ctx.user.id);
  }),

  // Disconnect a platform
  disconnect: protectedProcedure
    .input(z.object({ platform: PLATFORM_SCHEMA }))
    .mutation(async ({ ctx, input }) => {
      await deleteConnectedAccount(ctx.user.id, input.platform);
      return { success: true };
    }),
});
