/**
 * Tier enforcement helpers — called at the start of every gated procedure.
 * All checks throw TRPCError with code TOO_MANY_REQUESTS or FORBIDDEN
 * so the frontend receives a typed, actionable error message.
 */
import { TRPCError } from "@trpc/server";
import {
  getConnectedAccountsByUserId,
  getContentQueueByUserId,
  getCurrentMonth,
  getSubscriptionByUserId,
  getUsageForMonth,
} from "../db";
import {
  PlanKey,
  formatLimit,
  getAnalyticsLookbackDays,
  getGenerationLimit,
  getPlatformConnectionLimit,
  getScheduledPostLimit,
  getTeamMemberLimit,
  hasApiAccess,
  isUnlimited,
  overLimitMessage,
} from "../../shared/plans";

// ─── Resolve a user's current plan ───────────────────────────────────────────
export async function getUserPlan(userId: number): Promise<PlanKey> {
  const sub = await getSubscriptionByUserId(userId);
  if (!sub || sub.status === "canceled" || sub.status === "incomplete_expired") return "free";
  // past_due still has access until Stripe cancels
  return (sub.plan ?? "free") as PlanKey;
}

// ─── AI generation limit ──────────────────────────────────────────────────────
export async function enforceGenerationLimit(userId: number, userEmail?: string | null, userName?: string | null): Promise<void> {
  const plan = await getUserPlan(userId);
  if (isUnlimited(plan)) return;

  const limit = getGenerationLimit(plan);
  const month = getCurrentMonth();
  const usage = await getUsageForMonth(userId, month);
  const used = usage?.generationCount ?? 0;

  if (used >= limit) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: overLimitMessage("AI generations", used, limit, plan),
    });
  }
}

// ─── Platform connection limit ────────────────────────────────────────────────
export async function enforcePlatformConnectionLimit(userId: number): Promise<void> {
  const plan = await getUserPlan(userId);
  const limit = getPlatformConnectionLimit(plan);
  if (limit === Infinity) return;

  const existing = await getConnectedAccountsByUserId(userId);
  const used = existing.length;

  if (used >= limit) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: overLimitMessage("platform connections", used, limit, plan),
    });
  }
}

// ─── Scheduled post limit (per calendar month) ───────────────────────────────
export async function enforceScheduledPostLimit(userId: number): Promise<void> {
  const plan = await getUserPlan(userId);
  const limit = getScheduledPostLimit(plan);
  if (limit === Infinity) return;

  // Count posts scheduled in the current calendar month
  const allQueue = await getContentQueueByUserId(userId);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const thisMonthCount = allQueue.filter((item) => {
    const scheduled = new Date(item.scheduledAt);
    return scheduled >= monthStart && scheduled <= monthEnd && item.status !== "cancelled";
  }).length;

  if (thisMonthCount >= limit) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: overLimitMessage("scheduled posts this month", thisMonthCount, limit, plan),
    });
  }
}

// ─── Team member limit ────────────────────────────────────────────────────────
export async function enforceTeamMemberLimit(userId: number, currentMemberCount: number): Promise<void> {
  const plan = await getUserPlan(userId);
  const limit = getTeamMemberLimit(plan);
  if (limit === Infinity) return;

  if (currentMemberCount >= limit) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: overLimitMessage("team members", currentMemberCount, limit, plan),
    });
  }
}

// ─── API access gate ──────────────────────────────────────────────────────────
export async function enforceApiAccess(userId: number): Promise<void> {
  const plan = await getUserPlan(userId);
  if (!hasApiAccess(plan)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `API access is not available on the ${plan} plan. Upgrade to Agency to enable API access.`,
    });
  }
}

// ─── Analytics date range gate ────────────────────────────────────────────────
export async function getAnalyticsDateRange(userId: number): Promise<{ from: Date; lookbackDays: number }> {
  const plan = await getUserPlan(userId);
  const lookbackDays = getAnalyticsLookbackDays(plan);

  const from =
    lookbackDays === Infinity
      ? new Date(0) // epoch = all time
      : new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

  return { from, lookbackDays };
}

// ─── Get full tier summary for a user (used by frontend) ─────────────────────
export async function getUserTierSummary(userId: number) {
  const plan = await getUserPlan(userId);
  const month = getCurrentMonth();
  const [usage, connections, queue] = await Promise.all([
    getUsageForMonth(userId, month),
    getConnectedAccountsByUserId(userId),
    getContentQueueByUserId(userId),
  ]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const scheduledThisMonth = queue.filter((item) => {
    const scheduled = new Date(item.scheduledAt);
    return scheduled >= monthStart && scheduled <= monthEnd && item.status !== "cancelled";
  }).length;

  const generationLimit = getGenerationLimit(plan);
  const platformLimit = getPlatformConnectionLimit(plan);
  const scheduleLimit = getScheduledPostLimit(plan);
  const teamLimit = getTeamMemberLimit(plan);
  const lookbackDays = getAnalyticsLookbackDays(plan);

  return {
    plan,
    generations: {
      used: usage?.generationCount ?? 0,
      limit: generationLimit === Infinity ? null : generationLimit,
      unlimited: isUnlimited(plan),
    },
    platformConnections: {
      used: connections.length,
      limit: platformLimit === Infinity ? null : platformLimit,
      unlimited: platformLimit === Infinity,
    },
    scheduledPosts: {
      used: scheduledThisMonth,
      limit: scheduleLimit === Infinity ? null : scheduleLimit,
      unlimited: scheduleLimit === Infinity,
    },
    teamMembers: {
      limit: teamLimit === Infinity ? null : teamLimit,
      unlimited: teamLimit === Infinity,
    },
    apiAccess: hasApiAccess(plan),
    analyticsLookbackDays: lookbackDays === Infinity ? null : lookbackDays,
    analyticsExport: plan === "pro" || plan === "agency",
    whiteLabelEnabled: plan === "agency",
  };
}
