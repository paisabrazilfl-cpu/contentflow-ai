import { z } from "zod";
import {
  getConnectedAccountsByUserId,
  getContentQueueByUserId,
  getCurrentMonth,
  getGeneratedContentByUserId,
  getSubscriptionByUserId,
  getUsageForMonth,
} from "../db";
import { getGenerationLimit, isUnlimited } from "../../shared/plans";
import type { PlanKey } from "../../shared/plans";
import { protectedProcedure, router } from "../_core/trpc";

export const analyticsRouter = router({
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const [sub, connectedAccounts, queue, history, usage] = await Promise.all([
      getSubscriptionByUserId(ctx.user.id),
      getConnectedAccountsByUserId(ctx.user.id),
      getContentQueueByUserId(ctx.user.id),
      getGeneratedContentByUserId(ctx.user.id, 5),
      getUsageForMonth(ctx.user.id, getCurrentMonth()),
    ]);

    const plan = (sub?.plan ?? "free") as PlanKey;
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
    };
  }),

  getQueueStats: protectedProcedure.query(async ({ ctx }) => {
    const queue = await getContentQueueByUserId(ctx.user.id);
    const byPlatform: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const item of queue) {
      byPlatform[item.platform] = (byPlatform[item.platform] ?? 0) + 1;
      byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
    }

    return { total: queue.length, byPlatform, byStatus };
  }),
});
