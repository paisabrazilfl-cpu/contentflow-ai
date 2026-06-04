import { z } from "zod";
import {
  getConnectedAccountsByUserId,
  getContentQueueByUserId,
  getCurrentMonth,
  getGeneratedContentByUserId,
  getUsageForMonth,
} from "../db";
import { getAnalyticsDateRange, getUserPlan, getUserTierSummary } from "../services/tierEnforcement";
import { getGenerationLimit, isUnlimited } from "../../shared/plans";
import type { PlanKey } from "../../shared/plans";
import { protectedProcedure, router } from "../_core/trpc";

export const analyticsRouter = router({
  // ─── Dashboard stats (tier-aware) ─────────────────────────────────────────
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const [tierSummary, connectedAccounts, queue, history, usage] = await Promise.all([
      getUserTierSummary(ctx.user.id),
      getConnectedAccountsByUserId(ctx.user.id),
      getContentQueueByUserId(ctx.user.id),
      getGeneratedContentByUserId(ctx.user.id, 5),
      getUsageForMonth(ctx.user.id, getCurrentMonth()),
    ]);

    const plan = tierSummary.plan as PlanKey;
    const generationsUsed = usage?.generationCount ?? 0;
    const generationLimit = isUnlimited(plan) ? null : getGenerationLimit(plan);

    const publishedCount = queue.filter((q) => q.status === "published").length;
    const pendingCount = queue.filter((q) => q.status === "pending").length;
    const failedCount = queue.filter((q) => q.status === "failed").length;

    return {
      plan,
      connectedPlatforms: connectedAccounts.length,
      generationsUsed,
      generationLimit,
      publishedCount,
      pendingCount,
      failedCount,
      recentContent: history,
      // Tier limits for dashboard display
      tierSummary,
    };
  }),

  // ─── Queue stats (filtered by tier analytics window) ──────────────────────
  getQueueStats: protectedProcedure.query(async ({ ctx }) => {
    const { from } = await getAnalyticsDateRange(ctx.user.id);
    const queue = await getContentQueueByUserId(ctx.user.id);

    // Filter to the tier's analytics window
    const filtered = queue.filter((item) => new Date(item.createdAt) >= from);

    const byPlatform: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const item of filtered) {
      byPlatform[item.platform] = (byPlatform[item.platform] ?? 0) + 1;
      byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
    }

    return { total: filtered.length, byPlatform, byStatus };
  }),

  // ─── Full tier summary (used by billing and settings pages) ───────────────
  getTierSummary: protectedProcedure.query(async ({ ctx }) => {
    return getUserTierSummary(ctx.user.id);
  }),

  // ─── Analytics metadata (tells frontend what the user can see) ────────────
  getAnalyticsMeta: protectedProcedure.query(async ({ ctx }) => {
    const { lookbackDays } = await getAnalyticsDateRange(ctx.user.id);
    const plan = await getUserPlan(ctx.user.id);
    return {
      lookbackDays: lookbackDays === Infinity ? null : lookbackDays,
      canExport: plan === "pro" || plan === "agency",
      isAllTime: lookbackDays === Infinity,
      plan,
    };
  }),
});
