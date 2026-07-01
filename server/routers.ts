import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";
import { generateContent } from "./ai-content";
import { runPublishingWorker } from "./publishing-worker";
import { analyzeBusinessWebsite } from "./business-analyzer";
import { scoreContent, getRecentTitles } from "./content-quality";
import { checkAIVisibility } from "./ai-visibility";
import { sendWelcomeEmail } from "./email-system";
import * as memoryStore from "./memory-store";
import { canConnectPlatform, canPublishContent, canUseContentType, canUseFeature, getOrCreateUsage, incrementUsage, getPlanLimits } from "./plan-limits";
import * as composio from "./composio";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    // DEBUG endpoint - shows exactly what server sees
    debug: publicProcedure.query(async ({ ctx }) => {
      const cookies = ctx.req.headers.cookie || "";
      const envCookieSecret = ENV.cookieSecret || "";
      const jwtSecretEnv = process.env.JWT_SECRET || "";
      // Try parsing the cookie manually
      const appSessionMatch = cookies.match(/app_session_id=([^;]+)/);
      const parsedCookie = appSessionMatch ? appSessionMatch[1] : null;
      // Try to verify it directly
      let verifyResult = "not_attempted";
      try {
        const { sdk } = await import("./_core/sdk");
        const result = await sdk.verifySession(parsedCookie || undefined);
        verifyResult = result ? "verified: " + result.openId : "returned_null";
      } catch (e: any) {
        verifyResult = "error: " + (e.message || String(e));
      }
      return {
        cookieHeader: cookies.substring(0, 200),
        cookieLength: cookies.length,
        parsedAppSessionLength: parsedCookie ? parsedCookie.length : 0,
        parsedAppSessionPrefix: parsedCookie ? parsedCookie.substring(0, 30) : "none",
        envCookieSecretLength: envCookieSecret.length,
        envCookieSecretPrefix: envCookieSecret.substring(0, 10),
        envCookieSecretSuffix: envCookieSecret.substring(envCookieSecret.length - 5),
        jwtSecretEnvSet: jwtSecretEnv.length > 0,
        verifyResult,
      };
    }),
    testQuery: publicProcedure.query(async () => {
      try {
        const db = await import("./db").then(m => m.getDb());
        if (!db) return { error: "no_db" };
        const _pgModule = await import("postgres");
        const pgConn = process.env.DATABASE_URL;
        const client = (pgConn ? (pgConn.includes('render') ? _pgModule.default : _pgModule.default) : null);
        if (!client) return { error: "no_lib" };
        const pg = client(pgConn, { ssl: false });
        try {
          // Direct query
          const direct = await pg`SELECT * FROM usage_tracking WHERE "businessId" = 1 AND "month" = '2026-07' LIMIT 1`;
          // Drizzle-style: select id, "businessId", "month", "postsPublished", "postsGenerated", "platformsConnected", "aiGenerations", "createdAt", "updatedAt" from "usage_tracking" where ("usage_tracking"."businessId" = $1 and "usage_tracking"."month" = $2) limit $3
          const drizzleLike = await pg.unsafe(`SELECT id, "businessId", "month", "postsPublished", "postsGenerated", "platformsConnected", "aiGenerations", "createdAt", "updatedAt" FROM "usage_tracking" WHERE ("usage_tracking"."businessId" = $1 AND "usage_tracking"."month" = $2) LIMIT $3`, [1, "2026-07", 1]);
          return { direct: direct, drizzleLike: drizzleLike };
        } finally {
          await pg.end();
        }
      } catch (e: any) {
        return { error: e?.message || String(e), code: e?.code, hint: e?.hint };
      }
    }),
    dbSchema: publicProcedure.query(async () => {
      try {
        const db = await import("./db").then(m => m.getDb());
        if (!db) return { error: "no_db_pool" };
        const pool = (db as any).$client || db;

        // Create tables if they don't exist
        await pool.unsafe(`CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          "openId" VARCHAR(64) NOT NULL UNIQUE,
          name TEXT,
          email VARCHAR(320),
          "loginMethod" VARCHAR(64),
          role VARCHAR(20) DEFAULT 'user' NOT NULL,
          "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
          "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
          "lastSignedIn" TIMESTAMP DEFAULT NOW() NOT NULL
        )`);

        await pool.unsafe(`CREATE TABLE IF NOT EXISTS businesses (
          id SERIAL PRIMARY KEY,
          "userId" INTEGER NOT NULL,
          name VARCHAR(255) NOT NULL,
          industry VARCHAR(128),
          "targetAudience" TEXT,
          "toneOfVoice" VARCHAR(128),
          "websiteUrl" VARCHAR(512),
          description TEXT,
          timezone VARCHAR(64) DEFAULT 'UTC',
          "topicClusters" JSONB,
          "contentTypes" JSONB,
          "postingSchedule" JSONB,
          "autoApprove" BOOLEAN DEFAULT false,
          "videoProvider" VARCHAR(64),
          "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
          "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
        )`);

        // Other essential tables
        await pool.unsafe(`CREATE TABLE IF NOT EXISTS connected_accounts (
          id SERIAL PRIMARY KEY,
          "businessId" INTEGER NOT NULL,
          platform VARCHAR(64) NOT NULL,
          "platformAccountId" VARCHAR(255),
          "accountName" TEXT,
          "accessToken" TEXT,
          "refreshToken" TEXT,
          "expiresAt" TIMESTAMP,
          scopes TEXT,
          status VARCHAR(20) DEFAULT 'active',
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )`);

        await pool.unsafe(`CREATE TABLE IF NOT EXISTS content_queue (
          id SERIAL PRIMARY KEY,
          "businessId" INTEGER NOT NULL,
          platform VARCHAR(64) NOT NULL,
          "contentType" VARCHAR(64) DEFAULT 'social',
          title TEXT,
          content TEXT,
          status VARCHAR(20) DEFAULT 'pending',
          "scheduledFor" TIMESTAMP DEFAULT NOW(),
          "publishedAt" TIMESTAMP,
          "engagementData" JSONB,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )`);

        await pool.unsafe(`CREATE TABLE IF NOT EXISTS api_keys (
          id SERIAL PRIMARY KEY,
          "businessId" INTEGER NOT NULL,
          provider VARCHAR(64) NOT NULL,
          "keyName" VARCHAR(128) NOT NULL,
          "keyValue" TEXT NOT NULL,
          "createdAt" TIMESTAMP DEFAULT NOW()
        )`);

        await pool.unsafe(`CREATE TABLE IF NOT EXISTS analytics_logs (
          id SERIAL PRIMARY KEY,
          "businessId" INTEGER NOT NULL,
          platform VARCHAR(64),
          "metricType" VARCHAR(64),
          "metricValue" NUMERIC,
          metadata JSONB,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )`);

        await pool.unsafe(`CREATE TABLE IF NOT EXISTS activity_feed (
          id SERIAL PRIMARY KEY,
          "businessId" INTEGER NOT NULL,
          action TEXT,
          platform VARCHAR(64),
          description TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW()
        )`);

        // Drop and recreate usage_tracking to ensure correct schema
        try { await pool.unsafe(`DROP TABLE IF EXISTS usage_tracking`); } catch {}
        await pool.unsafe(`CREATE TABLE IF NOT EXISTS usage_tracking (
          id SERIAL PRIMARY KEY,
          "businessId" INTEGER NOT NULL,
          "month" VARCHAR(7) NOT NULL,
          "postsPublished" INTEGER DEFAULT 0,
          "postsGenerated" INTEGER DEFAULT 0,
          "platformsConnected" INTEGER DEFAULT 0,
          "aiGenerations" INTEGER DEFAULT 0,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )`);

        // Recreate content_queue with all drizzle schema columns
        try { await pool.unsafe(`DROP TABLE IF EXISTS content_queue`); } catch {}
        await pool.unsafe(`CREATE TABLE IF NOT EXISTS content_queue (
          id SERIAL PRIMARY KEY,
          "businessId" INTEGER NOT NULL,
          platform VARCHAR(64) NOT NULL,
          "contentType" VARCHAR(64) DEFAULT 'social',
          title TEXT,
          content TEXT,
          "mediaUrls" JSONB,
          "scheduledFor" TIMESTAMP,
          "publishedAt" TIMESTAMP,
          status VARCHAR(32) DEFAULT 'pending',
          "errorLog" TEXT,
          "retryCount" INTEGER DEFAULT 0,
          "engagementData" JSONB,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )`);

        await pool.unsafe(`CREATE TABLE IF NOT EXISTS content_templates (
          id SERIAL PRIMARY KEY,
          "businessId" INTEGER,
          name VARCHAR(255) NOT NULL,
          "templateBody" TEXT,
          platform VARCHAR(64),
          "contentType" VARCHAR(64),
          variables JSONB,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )`);

        await pool.unsafe(`CREATE TABLE IF NOT EXISTS agent_actions (
          id SERIAL PRIMARY KEY,
          "businessId" INTEGER NOT NULL,
          action VARCHAR(128),
          result JSONB,
          status VARCHAR(20) DEFAULT 'pending',
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )`);

        await pool.unsafe(`CREATE TABLE IF NOT EXISTS social_metrics (
          id SERIAL PRIMARY KEY,
          "businessId" INTEGER NOT NULL,
          platform VARCHAR(64) NOT NULL,
          date DATE DEFAULT CURRENT_DATE,
          reach INTEGER DEFAULT 0,
          engagement INTEGER DEFAULT 0,
          impressions INTEGER DEFAULT 0,
          clicks INTEGER DEFAULT 0,
          "createdAt" TIMESTAMP DEFAULT NOW()
        )`);

        // Verify table schemas
        const usageCols = await pool.unsafe("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'usage_tracking' ORDER BY ordinal_position");
        const contentCols = await pool.unsafe("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'content_queue' ORDER BY ordinal_position");
        // Check result
        const tables = await pool.unsafe("SELECT tablename FROM pg_tables WHERE schemaname='public'");
        return { tables: tables, usageColumns: usageCols, contentColumns: contentCols, message: "All tables created/verified" };
      } catch (e: any) {
        return { error: e?.message || String(e) };
      }
    }),
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Hardcoded credentials: Luis / 1234
        if (input.username.trim().toLowerCase() !== "luis" || input.password.trim() !== "1234") {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
        }

        const openId = "user_luis";
        const name = "Luis";
        const email = "luis@contentflow.ai";

        // Upsert user in DB with raw SQL (drizzle schema is MySQL, DB is PostgreSQL)
        try {
          const postgres = (await import("postgres")).default;
          const pgConn = process.env.DATABASE_URL;
          if (pgConn) {
            const client = postgres(pgConn, { ssl: false });
            try {
              await client`INSERT INTO users ("openId", name, email, "loginMethod", role, "lastSignedIn") VALUES (${openId}, ${name}, ${email}, ${"credentials"}, ${"admin"}, NOW()) ON CONFLICT ("openId") DO UPDATE SET "lastSignedIn" = NOW()`;
            } finally {
              await client.end();
            }
          }
        } catch (e) {
          console.warn("[Login] user upsert failed:", String(e));
        }

        // Sign JWT session token
        const token = await sdk.signSession({ openId, appId: ENV.appId, name });

        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        const maxAge = ONE_YEAR_MS;  // Express cookie maxAge is in milliseconds
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge });

        return { success: true, name };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Business operations
  business: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getBusinessByUserId(ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      industry: z.string().optional(),
      targetAudience: z.string().optional(),
      toneOfVoice: z.string().optional(),
      websiteUrl: z.string().optional(),
      description: z.string().optional(),
      timezone: z.string().optional(),
      topicClusters: z.any().optional(),
      postingSchedule: z.any().optional(),
      contentTypes: z.any().optional(),
      autoApprove: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      // Use raw SQL via postgres.js client (drizzle schema is MySQL, DB is PostgreSQL)
      try {
        const postgres = (await import("postgres")).default;
        const pgConn = process.env.DATABASE_URL;
        if (!pgConn) throw new Error("No DATABASE_URL");
        const client = postgres(pgConn, { ssl: false });

        try {
          // Step 1: Upsert user and get real DB id
          const userRows = await client`INSERT INTO users ("openId", name, email, "loginMethod", role, "lastSignedIn")
             VALUES (${ctx.user.openId}, ${ctx.user.name || "User"}, ${ctx.user.email || null}, ${ctx.user.loginMethod || "credentials"}, ${"admin"}, NOW())
             ON CONFLICT ("openId") DO UPDATE SET "lastSignedIn" = NOW()
             RETURNING id`;

          let userId: number = ctx.user.id;
          if (userRows && userRows[0] && userRows[0].id) {
            userId = userRows[0].id;
          } else {
            // Try to fetch existing
            const existing = await client`SELECT id FROM users WHERE "openId" = ${ctx.user.openId} LIMIT 1`;
            if (existing && existing[0] && existing[0].id) userId = existing[0].id;
          }

          // Step 2: Insert business
          const bizRows = await client`INSERT INTO businesses ("userId", name, industry, "targetAudience", "toneOfVoice", "websiteUrl", description, timezone, "topicClusters", "contentTypes", "postingSchedule", "autoApprove")
             VALUES (${userId}, ${input.name}, ${input.industry || null}, ${input.targetAudience || null}, ${input.toneOfVoice || null}, ${input.websiteUrl || null}, ${input.description || null}, ${input.timezone || "UTC"}, ${JSON.stringify(input.topicClusters || [])}::jsonb, ${JSON.stringify(input.contentTypes || [])}::jsonb, ${JSON.stringify(input.postingSchedule || [])}::jsonb, ${input.autoApprove || false})
             RETURNING id`;

          console.log(`[Business.create] Created for userId=${userId}, name=${input.name}, bizId=${bizRows[0]?.id}`);

          // Also store in memory for fast access
          memoryStore.addBusiness({
            id: bizRows[0]?.id || 0,
            userId,
            name: input.name,
            industry: input.industry,
            targetAudience: input.targetAudience,
            toneOfVoice: input.toneOfVoice,
            websiteUrl: input.websiteUrl,
            description: input.description,
            timezone: input.timezone || "UTC",
            topicClusters: input.topicClusters || [],
            contentTypes: input.contentTypes || [],
            postingSchedule: input.postingSchedule || [],
            autoApprove: input.autoApprove || false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } finally {
          await client.end();
        }
      } catch (e: any) {
        console.error("[Business.create] FAILED:", e?.message || String(e));
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: e?.message || String(e) });
      }

      // Send welcome email
      if (ctx.user.email) {
        sendWelcomeEmail(ctx.user.email, input.name).catch(() => {});
      }
      return { success: true };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      industry: z.string().optional(),
      targetAudience: z.string().optional(),
      toneOfVoice: z.string().optional(),
      websiteUrl: z.string().optional(),
      description: z.string().optional(),
      topicClusters: z.any().optional(),
      contentTypes: z.any().optional(),
      postingSchedule: z.any().optional(),
      autoApprove: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const business = await db.getBusinessByUserId(ctx.user.id);
      if (!business || business.id !== id) throw new TRPCError({ code: 'FORBIDDEN' });
      await db.updateBusiness(id, data);
      return { success: true };
    }),
    // Business Analyzer — uses LLM to analyze website and generate content strategy
    analyze: protectedProcedure.input(z.object({
      websiteUrl: z.string().min(1),
      businessName: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      const analysis = await analyzeBusinessWebsite(input.websiteUrl, input.businessName);
      return analysis;
    }),
  }),

  // Platform connections
  platforms: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const business = await db.getBusinessByUserId(ctx.user.id);
      if (!business) return [];
      return db.getConnectedAccounts(business.id);
    }),
    connect: protectedProcedure.input(z.object({
      platform: z.string(),
      platformAccountId: z.string().optional(),
      accountName: z.string().optional(),
      accessToken: z.string().optional(),
      refreshToken: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const business = await db.getBusinessByUserId(ctx.user.id);
      if (!business) throw new TRPCError({ code: 'NOT_FOUND', message: 'Business not found' });
      // Plan enforcement: check platform limit
      const platformCheck = await canConnectPlatform(business.id, ctx.user.planTier);
      if (!platformCheck.allowed) throw new TRPCError({ code: 'FORBIDDEN', message: platformCheck.message });

      // If Composio is enabled, use it for OAuth
      if (composio.composioEnabled() && !input.accessToken) {
        const result = await composio.initiateConnection(String(ctx.user.id), input.platform);
        if ('error' in result) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error });
        }
        // Store pending connection
        await db.addConnectedAccount({
          businessId: business.id,
          platform: input.platform,
          platformAccountId: result.connectionId,
          accountName: `Pending OAuth (${input.platform})`,
          accessToken: result.redirectUrl, // store redirect URL temporarily
          refreshToken: null,
        });
        return { success: true, redirectUrl: result.redirectUrl, connectionId: result.connectionId };
      }

      // Fallback: direct credential-based connection
      await db.addConnectedAccount({
        businessId: business.id,
        platform: input.platform,
        platformAccountId: input.platformAccountId || '',
        accountName: input.accountName,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
      });
      return { success: true };
    }),

    // List Composio-connected accounts
    composioList: protectedProcedure.query(async ({ ctx }) => {
      if (!composio.composioEnabled()) return [];
      return composio.listConnections(String(ctx.user.id));
    }),

    // Initiate OAuth via Composio
    composioConnect: protectedProcedure.input(z.object({
      platform: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const business = await db.getBusinessByUserId(ctx.user.id);
      if (!business) throw new TRPCError({ code: 'NOT_FOUND', message: 'Business not found' });
      const platformCheck = await canConnectPlatform(business.id, ctx.user.planTier);
      if (!platformCheck.allowed) throw new TRPCError({ code: 'FORBIDDEN', message: platformCheck.message });

      if (!composio.composioEnabled()) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Composio not configured. Set COMPOSIO_API_KEY.' });
      }

      const result = await composio.initiateConnection(String(ctx.user.id), input.platform);
      if ('error' in result) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error });
      }
      return result;
    }),

    // Check connection status after OAuth callback
    composioStatus: protectedProcedure.input(z.object({
      connectionId: z.string(),
    })).query(async ({ input }) => {
      if (!composio.composioEnabled()) return null;
      return composio.getConnection(input.connectionId);
    }),

    // Disconnect via Composio
    composioDisconnect: protectedProcedure.input(z.object({
      connectionId: z.string(),
    })).mutation(async ({ input }) => {
      if (!composio.composioEnabled()) return { success: false };
      return { success: await composio.disconnect(input.connectionId) };
    }),
    disconnect: protectedProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const business = await db.getBusinessByUserId(ctx.user.id);
      if (!business) throw new TRPCError({ code: 'NOT_FOUND' });
      await db.removeConnectedAccount(input.id, business.id);
      return { success: true };
    }),
  }),

  // Content operations
  content: router({
    queue: protectedProcedure.input(z.object({
      status: z.string().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      const business = await db.getBusinessByUserId(ctx.user.id);
      if (!business) return [];
      return db.getContentQueue(business.id, input?.status);
    }),
    create: protectedProcedure.input(z.object({
      platform: z.string(),
      contentType: z.string().optional(),
      title: z.string().optional(),
      content: z.string().optional(),
      scheduledFor: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const business = await db.getBusinessByUserId(ctx.user.id);
      if (!business) throw new TRPCError({ code: 'NOT_FOUND' });
      // Plan enforcement: check post limit
      const postCheck = await canPublishContent(business.id, ctx.user.planTier);
      if (!postCheck.allowed) throw new TRPCError({ code: 'FORBIDDEN', message: postCheck.message });
      // Plan enforcement: check content type
      const typeCheck = canUseContentType(input.contentType || 'social', ctx.user.planTier);
      if (!typeCheck.allowed) throw new TRPCError({ code: 'FORBIDDEN', message: typeCheck.message });
      await db.createContentItem({
        businessId: business.id,
        platform: input.platform,
        contentType: input.contentType || 'social',
        title: input.title,
        content: input.content,
        scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : new Date(),
      });
      await incrementUsage(business.id, 'postsGenerated');
      return { success: true };
    }),
    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.string(),
    })).mutation(async ({ ctx, input }) => {
      await db.updateContentStatus(input.id, input.status);
      return { success: true };
    }),
    // AI Content Generation with quality scoring
    generate: protectedProcedure.input(z.object({
      platform: z.string(),
      contentType: z.string().default("social"),
      topic: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const business = await db.getBusinessByUserId(ctx.user.id);
      if (!business) throw new TRPCError({ code: 'NOT_FOUND', message: 'Business not found. Complete onboarding first.' });
      // Plan enforcement: check content type and post limit
      const typeCheck = canUseContentType(input.contentType, ctx.user.planTier);
      if (!typeCheck.allowed) throw new TRPCError({ code: 'FORBIDDEN', message: typeCheck.message });
      const postCheck = await canPublishContent(business.id, ctx.user.planTier);
      if (!postCheck.allowed) throw new TRPCError({ code: 'FORBIDDEN', message: postCheck.message });

      const generated = await generateContent({
        platform: input.platform,
        contentType: input.contentType,
        topic: input.topic,
        business,
      });

      // Score the generated content
      const recentTitles = await getRecentTitles(business.id);
      const qualityScore = await scoreContent(
        generated.content,
        generated.title,
        input.platform,
        business.toneOfVoice || "",
        business.targetAudience || "",
        recentTitles
      );

      // Save to content queue with quality score
      await db.createContentItem({
        businessId: business.id,
        platform: input.platform,
        contentType: input.contentType,
        title: generated.title,
        content: generated.content,
        scheduledFor: new Date(Date.now() + 3600000),
        engagementData: { qualityScore },
      });

      // Log activity
      await db.logActivity({
        businessId: business.id,
        action: `AI generated ${input.contentType} for ${input.platform} (score: ${qualityScore.overall}/10)`,
        platform: input.platform,
        description: generated.title,
      });

      await incrementUsage(business.id, 'aiGenerations');
      await incrementUsage(business.id, 'postsGenerated');
      return { ...generated, qualityScore };
    }),
    // Score existing content
    score: protectedProcedure.input(z.object({
      content: z.string(),
      title: z.string(),
      platform: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const business = await db.getBusinessByUserId(ctx.user.id);
      if (!business) throw new TRPCError({ code: 'NOT_FOUND' });
      const recentTitles = await getRecentTitles(business.id);
      return scoreContent(input.content, input.title, input.platform, business.toneOfVoice || "", business.targetAudience || "", recentTitles);
    }),
    // Publishing worker
    processQueue: protectedProcedure.mutation(async ({ ctx }) => {
      const business = await db.getBusinessByUserId(ctx.user.id);
      if (!business) throw new TRPCError({ code: 'NOT_FOUND' });
      return runPublishingWorker(business.id);
    }),
    runWorkerAll: adminProcedure.mutation(async () => {
      return runPublishingWorker();
    }),
  }),

  // AI Visibility Score
  visibility: router({
    check: protectedProcedure.mutation(async ({ ctx }) => {
      const business = await db.getBusinessByUserId(ctx.user.id);
      if (!business) throw new TRPCError({ code: 'NOT_FOUND' });
      const keywords = (business.topicClusters as string[]) || [];
      const result = await checkAIVisibility(
        business.name,
        business.industry || "general",
        keywords,
        business.websiteUrl || undefined
      );
      // Store the score in analytics
      await db.logAnalytic({
        businessId: business.id,
        platform: "ai_visibility",
        metricType: "visibility_score",
        metricValue: result.overallScore,
        metadata: result,
      });
      return result;
    }),
    latest: protectedProcedure.query(async ({ ctx }) => {
      const business = await db.getBusinessByUserId(ctx.user.id);
      if (!business) return null;
      return db.getLatestVisibilityScore(business.id);
    }),
  }),

  // Analytics
  analytics: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const business = await db.getBusinessByUserId(ctx.user.id);
      if (!business) return [];
      return db.getAnalytics(business.id);
    }),
    roi: protectedProcedure.query(async ({ ctx }) => {
      const business = await db.getBusinessByUserId(ctx.user.id);
      if (!business) return { published: 0, pending: 0, failed: 0, citationsDetected: 0, visibilityScore: 0 };
      return db.getROISummary(business.id);
    }),
  }),

  // Activity feed
  activity: router({
    feed: protectedProcedure.query(async ({ ctx }) => {
      const business = await db.getBusinessByUserId(ctx.user.id);
      if (!business) return [];
      return db.getActivityFeed(business.id);
    }),
  }),

  // Usage tracking
  usage: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const business = await db.getBusinessByUserId(ctx.user.id);
      if (!business) return { postsPublished: 0, postsGenerated: 0, platformsConnected: 0, aiGenerations: 0 };
      return getOrCreateUsage(business.id);
    }),
    plan: protectedProcedure.query(({ ctx }) => {
      const limits = getPlanLimits(ctx.user.planTier);
      return { tier: ctx.user.planTier || 'free', limits };
    }),
  }),

  // Billing
  billing: router({
    invoices: protectedProcedure.query(async ({ ctx }) => {
      return db.getInvoices(ctx.user.id);
    }),
  }),

  // Team
  team: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const business = await db.getBusinessByUserId(ctx.user.id);
      if (!business) return [];
      return db.getTeamMembers(business.id);
    }),
  }),

  // Settings / API Keys
  apiKeys: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const business = await db.getBusinessByUserId(ctx.user.id);
      if (!business) return [];
      return db.getApiKeys(business.id);
    }),
    save: protectedProcedure.input(z.object({
      keyName: z.string(),
      keyValue: z.string(),
      provider: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const business = await db.getBusinessByUserId(ctx.user.id);
      if (!business) throw new TRPCError({ code: 'NOT_FOUND' });
      await db.saveApiKey({ ...input, businessId: business.id });
      return { success: true };
    }),
  }),

  // GDPR / Data Management
  gdpr: router({
    export: protectedProcedure.mutation(async ({ ctx }) => {
      const business = await db.getBusinessByUserId(ctx.user.id);
      const content = business ? await db.getContentQueue(business.id) : [];
      const analytics = business ? await db.getAnalytics(business.id) : [];
      const activity = business ? await db.getActivityFeed(business.id, 100) : [];
      const platforms = business ? await db.getConnectedAccounts(business.id) : [];
      return {
        user: { id: ctx.user.id, email: ctx.user.email, name: ctx.user.name, createdAt: ctx.user.createdAt },
        business,
        content,
        analytics,
        activity,
        platforms: platforms.map(p => ({ ...p, accessToken: "[REDACTED]", refreshToken: "[REDACTED]" })),
        exportedAt: new Date().toISOString(),
      };
    }),
    delete: protectedProcedure.mutation(async ({ ctx }) => {
      const business = await db.getBusinessByUserId(ctx.user.id);
      if (business) {
        await db.deleteAllBusinessData(business.id);
      }
      await db.deleteUser(ctx.user.id);
      return { success: true, message: "All data has been permanently deleted." };
    }),
  }),

  // Admin routes
  admin: router({
    users: adminProcedure.query(async () => {
      return db.getAllUsers();
    }),
    businesses: adminProcedure.query(async () => {
      return db.getAllBusinesses();
    }),
    stats: adminProcedure.query(async () => {
      const allUsers = await db.getAllUsers();
      const allBusinesses = await db.getAllBusinesses();
      return {
        totalUsers: allUsers.length,
        totalBusinesses: allBusinesses.length,
        activeSubscriptions: allUsers.filter(u => u.subscriptionStatus === 'active').length,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
