/**
 * Plan Limits & Enforcement
 * 
 * Defines plan tiers and their limits, provides enforcement functions
 * that check usage before allowing actions.
 */

import { getDb } from "./db";
import { usageTracking, connectedAccounts, teamMembers } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { Client } from "pg";

/**
 * Direct PG client for queries that need to bypass drizzle
 */
async function getPg(): Promise<Client | null> {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  const client = new Client({ connectionString: url, ssl: false });
  await client.connect();
  return client;
}

export type PlanTier = "free" | "starter" | "pro" | "enterprise";

export type PlanLimits = {
  name: string;
  price: number; // cents
  maxPlatforms: number;
  maxPostsPerMonth: number;
  maxTeamMembers: number;
  features: {
    advancedAnalytics: boolean;
    aiCitationTracking: boolean;
    videoGeneration: boolean;
    whiteLabel: boolean;
    apiAccess: boolean;
    customIntegrations: boolean;
    allContentTypes: boolean; // blog, social, video, schema
    basicContentOnly: boolean; // blog + social only
  };
};

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    name: "Free Trial",
    price: 0,
    maxPlatforms: 2,
    maxPostsPerMonth: 10,
    maxTeamMembers: 1,
    features: {
      advancedAnalytics: false,
      aiCitationTracking: false,
      videoGeneration: false,
      whiteLabel: false,
      apiAccess: false,
      customIntegrations: false,
      allContentTypes: false,
      basicContentOnly: true,
    },
  },
  starter: {
    name: "Starter",
    price: 9700,
    maxPlatforms: 3,
    maxPostsPerMonth: 30,
    maxTeamMembers: 1,
    features: {
      advancedAnalytics: false,
      aiCitationTracking: false,
      videoGeneration: false,
      whiteLabel: false,
      apiAccess: false,
      customIntegrations: false,
      allContentTypes: false,
      basicContentOnly: true,
    },
  },
  pro: {
    name: "Pro",
    price: 19700,
    maxPlatforms: 6,
    maxPostsPerMonth: -1, // unlimited
    maxTeamMembers: 5,
    features: {
      advancedAnalytics: true,
      aiCitationTracking: true,
      videoGeneration: true,
      whiteLabel: false,
      apiAccess: false,
      customIntegrations: false,
      allContentTypes: true,
      basicContentOnly: false,
    },
  },
  enterprise: {
    name: "Enterprise",
    price: 49700,
    maxPlatforms: -1, // unlimited
    maxPostsPerMonth: -1, // unlimited
    maxTeamMembers: -1, // unlimited
    features: {
      advancedAnalytics: true,
      aiCitationTracking: true,
      videoGeneration: true,
      whiteLabel: true,
      apiAccess: true,
      customIntegrations: true,
      allContentTypes: true,
      basicContentOnly: false,
    },
  },
};

export function getPlanLimits(planTier: string | null | undefined): PlanLimits {
  const tier = (planTier || "free") as PlanTier;
  return PLAN_LIMITS[tier] || PLAN_LIMITS.free;
}

/**
 * Get current month key in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Get or create usage record for current month
 */
export async function getOrCreateUsage(businessId: number): Promise<{
  postsPublished: number;
  postsGenerated: number;
  platformsConnected: number;
  aiGenerations: number;
}> {
  const pg = await getPg();
  if (!pg) return { postsPublished: 0, postsGenerated: 0, platformsConnected: 0, aiGenerations: 0 };

  const month = getCurrentMonth();
  try {
    const existing = await pg.query(`SELECT * FROM usage_tracking WHERE "businessId" = $1 AND "month" = $2 LIMIT 1`, [businessId, month]);
    if (existing.rows.length > 0) return existing.rows[0];

    await pg.query(`INSERT INTO usage_tracking ("businessId", "month", "postsPublished", "postsGenerated", "platformsConnected", "aiGenerations") VALUES ($1, $2, 0, 0, 0, 0)`, [businessId, month]);
    return { postsPublished: 0, postsGenerated: 0, platformsConnected: 0, aiGenerations: 0 };
  } finally {
    await pg.end();
  }
}

/**
 * Increment a usage counter
 */
export async function incrementUsage(businessId: number, field: "postsPublished" | "postsGenerated" | "aiGenerations"): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const month = getCurrentMonth();
  const existing = await db.select().from(usageTracking)
    .where(and(eq(usageTracking.businessId, businessId), eq(usageTracking.month, month)))
    .limit(1);

  if (existing.length > 0) {
    const current = existing[0][field] || 0;
    await db.update(usageTracking)
      .set({ [field]: current + 1 })
      .where(eq(usageTracking.id, existing[0].id));
  } else {
    await db.insert(usageTracking).values({
      businessId,
      month,
      [field]: 1,
    });
  }
}

/**
 * Enforcement: Check if user can connect another platform
 */
export async function canConnectPlatform(businessId: number, planTier: string | null | undefined): Promise<{ allowed: boolean; message?: string }> {
  const limits = getPlanLimits(planTier);
  if (limits.maxPlatforms === -1) return { allowed: true };

  const db = await getDb();
  if (!db) return { allowed: true };

  const connected = await db.select().from(connectedAccounts)
    .where(eq(connectedAccounts.businessId, businessId));

  if (connected.length >= limits.maxPlatforms) {
    return {
      allowed: false,
      message: `Your ${limits.name} plan allows ${limits.maxPlatforms} platform connections. Upgrade to connect more platforms.`,
    };
  }
  return { allowed: true };
}

/**
 * Enforcement: Check if user can publish more content this month
 */
export async function canPublishContent(businessId: number, planTier: string | null | undefined): Promise<{ allowed: boolean; message?: string; used?: number; limit?: number }> {
  const limits = getPlanLimits(planTier);
  if (limits.maxPostsPerMonth === -1) return { allowed: true };

  const usage = await getOrCreateUsage(businessId);

  if (usage.postsPublished >= limits.maxPostsPerMonth) {
    return {
      allowed: false,
      message: `You've reached your ${limits.name} plan limit of ${limits.maxPostsPerMonth} posts/month. Upgrade for more posts.`,
      used: usage.postsPublished,
      limit: limits.maxPostsPerMonth,
    };
  }
  return { allowed: true, used: usage.postsPublished, limit: limits.maxPostsPerMonth };
}

/**
 * Enforcement: Check if user can add a team member
 */
export async function canAddTeamMember(businessId: number, planTier: string | null | undefined): Promise<{ allowed: boolean; message?: string }> {
  const limits = getPlanLimits(planTier);
  if (limits.maxTeamMembers === -1) return { allowed: true };

  const db = await getDb();
  if (!db) return { allowed: true };

  const members = await db.select().from(teamMembers)
    .where(eq(teamMembers.businessId, businessId));

  if (members.length >= limits.maxTeamMembers) {
    return {
      allowed: false,
      message: `Your ${limits.name} plan allows ${limits.maxTeamMembers} team member(s). Upgrade for more.`,
    };
  }
  return { allowed: true };
}

/**
 * Enforcement: Check if a content type is allowed on the plan
 */
export function canUseContentType(contentType: string, planTier: string | null | undefined): { allowed: boolean; message?: string } {
  const limits = getPlanLimits(planTier);

  if (limits.features.allContentTypes) return { allowed: true };

  // Basic plans only allow blog and social
  if (limits.features.basicContentOnly) {
    if (contentType === "video" || contentType === "schema") {
      return {
        allowed: false,
        message: `${contentType === "video" ? "Video generation" : "Schema markup"} requires a Pro plan or higher. Upgrade to unlock.`,
      };
    }
  }
  return { allowed: true };
}

/**
 * Enforcement: Check if a feature is available on the plan
 */
export function canUseFeature(feature: keyof PlanLimits["features"], planTier: string | null | undefined): { allowed: boolean; message?: string } {
  const limits = getPlanLimits(planTier);
  const featureNames: Record<string, string> = {
    advancedAnalytics: "Advanced Analytics",
    aiCitationTracking: "AI Citation Tracking",
    videoGeneration: "Video Generation",
    whiteLabel: "White-Label Options",
    apiAccess: "API Access",
    customIntegrations: "Custom Integrations",
  };

  if (!limits.features[feature]) {
    const requiredPlan = feature === "whiteLabel" || feature === "apiAccess" || feature === "customIntegrations"
      ? "Enterprise" : "Pro";
    return {
      allowed: false,
      message: `${featureNames[feature] || feature} requires the ${requiredPlan} plan. Upgrade to unlock.`,
    };
  }
  return { allowed: true };
}
