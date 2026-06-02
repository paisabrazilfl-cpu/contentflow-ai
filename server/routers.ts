import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { generateContent } from "./ai-content";
import { runPublishingWorker } from "./publishing-worker";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
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
    })).mutation(async ({ ctx, input }) => {
      await db.createBusiness({ ...input, userId: ctx.user.id, name: input.name });
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
      await db.createContentItem({
        businessId: business.id,
        platform: input.platform,
        contentType: input.contentType || 'social',
        title: input.title,
        content: input.content,
        scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : new Date(),
      });
      return { success: true };
    }),
    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.string(),
    })).mutation(async ({ ctx, input }) => {
      await db.updateContentStatus(input.id, input.status);
      return { success: true };
    }),
    // AI Content Generation
    generate: protectedProcedure.input(z.object({
      platform: z.string(),
      contentType: z.string().default("social"),
      topic: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const business = await db.getBusinessByUserId(ctx.user.id);
      if (!business) throw new TRPCError({ code: 'NOT_FOUND', message: 'Business not found. Complete onboarding first.' });
      const generated = await generateContent({
        platform: input.platform,
        contentType: input.contentType,
        topic: input.topic,
        business,
      });
      // Save to content queue
      await db.createContentItem({
        businessId: business.id,
        platform: input.platform,
        contentType: input.contentType,
        title: generated.title,
        content: generated.content,
        scheduledFor: new Date(Date.now() + 3600000), // 1 hour from now
      });
      // Log activity
      await db.logActivity({
        businessId: business.id,
        action: `AI generated ${input.contentType} for ${input.platform}`,
        platform: input.platform,
        description: generated.title,
      });
      return generated;
    }),
    // Publishing worker - processes queued content via the automated publishing engine
    processQueue: protectedProcedure.mutation(async ({ ctx }) => {
      const business = await db.getBusinessByUserId(ctx.user.id);
      if (!business) throw new TRPCError({ code: 'NOT_FOUND' });
      return runPublishingWorker(business.id);
    }),
    // Admin: run worker across all businesses
    runWorkerAll: adminProcedure.mutation(async () => {
      return runPublishingWorker();
    }),
  }),

  // Analytics
  analytics: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const business = await db.getBusinessByUserId(ctx.user.id);
      if (!business) return [];
      return db.getAnalytics(business.id);
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
