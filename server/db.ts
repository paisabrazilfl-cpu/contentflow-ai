import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import postgres from "postgres";
import { InsertUser, users, businesses } from "../drizzle/schema";
import { ENV } from './_core/env';
import { memoryStore, Business as MemoryBusiness, ApiKey as MemoryApiKey, ContentItem as MemoryContentItem } from './memory-store';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && ENV.databaseUrl) {
    try {
      const client = postgres(ENV.databaseUrl);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  // Return early with void if DB not configured — used as no-op in credentials auth
  if (!ENV.databaseUrl) return;
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // For PostgreSQL, use INSERT ... ON CONFLICT
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get users: database not available");
    return [];
  }

  try {
    return await db.select().from(users);
  } catch (error) {
    console.error("[Database] Failed to get all users:", error);
    return [];
  }
}

export async function getAllBusinesses() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get businesses: database not available");
    return [];
  }

  try {
    return await db.select().from(businesses);
  } catch (error) {
    console.error("[Database] Failed to get all businesses:", error);
    return [];
  }
}

// TODO: add feature queries here as your schema grows.

export async function getBusinessByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    return memoryStore.getBusinessByUserId(userId);
  }

  try {
    // Use raw SQL since drizzle schema is MySQL but DB is PostgreSQL
    const pool = (db as any).$client || (db as any).session?.client;
    console.log("[DB] getBusinessByUserId: pool exists?", !!pool, "has unsafe?", pool?.unsafe ? "yes" : "no");
    if (pool && pool.unsafe) {
      const r = await pool.unsafe(`SELECT * FROM businesses WHERE "userId" = $1 ORDER BY id DESC LIMIT 1`, [userId]);
      console.log("[DB] raw query result:", JSON.stringify(r));
      if (r && r.length > 0) return r[0];
      return undefined;
    }
    const result = await db.select().from(businesses).where(eq(businesses.userId, userId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get business by userId:", error);
    return memoryStore.getBusinessByUserId(userId);
  }
}

export async function getConnectedAccounts(businessId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get connected accounts: database not available");
    return [];
  }

  try {
    // Import at runtime to avoid circular dependencies
    const { connectedAccounts } = await import("../drizzle/schema");
    return await db.select().from(connectedAccounts).where(eq(connectedAccounts.businessId, businessId));
  } catch (error) {
    console.error("[Database] Failed to get connected accounts:", error);
    return [];
  }
}

export async function getContentQueue(businessId: number, status?: string) {
  const db = await getDb();
  if (!db) {
    const items = memoryStore.getContentItems(businessId);
    if (status) return items.filter(i => i.status === status);
    return items;
  }

  try {
    const { contentQueue } = await import("../drizzle/schema");
    if (status) {
      return await db.select().from(contentQueue).where(eq(contentQueue.businessId, businessId));
    }
    return await db.select().from(contentQueue).where(eq(contentQueue.businessId, businessId));
  } catch (error) {
    console.error("[Database] Failed to get content queue:", error);
    return [];
  }
}

export async function getAnalytics(businessId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get analytics: database not available");
    return [];
  }

  try {
    const { analyticsLogs } = await import("../drizzle/schema");
    return await db.select().from(analyticsLogs).where(eq(analyticsLogs.businessId, businessId));
  } catch (error) {
    console.error("[Database] Failed to get analytics:", error);
    return [];
  }
}

export async function getActivityFeed(businessId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get activity feed: database not available");
    return [];
  }

  try {
    const { activityFeed } = await import("../drizzle/schema");
    return await db.select().from(activityFeed).where(eq(activityFeed.businessId, businessId)).limit(limit);
  } catch (error) {
    console.error("[Database] Failed to get activity feed:", error);
    return [];
  }
}

export async function deleteAllBusinessData(businessId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete business data: database not available");
    return;
  }

  try {
    const { contentQueue, connectedAccounts, analyticsLogs, activityFeed } = await import("../drizzle/schema");
    
    // Delete in order of dependencies
    await db.delete(contentQueue).where(eq(contentQueue.businessId, businessId));
    await db.delete(connectedAccounts).where(eq(connectedAccounts.businessId, businessId));
    await db.delete(analyticsLogs).where(eq(analyticsLogs.businessId, businessId));
    await db.delete(activityFeed).where(eq(activityFeed.businessId, businessId));
    await db.delete(businesses).where(eq(businesses.id, businessId));
  } catch (error) {
    console.error("[Database] Failed to delete business data:", error);
    throw error;
  }
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete user: database not available");
    return;
  }

  try {
    // First delete all business data for this user
    const userBusinesses = await db.select().from(businesses).where(eq(businesses.userId, userId));
    for (const business of userBusinesses) {
      await deleteAllBusinessData(business.id);
    }
    
    // Then delete the user
    await db.delete(users).where(eq(users.id, userId));
  } catch (error) {
    console.error("[Database] Failed to delete user:", error);
    throw error;
  }
}

export async function getInvoices(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get invoices: database not available");
    return [];
  }

  try {
    const { invoices } = await import("../drizzle/schema");
    return await db.select().from(invoices).where(eq(invoices.userId, userId));
  } catch (error) {
    console.error("[Database] Failed to get invoices:", error);
    return [];
  }
}

export async function getTeamMembers(businessId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get team members: database not available");
    return [];
  }

  try {
    const { teamMembers } = await import("../drizzle/schema");
    return await db.select().from(teamMembers).where(eq(teamMembers.businessId, businessId));
  } catch (error) {
    console.error("[Database] Failed to get team members:", error);
    return [];
  }
}

export async function getApiKeys(businessId: number) {
  const db = await getDb();
  if (!db) {
    return memoryStore.getApiKeys(businessId);
  }

  try {
    const { apiKeys } = await import("../drizzle/schema");
    return await db.select().from(apiKeys).where(eq(apiKeys.businessId, businessId));
  } catch (error) {
    console.error("[Database] Failed to get API keys:", error);
    return [];
  }
}

export async function saveApiKey(data: { businessId: number; keyName: string; keyValue: string; provider: string }) {
  const db = await getDb();
  if (!db) {
    return memoryStore.addApiKey(data);
  }

  try {
    const { apiKeys } = await import("../drizzle/schema");
    const result = await db.insert(apiKeys).values({
      businessId: data.businessId,
      keyName: data.keyName,
      keyValue: data.keyValue,
      provider: data.provider,
      createdAt: new Date(),
    });
    return result;
  } catch (error) {
    console.error("[Database] Failed to save API key:", error);
    throw error;
  }
}

export async function logAnalytic(data: {
  businessId: number;
  platform: string;
  metricType: string;
  metricValue: number;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot log analytic: database not available");
    return;
  }

  try {
    const { analyticsLogs } = await import("../drizzle/schema");
    await db.insert(analyticsLogs).values({
      businessId: data.businessId,
      platform: data.platform,
      metricType: data.metricType,
      metricValue: data.metricValue,
      metadata: data.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("[Database] Failed to log analytic:", error);
  }
}

export async function getLatestVisibilityScore(businessId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get visibility score: database not available");
    return null;
  }

  try {
    const { analyticsLogs } = await import("../drizzle/schema");
    const result = await db
      .select()
      .from(analyticsLogs)
      .where(
        eq(analyticsLogs.businessId, businessId)
      )
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get latest visibility score:", error);
    return null;
  }
}

export async function getROISummary(businessId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get ROI summary: database not available");
    return { published: 0, pending: 0, failed: 0, citationsDetected: 0, visibilityScore: 0 };
  }

  try {
    const { contentQueue, analyticsLogs } = await import("../drizzle/schema");
    
    const contentItems = await db.select().from(contentQueue).where(eq(contentQueue.businessId, businessId));
    const published = contentItems.filter(c => c.status === "published").length;
    const pending = contentItems.filter(c => c.status === "pending").length;
    const failed = contentItems.filter(c => c.status === "failed").length;
    
    const analytics = await db.select().from(analyticsLogs).where(eq(analyticsLogs.businessId, businessId));
    const visibilityScore = analytics.length > 0 ? analytics[0].metricValue || 0 : 0;
    const citationsDetected = analytics.filter(a => a.metricType === "citation").length;
    
    return { published, pending, failed, citationsDetected, visibilityScore };
  } catch (error) {
    console.error("[Database] Failed to get ROI summary:", error);
    return { published: 0, pending: 0, failed: 0, citationsDetected: 0, visibilityScore: 0 };
  }
}

export async function updateContentStatus(contentId: number, status: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update content status: database not available");
    return;
  }

  try {
    const { contentQueue } = await import("../drizzle/schema");
    await db.update(contentQueue).set({ status, updatedAt: new Date() }).where(eq(contentQueue.id, contentId));
  } catch (error) {
    console.error("[Database] Failed to update content status:", error);
    throw error;
  }
}

export async function createContentItem(data: {
  businessId: number;
  platform: string;
  contentType: string;
  title: string;
  content: string;
  scheduledFor: Date;
  engagementData?: any;
}) {
  const db = await getDb();
  if (!db) {
    return memoryStore.addContentItem({
      businessId: data.businessId,
      platform: data.platform,
      contentType: data.contentType,
      title: data.title,
      content: data.content,
      status: "pending",
      scheduledFor: data.scheduledFor,
      engagementData: data.engagementData,
    });
  }

  try {
    const { contentQueue } = await import("../drizzle/schema");
    const result = await db.insert(contentQueue).values({
      businessId: data.businessId,
      platform: data.platform,
      contentType: data.contentType,
      title: data.title,
      content: data.content,
      scheduledFor: data.scheduledFor,
      status: "pending",
      engagementData: data.engagementData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return result;
  } catch (error) {
    console.error("[Database] Failed to create content item:", error);
    throw error;
  }
}

export async function logActivity(data: {
  businessId: number;
  action: string;
  platform: string;
  description: string;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot log activity: database not available");
    return;
  }

  try {
    const { activityFeed } = await import("../drizzle/schema");
    await db.insert(activityFeed).values({
      businessId: data.businessId,
      action: data.action,
      platform: data.platform,
      description: data.description,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("[Database] Failed to log activity:", error);
  }
}

export async function addConnectedAccount(data: {
  businessId: number;
  platform: string;
  platformAccountId: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes?: string;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add connected account: database not available");
    return;
  }

  try {
    const { connectedAccounts } = await import("../drizzle/schema");
    const result = await db.insert(connectedAccounts).values({
      businessId: data.businessId,
      platform: data.platform,
      platformAccountId: data.platformAccountId,
      accountName: data.accountName,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
      scopes: data.scopes,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return result;
  } catch (error) {
    console.error("[Database] Failed to add connected account:", error);
    throw error;
  }
}

export async function updateBusiness(businessId: number, data: Partial<any>) {
  const db = await getDb();
  if (!db) {
    memoryStore.updateBusiness(businessId, data);
    return;
  }

  try {
    const updateData: Record<string, any> = { ...data, updatedAt: new Date() };
    await db.update(businesses).set(updateData).where(eq(businesses.id, businessId));
  } catch (error) {
    console.error("[Database] Failed to update business:", error);
    throw error;
  }
}

export async function removeConnectedAccount(accountId: number, businessId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot remove connected account: database not available");
    return;
  }

  try {
    const { connectedAccounts } = await import("../drizzle/schema");
    await db.delete(connectedAccounts).where(
      eq(connectedAccounts.id, accountId)
    );
  } catch (error) {
    console.error("[Database] Failed to remove connected account:", error);
    throw error;
  }
}

export async function getContentQueueWithStatus(businessId: number, status?: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get content queue: database not available");
    return [];
  }

  try {
    const { contentQueue } = await import("../drizzle/schema");
    if (status) {
      return await db.select().from(contentQueue).where(
        eq(contentQueue.businessId, businessId)
      );
    }
    return await db.select().from(contentQueue).where(eq(contentQueue.businessId, businessId));
  } catch (error) {
    console.error("[Database] Failed to get content queue:", error);
    return [];
  }
}

export async function createBusiness(data: {
  userId: number;
  name: string;
  industry?: string;
  targetAudience?: string;
  toneOfVoice?: string;
  websiteUrl?: string;
  description?: string;
  timezone?: string;
  topicClusters?: any;
  contentTypes?: any;
  postingSchedule?: any;
  autoApprove?: boolean;
}) {
  const db = await getDb();
  if (!db) {
    return memoryStore.createBusiness({
      userId: data.userId,
      name: data.name,
      industry: data.industry,
      targetAudience: data.targetAudience,
      toneOfVoice: data.toneOfVoice,
      websiteUrl: data.websiteUrl,
      description: data.description,
      timezone: data.timezone || "UTC",
      topicClusters: data.topicClusters,
      contentTypes: data.contentTypes,
      postingSchedule: data.postingSchedule,
      autoApprove: data.autoApprove || false,
    });
  }

  try {
    const result = await db.insert(businesses).values({
      userId: data.userId,
      name: data.name,
      industry: data.industry,
      targetAudience: data.targetAudience,
      toneOfVoice: data.toneOfVoice,
      websiteUrl: data.websiteUrl,
      description: data.description,
      timezone: data.timezone || "UTC",
      topicClusters: data.topicClusters,
      contentTypes: data.contentTypes,
      postingSchedule: data.postingSchedule,
      autoApprove: data.autoApprove || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return result;
  } catch (error) {
    console.error("[Database] Failed to create business:", error);
    throw error;
  }
}
