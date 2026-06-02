import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, businesses, connectedAccounts, contentQueue,
  analyticsLogs, invoices, teamMembers, apiKeys, activityFeed,
  type Business, type InsertBusiness, type ConnectedAccount, type InsertConnectedAccount,
  type ContentItem, type InsertContentItem, type InsertAnalyticsLog,
  type InsertInvoice, type InsertTeamMember, type InsertApiKey, type InsertActivityItem
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
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
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Business queries
export async function getBusinessByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(businesses).where(eq(businesses.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createBusiness(data: InsertBusiness) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(businesses).values(data);
  return result;
}

export async function updateBusiness(id: number, data: Partial<InsertBusiness>) {
  const db = await getDb();
  if (!db) return;
  await db.update(businesses).set(data).where(eq(businesses.id, id));
}

// Connected accounts
export async function getConnectedAccounts(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(connectedAccounts).where(eq(connectedAccounts.businessId, businessId));
}

export async function addConnectedAccount(data: InsertConnectedAccount) {
  const db = await getDb();
  if (!db) return;
  await db.insert(connectedAccounts).values(data);
}

export async function removeConnectedAccount(id: number, businessId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(connectedAccounts).where(and(eq(connectedAccounts.id, id), eq(connectedAccounts.businessId, businessId)));
}

// Content queue
export async function getContentQueue(businessId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(contentQueue.businessId, businessId)];
  if (status) conditions.push(eq(contentQueue.status, status));
  return db.select().from(contentQueue).where(and(...conditions)).orderBy(desc(contentQueue.scheduledFor));
}

export async function createContentItem(data: InsertContentItem) {
  const db = await getDb();
  if (!db) return;
  await db.insert(contentQueue).values(data);
}

export async function updateContentStatus(id: number, status: string, errorLog?: string) {
  const db = await getDb();
  if (!db) return;
  const updateData: any = { status };
  if (errorLog) updateData.errorLog = errorLog;
  if (status === "published") updateData.publishedAt = new Date();
  await db.update(contentQueue).set(updateData).where(eq(contentQueue.id, id));
}

// Analytics
export async function getAnalytics(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(analyticsLogs).where(eq(analyticsLogs.businessId, businessId)).orderBy(desc(analyticsLogs.recordedAt));
}

export async function logAnalytic(data: InsertAnalyticsLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(analyticsLogs).values(data);
}

// Activity feed
export async function getActivityFeed(businessId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityFeed).where(eq(activityFeed.businessId, businessId)).orderBy(desc(activityFeed.createdAt)).limit(limit);
}

export async function logActivity(data: InsertActivityItem) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityFeed).values(data);
}

// Invoices
export async function getInvoices(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));
}

// Team members
export async function getTeamMembers(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teamMembers).where(eq(teamMembers.businessId, businessId));
}

// API keys
export async function getApiKeys(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(apiKeys).where(eq(apiKeys.businessId, businessId));
}

export async function saveApiKey(data: InsertApiKey) {
  const db = await getDb();
  if (!db) return;
  await db.insert(apiKeys).values(data);
}

// Admin queries
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getAllBusinesses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(businesses).orderBy(desc(businesses.createdAt));
}
