/**
 * Tier definitions — single source of truth for ALL plan limits.
 * Used by both server-side enforcement and frontend display.
 */

export const PLANS = {
  free: {
    name: "Free Trial",
    price: 0,
    generationsPerMonth: 5,
    platformConnections: 1,
    scheduledPostsPerMonth: 5,
    teamMembers: 1,           // solo only
    apiAccess: false,
    analyticsLookbackDays: 3, // 3-day window
    analyticsExport: false,
    whiteLabelEnabled: false,
  },
  starter: {
    name: "Starter",
    price: 97,
    generationsPerMonth: 50,
    platformConnections: 3,
    scheduledPostsPerMonth: 30,
    teamMembers: 1,           // solo only
    apiAccess: false,
    analyticsLookbackDays: 7,
    analyticsExport: false,
    whiteLabelEnabled: false,
  },
  pro: {
    name: "Pro",
    price: 197,
    generationsPerMonth: 200,
    platformConnections: 6,
    scheduledPostsPerMonth: 150,
    teamMembers: 3,
    apiAccess: false,
    analyticsLookbackDays: 90,
    analyticsExport: true,
    whiteLabelEnabled: false,
  },
  agency: {
    name: "Agency",
    price: 497,
    generationsPerMonth: Infinity,
    platformConnections: Infinity,
    scheduledPostsPerMonth: Infinity,
    teamMembers: Infinity,
    apiAccess: true,
    analyticsLookbackDays: Infinity, // all time
    analyticsExport: true,
    whiteLabelEnabled: true,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
export type PlanConfig = typeof PLANS[PlanKey];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getPlan(plan: PlanKey): PlanConfig {
  return PLANS[plan];
}

export function getGenerationLimit(plan: PlanKey): number {
  return PLANS[plan].generationsPerMonth;
}

export function isUnlimited(plan: PlanKey): boolean {
  return PLANS[plan].generationsPerMonth === Infinity;
}

export function getPlatformConnectionLimit(plan: PlanKey): number {
  return PLANS[plan].platformConnections;
}

export function getScheduledPostLimit(plan: PlanKey): number {
  return PLANS[plan].scheduledPostsPerMonth;
}

export function getTeamMemberLimit(plan: PlanKey): number {
  return PLANS[plan].teamMembers;
}

export function hasApiAccess(plan: PlanKey): boolean {
  return PLANS[plan].apiAccess;
}

export function getAnalyticsLookbackDays(plan: PlanKey): number {
  return PLANS[plan].analyticsLookbackDays;
}

export function canExportAnalytics(plan: PlanKey): boolean {
  return PLANS[plan].analyticsExport;
}

export function isWhiteLabel(plan: PlanKey): boolean {
  return PLANS[plan].whiteLabelEnabled;
}

/** Returns a human-readable limit string, e.g. "50" or "Unlimited" */
export function formatLimit(value: number): string {
  return value === Infinity ? "Unlimited" : String(value);
}

/** Build a standard over-limit error message */
export function overLimitMessage(
  feature: string,
  used: number,
  limit: number,
  plan: PlanKey
): string {
  const limitStr = limit === Infinity ? "unlimited" : String(limit);
  return `You've reached the ${feature} limit (${used}/${limitStr}) on the ${PLANS[plan].name} plan. Upgrade your subscription to continue.`;
}
