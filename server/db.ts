import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  BrandVoice,
  ConnectedAccount,
  ContentQueueItem,
  GeneratedContent,
  InsertBrandVoice,
  InsertConnectedAccount,
  InsertContentQueueItem,
  InsertGeneratedContent,
  InsertSubscription,
  InsertUser,
  InsertUsageTracking,
  Subscription,
  UsageTracking,
  brandVoice,
  connectedAccounts,
  contentQueue,
  generatedContent,
  subscriptions,
  usageTracking,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

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

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0] ?? undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? undefined;
}

// ─── Subscriptions ────────────────────────────────────────────────────────────
export async function getSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result[0] ?? undefined;
}

export async function getSubscriptionByStripeCustomerId(customerId: string): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions).where(eq(subscriptions.stripeCustomerId, customerId)).limit(1);
  return result[0] ?? undefined;
}

export async function getSubscriptionByStripeSubId(subId: string): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, subId)).limit(1);
  return result[0] ?? undefined;
}

export async function upsertSubscription(data: InsertSubscription): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(subscriptions).values(data).onDuplicateKeyUpdate({ set: data });
}

export async function updateSubscriptionByStripeSubId(
  stripeSubscriptionId: string,
  data: Partial<InsertSubscription>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(subscriptions).set(data).where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
}

export async function updateSubscriptionByUserId(userId: number, data: Partial<InsertSubscription>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(subscriptions).set(data).where(eq(subscriptions.userId, userId));
}

// ─── Connected Accounts ───────────────────────────────────────────────────────
export async function getConnectedAccountsByUserId(userId: number): Promise<ConnectedAccount[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(connectedAccounts).where(eq(connectedAccounts.userId, userId));
}

export async function getConnectedAccount(
  userId: number,
  platform: ConnectedAccount["platform"]
): Promise<ConnectedAccount | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(connectedAccounts)
    .where(and(eq(connectedAccounts.userId, userId), eq(connectedAccounts.platform, platform)))
    .limit(1);
  return result[0] ?? undefined;
}

export async function upsertConnectedAccount(data: InsertConnectedAccount): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(connectedAccounts).values(data).onDuplicateKeyUpdate({ set: data });
}

export async function deleteConnectedAccount(userId: number, platform: ConnectedAccount["platform"]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(connectedAccounts)
    .where(and(eq(connectedAccounts.userId, userId), eq(connectedAccounts.platform, platform)));
}

export async function updateConnectedAccountTokens(
  id: number,
  accessToken: string,
  refreshToken: string | null,
  tokenExpiresAt: Date | null
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(connectedAccounts).set({ accessToken, refreshToken, tokenExpiresAt }).where(eq(connectedAccounts.id, id));
}

// ─── Content Queue ────────────────────────────────────────────────────────────
export async function getContentQueueByUserId(userId: number): Promise<ContentQueueItem[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contentQueue).where(eq(contentQueue.userId, userId)).orderBy(contentQueue.scheduledAt);
}

export async function getPendingQueueItems(): Promise<ContentQueueItem[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contentQueue)
    .where(and(eq(contentQueue.status, "pending"), sql`${contentQueue.scheduledAt} <= NOW()`));
}

export async function insertContentQueueItem(data: InsertContentQueueItem): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(contentQueue).values(data);
}

export async function updateContentQueueItemStatus(
  id: number,
  status: ContentQueueItem["status"],
  errorMessage?: string,
  publishedAt?: Date
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(contentQueue)
    .set({ status, errorMessage: errorMessage ?? null, publishedAt: publishedAt ?? null })
    .where(eq(contentQueue.id, id));
}

export async function deleteContentQueueItem(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(contentQueue).where(and(eq(contentQueue.id, id), eq(contentQueue.userId, userId)));
}

// ─── Usage Tracking ───────────────────────────────────────────────────────────
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function getUsageForMonth(userId: number, month: string): Promise<UsageTracking | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(usageTracking)
    .where(and(eq(usageTracking.userId, userId), eq(usageTracking.month, month)))
    .limit(1);
  return result[0] ?? undefined;
}

export async function incrementGenerationCount(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const month = getCurrentMonth();
  await db
    .insert(usageTracking)
    .values({ userId, month, generationCount: 1, publishCount: 0 })
    .onDuplicateKeyUpdate({ set: { generationCount: sql`${usageTracking.generationCount} + 1` } });
}

export async function incrementPublishCount(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const month = getCurrentMonth();
  await db
    .insert(usageTracking)
    .values({ userId, month, generationCount: 0, publishCount: 1 })
    .onDuplicateKeyUpdate({ set: { publishCount: sql`${usageTracking.publishCount} + 1` } });
}

// ─── Brand Voice ──────────────────────────────────────────────────────────────
export async function getBrandVoice(userId: number): Promise<BrandVoice | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(brandVoice).where(eq(brandVoice.userId, userId)).limit(1);
  return result[0] ?? undefined;
}

export async function upsertBrandVoice(data: InsertBrandVoice): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(brandVoice).values(data).onDuplicateKeyUpdate({ set: data });
}

// ─── Generated Content ────────────────────────────────────────────────────────
export async function insertGeneratedContent(data: InsertGeneratedContent): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(generatedContent).values(data);
}

export async function getGeneratedContentByUserId(userId: number, limit = 20): Promise<GeneratedContent[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(generatedContent)
    .where(eq(generatedContent.userId, userId))
    .orderBy(sql`${generatedContent.createdAt} DESC`)
    .limit(limit);
}
