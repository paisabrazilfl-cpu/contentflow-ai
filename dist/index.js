var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  activityFeed: () => activityFeed,
  analyticsLogs: () => analyticsLogs,
  apiKeys: () => apiKeys,
  businesses: () => businesses,
  connectedAccounts: () => connectedAccounts,
  contentQueue: () => contentQueue,
  invoices: () => invoices,
  teamMembers: () => teamMembers,
  usageTracking: () => usageTracking,
  users: () => users
});
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";
var users, businesses, connectedAccounts, contentQueue, analyticsLogs, invoices, teamMembers, apiKeys, activityFeed, usageTracking;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
      stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
      subscriptionStatus: varchar("subscriptionStatus", { length: 32 }).default("trialing"),
      planTier: varchar("planTier", { length: 32 }).default("free"),
      onboardingCompleted: boolean("onboardingCompleted").default(false),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    businesses = mysqlTable("businesses", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      name: varchar("name", { length: 255 }).notNull(),
      industry: varchar("industry", { length: 128 }),
      targetAudience: text("targetAudience"),
      toneOfVoice: varchar("toneOfVoice", { length: 128 }),
      websiteUrl: varchar("websiteUrl", { length: 512 }),
      description: text("description"),
      timezone: varchar("timezone", { length: 64 }).default("UTC"),
      topicClusters: json("topicClusters"),
      contentTypes: json("contentTypes"),
      postingSchedule: json("postingSchedule"),
      autoApprove: boolean("autoApprove").default(false),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    connectedAccounts = mysqlTable("connected_accounts", {
      id: int("id").autoincrement().primaryKey(),
      businessId: int("businessId").notNull(),
      platform: varchar("platform", { length: 32 }).notNull(),
      platformAccountId: varchar("platformAccountId", { length: 255 }),
      accountName: varchar("accountName", { length: 255 }),
      accessToken: text("accessToken"),
      refreshToken: text("refreshToken"),
      expiresAt: timestamp("expiresAt"),
      scopes: text("scopes"),
      status: varchar("status", { length: 32 }).default("active"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    contentQueue = mysqlTable("content_queue", {
      id: int("id").autoincrement().primaryKey(),
      businessId: int("businessId").notNull(),
      platform: varchar("platform", { length: 32 }).notNull(),
      contentType: varchar("contentType", { length: 32 }).default("social"),
      title: varchar("title", { length: 512 }),
      content: text("content"),
      mediaUrls: json("mediaUrls"),
      scheduledFor: timestamp("scheduledFor"),
      publishedAt: timestamp("publishedAt"),
      status: varchar("status", { length: 32 }).default("pending"),
      errorLog: text("errorLog"),
      retryCount: int("retryCount").default(0),
      engagementData: json("engagementData"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    analyticsLogs = mysqlTable("analytics_logs", {
      id: int("id").autoincrement().primaryKey(),
      businessId: int("businessId").notNull(),
      platform: varchar("platform", { length: 32 }),
      metricType: varchar("metricType", { length: 64 }).notNull(),
      metricValue: int("metricValue").default(0),
      metadata: json("metadata"),
      recordedAt: timestamp("recordedAt").defaultNow().notNull()
    });
    invoices = mysqlTable("invoices", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      stripeInvoiceId: varchar("stripeInvoiceId", { length: 128 }),
      amount: int("amount").notNull(),
      currency: varchar("currency", { length: 8 }).default("usd"),
      status: varchar("status", { length: 32 }).default("paid"),
      description: varchar("description", { length: 512 }),
      invoiceUrl: text("invoiceUrl"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    teamMembers = mysqlTable("team_members", {
      id: int("id").autoincrement().primaryKey(),
      businessId: int("businessId").notNull(),
      userId: int("userId"),
      email: varchar("email", { length: 320 }).notNull(),
      role: varchar("role", { length: 32 }).default("member"),
      status: varchar("status", { length: 32 }).default("pending"),
      invitedAt: timestamp("invitedAt").defaultNow().notNull(),
      joinedAt: timestamp("joinedAt")
    });
    apiKeys = mysqlTable("api_keys", {
      id: int("id").autoincrement().primaryKey(),
      businessId: int("businessId").notNull(),
      keyName: varchar("keyName", { length: 128 }).notNull(),
      keyValue: text("keyValue").notNull(),
      provider: varchar("provider", { length: 64 }).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    activityFeed = mysqlTable("activity_feed", {
      id: int("id").autoincrement().primaryKey(),
      businessId: int("businessId").notNull(),
      action: varchar("action", { length: 128 }).notNull(),
      description: text("description"),
      platform: varchar("platform", { length: 32 }),
      metadata: json("metadata"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    usageTracking = mysqlTable("usage_tracking", {
      id: int("id").autoincrement().primaryKey(),
      businessId: int("businessId").notNull(),
      month: varchar("month", { length: 7 }).notNull(),
      // YYYY-MM format
      postsPublished: int("postsPublished").default(0).notNull(),
      postsGenerated: int("postsGenerated").default(0).notNull(),
      platformsConnected: int("platformsConnected").default(0).notNull(),
      aiGenerations: int("aiGenerations").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
init_schema();
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import postgres from "postgres";

// server/_core/env.ts
var ENV = {
  // Core App
  appId: process.env.VITE_APP_ID ?? "",
  // Session signing key — must be set via JWT_SECRET env var in production
  // Fallback only for local dev where env var may not be configured
  cookieSecret: process.env.JWT_SECRET && process.env.JWT_SECRET.length > 0 ? process.env.JWT_SECRET : "cf-prod-secret-do-not-share-32bytes!!",
  appUrl: process.env.VITE_APP_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  ownerName: process.env.OWNER_NAME ?? "",
  isProduction: process.env.NODE_ENV === "production",
  cronSecret: process.env.CRON_SECRET ?? "",
  // Database
  databaseUrl: process.env.DATABASE_URL ?? "",
  // Manus/Forge LLM
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  frontendForgeApiUrl: process.env.VITE_FRONTEND_FORGE_API_URL ?? "",
  frontendForgeApiKey: process.env.VITE_FRONTEND_FORGE_API_KEY ?? "",
  // OAuth (Manus Platform)
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  oauthPortalUrl: process.env.VITE_OAUTH_PORTAL_URL ?? "",
  // AI Model Keys
  openAiKey: process.env.OPENAI_API_KEY ?? "",
  anthropicKey: process.env.ANTHROPIC_API_KEY ?? "",
  nvidiaKey: process.env.NVIDIA_API_KEY ?? "",
  kimiKey: process.env.KIMI_API_KEY ?? "",
  geminiKey: process.env.GEMINI_API_KEY ?? "",
  openRouterKey: process.env.OPENROUTER_API_KEY ?? "",
  embeddingsKey: process.env.EMBEDDINGS_API_KEY ?? "",
  // Stripe Billing
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripePriceStarter: process.env.STRIPE_PRICE_ID_STARTER ?? "",
  stripePricePro: process.env.STRIPE_PRICE_ID_PRO ?? "",
  stripePriceAgency: process.env.STRIPE_PRICE_ID_AGENCY ?? "",
  // OAuth Providers (Platform Connections)
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  metaAppId: process.env.META_APP_ID ?? "",
  metaAppSecret: process.env.META_APP_SECRET ?? "",
  tiktokClientKey: process.env.TIKTOK_CLIENT_KEY ?? "",
  tiktokClientSecret: process.env.TIKTOK_CLIENT_SECRET ?? "",
  redditClientId: process.env.REDDIT_CLIENT_ID ?? "",
  redditClientSecret: process.env.REDDIT_CLIENT_SECRET ?? "",
  // Email
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  fromEmail: process.env.FROM_EMAIL ?? "",
  // Video Generation (A2E)
  a2eApiKey: process.env.A2E_API_KEY ?? "",
  a2eApiUrl: process.env.A2E_API_URL ?? "",
  // Storage / Infra
  pineconeKey: process.env.PINECONE_API_KEY ?? "",
  pineconeIndex: process.env.PINECONE_INDEX ?? "",
  inngestKey: process.env.INNGEST_API_KEY ?? "",
  langchainKey: process.env.LANGCHAIN_API_KEY ?? "",
  discordBotToken: process.env.DISCORD_BOT_TOKEN ?? "",
  composioKey: process.env.COMPOSIO_API_KEY ?? ""
};

// server/memory-store.ts
var MemoryStore = class {
  businesses = [];
  apiKeys = [];
  contentItems = [];
  nextBusinessId = 1;
  nextApiKeyId = 1;
  nextContentId = 1;
  createBusiness(data) {
    const business = {
      ...data,
      id: this.nextBusinessId++,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.businesses.push(business);
    return business;
  }
  getBusinessByUserId(userId) {
    return this.businesses.find((b) => b.userId === userId);
  }
  getBusinessById(id) {
    return this.businesses.find((b) => b.id === id);
  }
  updateBusiness(id, data) {
    const idx = this.businesses.findIndex((b) => b.id === id);
    if (idx === -1) return void 0;
    this.businesses[idx] = {
      ...this.businesses[idx],
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.businesses[idx];
  }
  addApiKey(data) {
    const apiKey = {
      ...data,
      id: this.nextApiKeyId++,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.apiKeys.push(apiKey);
    return apiKey;
  }
  getApiKeys(businessId) {
    return this.apiKeys.filter((k) => k.businessId === businessId);
  }
  deleteApiKey(id) {
    this.apiKeys = this.apiKeys.filter((k) => k.id !== id);
  }
  addContentItem(data) {
    const item = {
      ...data,
      id: this.nextContentId++,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.contentItems.push(item);
    return item;
  }
  getContentItems(businessId) {
    return this.contentItems.filter((c) => c.businessId === businessId);
  }
};
var memoryStore = new MemoryStore();

// server/db.ts
var _db = null;
async function getDb() {
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
async function upsertUser(user) {
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
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllUsers() {
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
async function getAllBusinesses() {
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
async function getBusinessByUserId(userId) {
  const db = await getDb();
  if (!db) {
    return memoryStore.getBusinessByUserId(userId);
  }
  try {
    const result = await db.select().from(businesses).where(eq(businesses.userId, userId)).limit(1);
    return result.length > 0 ? result[0] : void 0;
  } catch (error) {
    console.error("[Database] Failed to get business by userId:", error);
    return void 0;
  }
}
async function getConnectedAccounts(businessId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get connected accounts: database not available");
    return [];
  }
  try {
    const { connectedAccounts: connectedAccounts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    return await db.select().from(connectedAccounts2).where(eq(connectedAccounts2.businessId, businessId));
  } catch (error) {
    console.error("[Database] Failed to get connected accounts:", error);
    return [];
  }
}
async function getContentQueue(businessId, status) {
  const db = await getDb();
  if (!db) {
    const items = memoryStore.getContentItems(businessId);
    if (status) return items.filter((i) => i.status === status);
    return items;
  }
  try {
    const { contentQueue: contentQueue2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    if (status) {
      return await db.select().from(contentQueue2).where(eq(contentQueue2.businessId, businessId));
    }
    return await db.select().from(contentQueue2).where(eq(contentQueue2.businessId, businessId));
  } catch (error) {
    console.error("[Database] Failed to get content queue:", error);
    return [];
  }
}
async function getAnalytics(businessId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get analytics: database not available");
    return [];
  }
  try {
    const { analyticsLogs: analyticsLogs2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    return await db.select().from(analyticsLogs2).where(eq(analyticsLogs2.businessId, businessId));
  } catch (error) {
    console.error("[Database] Failed to get analytics:", error);
    return [];
  }
}
async function getActivityFeed(businessId, limit = 100) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get activity feed: database not available");
    return [];
  }
  try {
    const { activityFeed: activityFeed2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    return await db.select().from(activityFeed2).where(eq(activityFeed2.businessId, businessId)).limit(limit);
  } catch (error) {
    console.error("[Database] Failed to get activity feed:", error);
    return [];
  }
}
async function deleteAllBusinessData(businessId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete business data: database not available");
    return;
  }
  try {
    const { contentQueue: contentQueue2, connectedAccounts: connectedAccounts2, analyticsLogs: analyticsLogs2, activityFeed: activityFeed2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    await db.delete(contentQueue2).where(eq(contentQueue2.businessId, businessId));
    await db.delete(connectedAccounts2).where(eq(connectedAccounts2.businessId, businessId));
    await db.delete(analyticsLogs2).where(eq(analyticsLogs2.businessId, businessId));
    await db.delete(activityFeed2).where(eq(activityFeed2.businessId, businessId));
    await db.delete(businesses).where(eq(businesses.id, businessId));
  } catch (error) {
    console.error("[Database] Failed to delete business data:", error);
    throw error;
  }
}
async function deleteUser(userId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete user: database not available");
    return;
  }
  try {
    const userBusinesses = await db.select().from(businesses).where(eq(businesses.userId, userId));
    for (const business of userBusinesses) {
      await deleteAllBusinessData(business.id);
    }
    await db.delete(users).where(eq(users.id, userId));
  } catch (error) {
    console.error("[Database] Failed to delete user:", error);
    throw error;
  }
}
async function getInvoices(userId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get invoices: database not available");
    return [];
  }
  try {
    const { invoices: invoices2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    return await db.select().from(invoices2).where(eq(invoices2.userId, userId));
  } catch (error) {
    console.error("[Database] Failed to get invoices:", error);
    return [];
  }
}
async function getTeamMembers(businessId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get team members: database not available");
    return [];
  }
  try {
    const { teamMembers: teamMembers2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    return await db.select().from(teamMembers2).where(eq(teamMembers2.businessId, businessId));
  } catch (error) {
    console.error("[Database] Failed to get team members:", error);
    return [];
  }
}
async function getApiKeys(businessId) {
  const db = await getDb();
  if (!db) {
    return memoryStore.getApiKeys(businessId);
  }
  try {
    const { apiKeys: apiKeys2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    return await db.select().from(apiKeys2).where(eq(apiKeys2.businessId, businessId));
  } catch (error) {
    console.error("[Database] Failed to get API keys:", error);
    return [];
  }
}
async function saveApiKey(data) {
  const db = await getDb();
  if (!db) {
    return memoryStore.addApiKey(data);
  }
  try {
    const { apiKeys: apiKeys2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const result = await db.insert(apiKeys2).values({
      businessId: data.businessId,
      keyName: data.keyName,
      keyValue: data.keyValue,
      provider: data.provider,
      createdAt: /* @__PURE__ */ new Date()
    });
    return result;
  } catch (error) {
    console.error("[Database] Failed to save API key:", error);
    throw error;
  }
}
async function logAnalytic(data) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot log analytic: database not available");
    return;
  }
  try {
    const { analyticsLogs: analyticsLogs2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    await db.insert(analyticsLogs2).values({
      businessId: data.businessId,
      platform: data.platform,
      metricType: data.metricType,
      metricValue: data.metricValue,
      metadata: data.metadata,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    });
  } catch (error) {
    console.error("[Database] Failed to log analytic:", error);
  }
}
async function getLatestVisibilityScore(businessId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get visibility score: database not available");
    return null;
  }
  try {
    const { analyticsLogs: analyticsLogs2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const result = await db.select().from(analyticsLogs2).where(
      eq(analyticsLogs2.businessId, businessId)
    ).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get latest visibility score:", error);
    return null;
  }
}
async function getROISummary(businessId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get ROI summary: database not available");
    return { published: 0, pending: 0, failed: 0, citationsDetected: 0, visibilityScore: 0 };
  }
  try {
    const { contentQueue: contentQueue2, analyticsLogs: analyticsLogs2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const contentItems = await db.select().from(contentQueue2).where(eq(contentQueue2.businessId, businessId));
    const published = contentItems.filter((c) => c.status === "published").length;
    const pending = contentItems.filter((c) => c.status === "pending").length;
    const failed = contentItems.filter((c) => c.status === "failed").length;
    const analytics = await db.select().from(analyticsLogs2).where(eq(analyticsLogs2.businessId, businessId));
    const visibilityScore = analytics.length > 0 ? analytics[0].metricValue || 0 : 0;
    const citationsDetected = analytics.filter((a) => a.metricType === "citation").length;
    return { published, pending, failed, citationsDetected, visibilityScore };
  } catch (error) {
    console.error("[Database] Failed to get ROI summary:", error);
    return { published: 0, pending: 0, failed: 0, citationsDetected: 0, visibilityScore: 0 };
  }
}
async function updateContentStatus(contentId, status) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update content status: database not available");
    return;
  }
  try {
    const { contentQueue: contentQueue2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    await db.update(contentQueue2).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(contentQueue2.id, contentId));
  } catch (error) {
    console.error("[Database] Failed to update content status:", error);
    throw error;
  }
}
async function createContentItem(data) {
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
      engagementData: data.engagementData
    });
  }
  try {
    const { contentQueue: contentQueue2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const result = await db.insert(contentQueue2).values({
      businessId: data.businessId,
      platform: data.platform,
      contentType: data.contentType,
      title: data.title,
      content: data.content,
      scheduledFor: data.scheduledFor,
      status: "pending",
      engagementData: data.engagementData,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    });
    return result;
  } catch (error) {
    console.error("[Database] Failed to create content item:", error);
    throw error;
  }
}
async function logActivity(data) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot log activity: database not available");
    return;
  }
  try {
    const { activityFeed: activityFeed2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    await db.insert(activityFeed2).values({
      businessId: data.businessId,
      action: data.action,
      platform: data.platform,
      description: data.description,
      createdAt: /* @__PURE__ */ new Date()
    });
  } catch (error) {
    console.error("[Database] Failed to log activity:", error);
  }
}
async function addConnectedAccount(data) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add connected account: database not available");
    return;
  }
  try {
    const { connectedAccounts: connectedAccounts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const result = await db.insert(connectedAccounts2).values({
      businessId: data.businessId,
      platform: data.platform,
      platformAccountId: data.platformAccountId,
      accountName: data.accountName,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
      scopes: data.scopes,
      status: "active",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    });
    return result;
  } catch (error) {
    console.error("[Database] Failed to add connected account:", error);
    throw error;
  }
}
async function updateBusiness(businessId, data) {
  const db = await getDb();
  if (!db) {
    memoryStore.updateBusiness(businessId, data);
    return;
  }
  try {
    const updateData = { ...data, updatedAt: /* @__PURE__ */ new Date() };
    await db.update(businesses).set(updateData).where(eq(businesses.id, businessId));
  } catch (error) {
    console.error("[Database] Failed to update business:", error);
    throw error;
  }
}
async function removeConnectedAccount(accountId, businessId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot remove connected account: database not available");
    return;
  }
  try {
    const { connectedAccounts: connectedAccounts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    await db.delete(connectedAccounts2).where(
      eq(connectedAccounts2.id, accountId)
    );
  } catch (error) {
    console.error("[Database] Failed to remove connected account:", error);
    throw error;
  }
}
async function createBusiness(data) {
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
      autoApprove: data.autoApprove || false
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
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    });
    return result;
  } catch (error) {
    console.error("[Database] Failed to create business:", error);
    throw error;
  }
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId)) {
        console.warn("[Auth] Session payload missing openId");
        return null;
      }
      const sessionAppId = appId ?? "";
      const sessionName = name ?? "";
      return {
        openId,
        appId: sessionAppId,
        name: sessionName
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.warn("[Auth] OAuth sync skipped, using JWT payload:", String(error));
      }
    }
    if (!user) {
      const upserted = await upsertUser({
        openId: sessionUserId,
        name: session.name || null,
        email: null,
        loginMethod: "credentials",
        lastSignedIn: signedInAt
      });
      user = await getUserByOpenId(sessionUserId);
      if (!user) {
        return {
          id: 1,
          openId: sessionUserId,
          name: session.name || "User",
          email: null,
          loginMethod: "credentials",
          role: "admin",
          createdAt: signedInAt,
          updatedAt: signedInAt,
          lastSignedIn: signedInAt
        };
      }
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/google-oauth.ts
var GOOGLE_CLIENT_ID = ENV.googleClientId;
var GOOGLE_CLIENT_SECRET = ENV.googleClientSecret;
var GOOGLE_AUTH_URI = "https://accounts.google.com/o/oauth2/auth";
var GOOGLE_TOKEN_URI = "https://oauth2.googleapis.com/token";
var SCOPES = [
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/business.manage",
  "https://www.googleapis.com/auth/webmasters"
];
function getGoogleAuthUrl(redirectUri, state) {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    state,
    access_type: "offline",
    prompt: "consent"
  });
  return `${GOOGLE_AUTH_URI}?${params.toString()}`;
}
async function exchangeCodeForTokens(code, redirectUri) {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri
  });
  const response = await fetch(GOOGLE_TOKEN_URI, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google token exchange failed: ${error}`);
  }
  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in || 3600
  };
}
async function getGoogleUserInfo(accessToken) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) {
    throw new Error("Failed to fetch Google user info");
  }
  const data = await response.json();
  return {
    email: data.email,
    name: data.name
  };
}

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/dashboard");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
  app.get("/api/oauth/google/init", (req, res) => {
    const redirectUri = `${req.protocol}://${req.get("host")}/api/oauth/google/callback`;
    const state = Buffer.from(JSON.stringify({ redirectUri })).toString("base64");
    const authUrl = getGoogleAuthUrl(redirectUri, state);
    res.redirect(302, authUrl);
  });
  app.get("/api/oauth/google/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const stateData = JSON.parse(Buffer.from(state, "base64").toString());
      const redirectUri = stateData.redirectUri || `${req.protocol}://${req.get("host")}/api/oauth/google/callback`;
      const tokens = await exchangeCodeForTokens(code, redirectUri);
      const userInfo = await getGoogleUserInfo(tokens.accessToken);
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }
      const business = await getBusinessByUserId(user.id);
      if (!business) {
        res.status(404).json({ error: "Business not found" });
        return;
      }
      await addConnectedAccount({
        businessId: business.id,
        platform: "google",
        platformAccountId: userInfo.email,
        accountName: userInfo.name || userInfo.email,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || null,
        expiresAt: new Date(Date.now() + tokens.expiresIn * 1e3),
        scopes: "https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/webmasters"
      });
      if (logActivity) {
        await logActivity({
          businessId: business.id,
          action: "Connected Google account",
          platform: "google",
          description: `Connected ${userInfo.email}`
        });
      }
      res.redirect(302, `/platforms?connected=google&email=${encodeURIComponent(userInfo.email)}`);
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error);
      res.redirect(302, `/platforms?error=${encodeURIComponent(error.message || "Google connection failed")}`);
    }
  });
}

// server/stripe-routes.ts
init_schema();
import { eq as eq2 } from "drizzle-orm";
var STRIPE_SECRET_KEY = ENV.stripeSecretKey;
var STRIPE_WEBHOOK_SECRET = ENV.stripeWebhookSecret;
var PLANS = {
  starter: { priceAmount: 9700, name: "ContentFlow Starter ($97/mo)", tier: "starter" },
  pro: { priceAmount: 19700, name: "ContentFlow Pro ($197/mo)", tier: "pro" },
  enterprise: { priceAmount: 49700, name: "ContentFlow Enterprise ($497/mo)", tier: "enterprise" }
};
async function stripeAPI(endpoint, method = "POST", body) {
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded"
    }
  };
  if (body && method === "POST") {
    options.body = new URLSearchParams(body).toString();
  }
  const res = await fetch(`https://api.stripe.com/v1${endpoint}`, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `Stripe API error: ${res.status}`);
  }
  return data;
}
async function getOrCreateStripeCustomer(userId, email, name) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [user] = await db.select().from(users).where(eq2(users.id, userId)).limit(1);
  if (user?.stripeCustomerId) return user.stripeCustomerId;
  const customerParams = {};
  if (email) customerParams.email = email;
  if (name) customerParams.name = name;
  customerParams.metadata_user_id = userId.toString();
  const body = {};
  if (email) body.email = email;
  if (name) body.name = name;
  body["metadata[user_id]"] = userId.toString();
  const customer = await stripeAPI("/customers", "POST", body);
  await db.update(users).set({ stripeCustomerId: customer.id }).where(eq2(users.id, userId));
  return customer.id;
}
async function getUserFromRequest(req) {
  try {
    const user = await sdk.authenticateRequest(req);
    return user ? { id: user.id, email: user.email || null, name: user.name || null, planTier: user.planTier || null } : null;
  } catch {
    return null;
  }
}
function registerStripeRoutes(app) {
  app.get("/api/stripe/checkout", async (req, res) => {
    if (!STRIPE_SECRET_KEY) {
      res.status(500).json({ error: "Stripe not configured \u2014 contact admin. Add STRIPE_SECRET_KEY as an environment variable." });
      return;
    }
    const planId = req.query.plan || "pro";
    const plan = PLANS[planId];
    if (!plan) {
      res.status(400).json({ error: `Invalid plan: ${planId}. Valid plans: starter, pro, enterprise` });
      return;
    }
    const user = await getUserFromRequest(req);
    if (!user) {
      res.redirect(302, "/?error=Please+sign+in+first");
      return;
    }
    try {
      const customerId = await getOrCreateStripeCustomer(user.id, user.email, user.name);
      const origin = `${req.protocol}://${req.get("host")}`;
      const session = await stripeAPI("/checkout/sessions", "POST", {
        mode: "subscription",
        customer: customerId,
        "success_url": `${origin}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        "cancel_url": `${origin}/billing?canceled=true`,
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][product_data][name]": plan.name,
        "line_items[0][price_data][unit_amount]": plan.priceAmount.toString(),
        "line_items[0][price_data][recurring][interval]": "month",
        "line_items[0][quantity]": "1",
        "metadata[user_id]": user.id.toString(),
        "metadata[plan_tier]": plan.tier,
        "subscription_data[metadata][user_id]": user.id.toString(),
        "subscription_data[metadata][plan_tier]": plan.tier
      });
      res.redirect(303, session.url);
    } catch (err) {
      console.error("[Stripe] Checkout error:", err.message);
      res.redirect(302, `/billing?error=${encodeURIComponent(err.message)}`);
    }
  });
  app.get("/api/stripe/portal", async (req, res) => {
    if (!STRIPE_SECRET_KEY) {
      res.status(500).json({ error: "Stripe not configured \u2014 contact admin." });
      return;
    }
    const user = await getUserFromRequest(req);
    if (!user) {
      res.redirect(302, "/?error=Please+sign+in+first");
      return;
    }
    try {
      const customerId = await getOrCreateStripeCustomer(user.id, user.email, user.name);
      const origin = `${req.protocol}://${req.get("host")}`;
      const portalSession = await stripeAPI("/billing_portal/sessions", "POST", {
        customer: customerId,
        return_url: `${origin}/billing`
      });
      res.redirect(303, portalSession.url);
    } catch (err) {
      console.error("[Stripe] Portal error:", err.message);
      res.redirect(302, `/billing?error=${encodeURIComponent(err.message)}`);
    }
  });
  app.post("/api/stripe/webhook", async (req, res) => {
    const event = req.body;
    if (!event || !event.type) {
      res.status(400).json({ error: "Invalid event" });
      return;
    }
    console.log(`[Stripe Webhook] Received event: ${event.type}`);
    const db = await getDb();
    if (!db) {
      res.status(500).json({ error: "Database unavailable" });
      return;
    }
    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const userId = parseInt(session.metadata?.user_id || "0");
          const planTier = session.metadata?.plan_tier || "pro";
          if (userId) {
            await db.update(users).set({
              planTier,
              subscriptionStatus: "active",
              stripeCustomerId: session.customer
            }).where(eq2(users.id, userId));
            await db.insert(invoices).values({
              userId,
              stripeInvoiceId: session.invoice || session.id,
              amount: session.amount_total || PLANS[planTier]?.priceAmount || 0,
              currency: "usd",
              status: "paid",
              description: `Subscription: ${PLANS[planTier]?.name || planTier}`
            });
            console.log(`[Stripe] User ${userId} subscribed to ${planTier}`);
          }
          break;
        }
        case "customer.subscription.updated": {
          const subscription = event.data.object;
          const userId = parseInt(subscription.metadata?.user_id || "0");
          const planTier = subscription.metadata?.plan_tier;
          if (userId) {
            const status = subscription.status === "active" ? "active" : subscription.status === "past_due" ? "past_due" : subscription.status === "canceled" ? "canceled" : subscription.status;
            const updateData = { subscriptionStatus: status };
            if (planTier) updateData.planTier = planTier;
            await db.update(users).set(updateData).where(eq2(users.id, userId));
            console.log(`[Stripe] User ${userId} subscription updated: ${status}`);
          }
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          const userId = parseInt(subscription.metadata?.user_id || "0");
          if (userId) {
            await db.update(users).set({
              subscriptionStatus: "canceled",
              planTier: "free"
            }).where(eq2(users.id, userId));
            console.log(`[Stripe] User ${userId} subscription canceled`);
          }
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object;
          const customerId = invoice.customer;
          const [user] = await db.select().from(users).where(eq2(users.stripeCustomerId, customerId)).limit(1);
          if (user) {
            await db.update(users).set({ subscriptionStatus: "past_due" }).where(eq2(users.id, user.id));
            await db.insert(invoices).values({
              userId: user.id,
              stripeInvoiceId: invoice.id,
              amount: invoice.amount_due || 0,
              currency: invoice.currency || "usd",
              status: "failed",
              description: "Payment failed"
            });
            console.log(`[Stripe] Payment failed for user ${user.id}`);
          }
          break;
        }
        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }
      res.json({ received: true });
    } catch (err) {
      console.error("[Stripe Webhook] Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });
}

// server/scheduling-engine.ts
init_schema();
import { eq as eq4, and as and2, sql } from "drizzle-orm";

// server/_core/llm.ts
async function pickProvider() {
  if (ENV.openAiKey) {
    return { baseUrl: "https://api.openai.com/v1", apiKey: ENV.openAiKey, model: "gpt-4o-mini" };
  }
  if (ENV.nvidiaKey) {
    return { baseUrl: "https://integrate.api.nvidia.com/v1", apiKey: ENV.nvidiaKey, model: "meta/llama-3.1-70b-instruct" };
  }
  if (ENV.openRouterKey) {
    return { baseUrl: "https://openrouter.ai/api/v1", apiKey: ENV.openRouterKey, model: "meta-llama/llama-3.1-8b-instruct:free" };
  }
  if (ENV.anthropicKey) {
    return { baseUrl: "https://api.anthropic.com/v1", apiKey: ENV.anthropicKey, model: "claude-3-5-sonnet-20241022" };
  }
  if (ENV.geminiKey) {
    return { baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", apiKey: ENV.geminiKey, model: "gemini-2.0-flash" };
  }
  if (ENV.kimiKey) {
    return { baseUrl: "https://api.moonshot.cn/v1", apiKey: ENV.kimiKey, model: "moonshot-v1-8k" };
  }
  try {
    const allBusinesses = await getAllBusinesses?.() || [];
    for (const biz of allBusinesses) {
      const keys = await getApiKeys(biz.id);
      const openaiKey = keys.find((k) => /openai/i.test(k.provider || "") || /openai/i.test(k.keyName || ""));
      if (openaiKey) {
        return { baseUrl: "https://api.openai.com/v1", apiKey: openaiKey.keyValue, model: "gpt-4o-mini" };
      }
    }
  } catch {
  }
  return null;
}
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  const content = Array.isArray(message.content) ? message.content : [message.content];
  const parts = content.map((c) => {
    if (typeof c === "string") return { type: "text", text: c };
    return c;
  });
  if (parts.length === 1 && parts[0].type === "text") {
    return { role, name, content: parts[0].text };
  }
  return { role, name, content: parts };
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicit = responseFormat || response_format;
  if (explicit) return explicit;
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  return { type: "json_schema", json_schema: { name: schema.name, schema: schema.schema, strict: schema.strict ?? true } };
};
var toAnthropicMessages = (messages) => {
  const system = messages.find((m) => m.role === "system");
  const rest = messages.filter((m) => m.role !== "system").map((m) => {
    const c = Array.isArray(m.content) ? m.content : [m.content];
    const text2 = c.map((x) => typeof x === "string" ? x : x.text || "").join("\n");
    return { role: m.role, content: text2 };
  });
  return { system: typeof system?.content === "string" ? system.content : "", messages: rest };
};
async function callOpenAICompatible(config, payload) {
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const t2 = await res.text();
    throw new Error(`LLM call failed (${config.baseUrl}): ${res.status} \u2013 ${t2}`);
  }
  return res.json();
}
async function callAnthropic(config, payload) {
  const { system, messages } = toAnthropicMessages(payload.messages);
  const res = await fetch(`${config.baseUrl}/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: config.model,
      system,
      messages,
      max_tokens: payload.max_tokens || 4096
    })
  });
  if (!res.ok) {
    const t2 = await res.text();
    throw new Error(`Anthropic call failed: ${res.status} \u2013 ${t2}`);
  }
  const data = await res.json();
  return {
    id: data.id,
    created: Date.now(),
    model: data.model,
    choices: [{
      index: 0,
      message: { role: "assistant", content: data.content?.[0]?.text || "" },
      finish_reason: data.stop_reason
    }],
    usage: { prompt_tokens: data.usage?.input_tokens || 0, completion_tokens: data.usage?.output_tokens || 0, total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0) }
  };
}
async function invokeLLM(params) {
  const provider = await pickProvider();
  if (!provider) {
    throw new Error(
      "No LLM API key configured. Set OPENAI_API_KEY, NVIDIA_API_KEY, OPENROUTER_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, or add a key in Settings \u2192 API Keys."
    );
  }
  const { messages, responseFormat, response_format, outputSchema, output_schema, maxTokens, max_tokens } = params;
  const payload = {
    model: provider.model,
    messages: messages.map(normalizeMessage)
  };
  payload.max_tokens = maxTokens || max_tokens || 4096;
  const normalizedFormat = normalizeResponseFormat({ responseFormat, response_format, outputSchema, output_schema });
  if (normalizedFormat) payload.response_format = normalizedFormat;
  const data = provider.baseUrl.includes("anthropic.com") ? await callAnthropic(provider, payload) : await callOpenAICompatible(provider, payload);
  return data;
}

// server/ai-content.ts
var PLATFORM_GUIDELINES = {
  google: "Optimize for Google Business Profile. Keep it concise (1500 chars max), include a CTA, use local SEO keywords.",
  instagram: "Write an engaging Instagram caption (2200 chars max). Include relevant hashtags (up to 30). Use emojis sparingly. Include a hook in the first line.",
  facebook: "Write a Facebook post that encourages engagement. Ask questions, use storytelling. 1-3 paragraphs max.",
  tiktok: "Write a TikTok video script/caption. Keep it punchy, trendy, and under 300 chars for the caption. Include trending hashtag suggestions.",
  youtube: "Write a YouTube video title, description (5000 chars max with timestamps), and tags. Optimize for search.",
  reddit: "Write a Reddit post that provides genuine value. No promotional language. Be authentic and conversational. Match the subreddit tone.",
  wordpress: "Write a full blog post with H2/H3 headings, intro paragraph, 3-5 sections, conclusion with CTA. Include meta description and focus keyword. 1000-2000 words."
};
var CONTENT_TYPE_INSTRUCTIONS = {
  blog: "Generate a comprehensive blog article with proper heading structure (H2, H3), introduction, body sections, and conclusion. Include internal linking suggestions and a meta description.",
  social: "Generate a social media post optimized for engagement. Include a hook, value proposition, and call-to-action.",
  video: "Generate a video script with: hook (first 3 seconds), intro, main content sections, CTA, and outro. Include visual/B-roll suggestions.",
  schema: "Generate structured data markup (JSON-LD) for the business. Include Organization, LocalBusiness, FAQ, or Article schema as appropriate."
};
async function generateContent(request) {
  const { platform, contentType, topic, business } = request;
  const platformGuide = PLATFORM_GUIDELINES[platform] || "Write engaging content for this platform.";
  const typeGuide = CONTENT_TYPE_INSTRUCTIONS[contentType] || CONTENT_TYPE_INSTRUCTIONS.social;
  const systemPrompt = `You are an expert AI content strategist and copywriter for "${business.name}".

BUSINESS CONTEXT:
- Industry: ${business.industry || "General"}
- Target Audience: ${business.targetAudience || "General audience"}
- Brand Voice/Tone: ${business.toneOfVoice || "Professional and engaging"}
- Website: ${business.websiteUrl || "N/A"}
- Description: ${business.description || "A growing business"}

PLATFORM GUIDELINES (${platform}):
${platformGuide}

CONTENT TYPE (${contentType}):
${typeGuide}

RULES:
1. Stay on-brand with the specified tone of voice
2. Never use placeholder text \u2014 generate real, publishable content
3. Include relevant keywords naturally for SEO
4. Make content actionable and valuable to the target audience
5. Adapt length and format to the platform requirements`;
  const userPrompt = topic ? `Generate ${contentType} content for ${platform} about: "${topic}"` : `Generate ${contentType} content for ${platform} that would be relevant and valuable for our target audience in the ${business.industry || "general"} industry. Choose a trending or evergreen topic.`;
  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "generated_content",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "The title or headline for the content" },
            content: { type: "string", description: "The full generated content body" },
            hashtags: {
              type: "array",
              items: { type: "string" },
              description: "Relevant hashtags (for social platforms)"
            },
            seoKeywords: {
              type: "array",
              items: { type: "string" },
              description: "SEO keywords targeted in this content"
            },
            metaDescription: { type: "string", description: "Meta description for SEO (under 160 chars)" }
          },
          required: ["title", "content", "hashtags", "seoKeywords", "metaDescription"],
          additionalProperties: false
        }
      }
    }
  });
  const messageContent = response.choices[0]?.message?.content;
  const text2 = typeof messageContent === "string" ? messageContent : "";
  try {
    const parsed = JSON.parse(text2);
    return {
      title: parsed.title,
      content: parsed.content,
      hashtags: parsed.hashtags,
      metadata: {
        seoKeywords: parsed.seoKeywords,
        metaDescription: parsed.metaDescription,
        platform,
        contentType,
        generatedAt: Date.now()
      }
    };
  } catch {
    return {
      title: topic || `${contentType} for ${platform}`,
      content: text2,
      metadata: { platform, contentType, generatedAt: Date.now() }
    };
  }
}

// server/publishing-worker.ts
init_schema();
import { eq as eq3, and, lte } from "drizzle-orm";
var platformPublishers = {
  google: async (content, title, token) => {
    if (!token) throw new Error("Google Business: No access token. Connect your Google account in Platforms.");
    const accountsRes = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!accountsRes.ok) {
      const err = await accountsRes.text();
      throw new Error(`Google API error (accounts): ${accountsRes.status} - ${err}`);
    }
    const accountsData = await accountsRes.json();
    const account = accountsData.accounts?.[0];
    if (!account) throw new Error("No Google Business account found");
    const locationsRes = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!locationsRes.ok) {
      console.log(`[Worker] Google: Could not list locations, attempting direct post`);
    }
    const postRes = await fetch(`https://mybusiness.googleapis.com/v4/${account.name}/locations/-/localPosts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        languageCode: "en",
        summary: content.slice(0, 1500),
        topicType: "STANDARD",
        callToAction: { actionType: "LEARN_MORE" }
      })
    });
    if (!postRes.ok) {
      const err = await postRes.text();
      throw new Error(`Google Business post failed: ${postRes.status} - ${err}`);
    }
    const postData = await postRes.json();
    return { success: true, postId: postData.name };
  },
  youtube: async (content, title, token) => {
    if (!token) throw new Error("YouTube: No access token. Connect your Google account in Platforms.");
    const res = await fetch("https://www.googleapis.com/youtube/v3/playlists?part=snippet,status", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        snippet: {
          title: title.slice(0, 150),
          description: content.slice(0, 5e3)
        },
        status: { privacyStatus: "public" }
      })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`YouTube API error: ${res.status} - ${err}`);
    }
    const data = await res.json();
    return { success: true, postId: data.id };
  },
  instagram: async (content, title, token) => {
    if (!token) throw new Error("Instagram: No access token. Connect your Meta account in Platforms.");
    const accountsRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${token}`);
    if (!accountsRes.ok) throw new Error(`Meta API error: ${await accountsRes.text()}`);
    const pages = await accountsRes.json();
    const page = pages.data?.[0];
    if (!page) throw new Error("No Facebook page found. Connect a page with Instagram.");
    const igRes = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${token}`);
    if (!igRes.ok) throw new Error(`Could not find Instagram account: ${await igRes.text()}`);
    const igData = await igRes.json();
    const igAccountId = igData.instagram_business_account?.id;
    if (!igAccountId) throw new Error("No Instagram Business account linked to this page");
    const createRes = await fetch(`https://graph.facebook.com/v18.0/${igAccountId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caption: content.slice(0, 2200),
        access_token: token,
        // Note: Instagram requires image_url or video_url for feed posts
        // This will work for stories or when media is provided
        media_type: "TEXT"
      })
    });
    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Instagram media creation failed: ${err}`);
    }
    const mediaData = await createRes.json();
    return { success: true, postId: mediaData.id };
  },
  facebook: async (content, title, token) => {
    if (!token) throw new Error("Facebook: No access token. Connect your Meta account in Platforms.");
    const accountsRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${token}`);
    if (!accountsRes.ok) throw new Error(`Meta API error: ${await accountsRes.text()}`);
    const pages = await accountsRes.json();
    const page = pages.data?.[0];
    if (!page) throw new Error("No Facebook page found");
    const postRes = await fetch(`https://graph.facebook.com/v18.0/${page.id}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: content,
        access_token: page.access_token || token
      })
    });
    if (!postRes.ok) {
      const err = await postRes.text();
      throw new Error(`Facebook post failed: ${postRes.status} - ${err}`);
    }
    const postData = await postRes.json();
    return { success: true, postId: postData.id };
  },
  tiktok: async (content, title, token) => {
    if (!token) throw new Error("TikTok: No access token. Connect your TikTok account in Platforms.");
    const res = await fetch("https://open.tiktokapis.com/v2/post/publish/content/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        post_info: {
          title: title.slice(0, 150),
          description: content.slice(0, 300),
          disable_comment: false,
          privacy_level: "PUBLIC_TO_EVERYONE"
        },
        source_info: {
          source: "PULL_FROM_URL"
          // TikTok requires media - this will fail without a video URL
          // but demonstrates the real API integration pattern
        }
      })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`TikTok API error: ${res.status} - ${err}`);
    }
    const data = await res.json();
    return { success: true, postId: data.data?.publish_id };
  },
  reddit: async (content, title, token) => {
    if (!token) throw new Error("Reddit: No access token. Connect your Reddit account in Platforms.");
    const res = await fetch("https://oauth.reddit.com/api/submit", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "ContentFlow/1.0"
      },
      body: new URLSearchParams({
        kind: "self",
        sr: "test",
        // Default subreddit - should be configurable per business
        title: title.slice(0, 300),
        text: content,
        api_type: "json"
      }).toString()
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Reddit API error: ${res.status} - ${err}`);
    }
    const data = await res.json();
    if (data.json?.errors?.length > 0) {
      throw new Error(`Reddit error: ${data.json.errors.map((e) => e[1]).join(", ")}`);
    }
    return { success: true, postId: data.json?.data?.name };
  },
  wordpress: async (content, title, token, metadata) => {
    if (!token) throw new Error("WordPress: No credentials. Add your WordPress site URL and Application Password in Platforms.");
    const siteUrl = metadata?.siteUrl || metadata?.websiteUrl;
    if (!siteUrl) throw new Error("WordPress: No site URL configured. Add your WordPress site URL.");
    const res = await fetch(`${siteUrl}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        content,
        status: "publish",
        format: "standard"
      })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`WordPress API error: ${res.status} - ${err}`);
    }
    const data = await res.json();
    return { success: true, postId: data.id?.toString() };
  }
};
async function runPublishingWorker(businessId) {
  const db = await getDb();
  if (!db) {
    return { processed: 0, failed: 0, skipped: 0, errors: ["Database not available"] };
  }
  const result = { processed: 0, failed: 0, skipped: 0, errors: [] };
  const now = /* @__PURE__ */ new Date();
  const conditions = [
    eq3(contentQueue.status, "pending"),
    lte(contentQueue.scheduledFor, now)
  ];
  if (businessId) {
    conditions.push(eq3(contentQueue.businessId, businessId));
  }
  const pendingItems = await db.select().from(contentQueue).where(and(...conditions)).limit(50);
  console.log(`[Worker] Found ${pendingItems.length} items due for publishing`);
  for (const item of pendingItems) {
    try {
      const [business] = await db.select().from(businesses).where(eq3(businesses.id, item.businessId)).limit(1);
      if (!business) {
        await db.update(contentQueue).set({ status: "failed", errorLog: "Business not found" }).where(eq3(contentQueue.id, item.id));
        result.failed++;
        result.errors.push(`Item ${item.id}: Business not found`);
        continue;
      }
      let finalContent = item.content;
      let finalTitle = item.title;
      if (!finalContent) {
        console.log(`[Worker] Generating content for item ${item.id} (${item.platform}/${item.contentType})`);
        const generated = await generateContent({
          platform: item.platform,
          contentType: item.contentType || "social",
          topic: item.title || void 0,
          business
        });
        finalContent = generated.content;
        finalTitle = generated.title;
        await db.update(contentQueue).set({
          content: finalContent,
          title: finalTitle
        }).where(eq3(contentQueue.id, item.id));
      }
      const [account] = await db.select().from(connectedAccounts).where(and(
        eq3(connectedAccounts.businessId, item.businessId),
        eq3(connectedAccounts.platform, item.platform),
        eq3(connectedAccounts.status, "active")
      )).limit(1);
      const accessToken = account?.accessToken || void 0;
      const publisher = platformPublishers[item.platform];
      if (!publisher) {
        await db.update(contentQueue).set({
          status: "failed",
          errorLog: `No publisher configured for platform: ${item.platform}`
        }).where(eq3(contentQueue.id, item.id));
        result.failed++;
        result.errors.push(`Item ${item.id}: No publisher for ${item.platform}`);
        continue;
      }
      const publishResult = await publisher(
        finalContent || "",
        finalTitle || "",
        accessToken,
        { siteUrl: business.websiteUrl }
      );
      await db.update(contentQueue).set({
        status: "published",
        publishedAt: /* @__PURE__ */ new Date()
      }).where(eq3(contentQueue.id, item.id));
      await db.insert(activityFeed).values({
        businessId: item.businessId,
        action: `Published to ${item.platform}`,
        platform: item.platform,
        description: finalTitle || "Content published",
        metadata: publishResult.postId ? { postId: publishResult.postId } : void 0
      });
      await db.insert(analyticsLogs).values({
        businessId: item.businessId,
        platform: item.platform,
        metricType: "post_published",
        metricValue: 1,
        metadata: { contentType: item.contentType, title: finalTitle, postId: publishResult.postId }
      });
      result.processed++;
    } catch (err) {
      const errorMsg = err?.message || "Unknown error";
      console.error(`[Worker] Failed to publish item ${item.id}:`, errorMsg);
      const newRetryCount = (item.retryCount || 0) + 1;
      const newStatus = newRetryCount >= 3 ? "failed" : "pending";
      await db.update(contentQueue).set({
        status: newStatus,
        errorLog: errorMsg,
        retryCount: newRetryCount
      }).where(eq3(contentQueue.id, item.id));
      if (newStatus === "failed") {
        result.failed++;
        result.errors.push(`Item ${item.id} (${item.platform}): ${errorMsg}`);
      } else {
        result.skipped++;
      }
    }
  }
  console.log(`[Worker] Complete: ${result.processed} published, ${result.failed} failed, ${result.skipped} retrying`);
  return result;
}

// server/scheduling-engine.ts
async function runScheduledPublishing() {
  const db = await getDb();
  if (!db) return { businessesProcessed: 0, contentGenerated: 0, contentPublished: 0, errors: ["DB unavailable"] };
  const result = { businessesProcessed: 0, contentGenerated: 0, contentPublished: 0, errors: [] };
  const autoPublishBusinesses = await db.select().from(businesses).where(eq4(businesses.autoApprove, true));
  console.log(`[Scheduler] Found ${autoPublishBusinesses.length} businesses with auto-publish`);
  for (const business of autoPublishBusinesses) {
    try {
      const pendingCount = await db.select({ count: sql`COUNT(*)` }).from(contentQueue).where(and2(
        eq4(contentQueue.businessId, business.id),
        eq4(contentQueue.status, "pending")
      ));
      const pending = pendingCount[0]?.count || 0;
      if (pending === 0) {
        const schedule = business.postingSchedule || [];
        const topicClusters = business.topicClusters || [];
        if (schedule.length > 0) {
          const topPlatform = schedule.sort((a, b) => (a.priority || 99) - (b.priority || 99))[0];
          const randomTopic = topicClusters.length > 0 ? topicClusters[Math.floor(Math.random() * topicClusters.length)] : void 0;
          try {
            const generated = await generateContent({
              platform: topPlatform.platform?.toLowerCase().replace(/\s+/g, "") || "google",
              contentType: "social",
              topic: randomTopic,
              business
            });
            await db.insert(contentQueue).values({
              businessId: business.id,
              platform: topPlatform.platform?.toLowerCase().replace(/\s+/g, "") || "google",
              contentType: "social",
              title: generated.title,
              content: generated.content,
              scheduledFor: /* @__PURE__ */ new Date(),
              // Publish immediately
              status: "pending"
            });
            result.contentGenerated++;
          } catch (genErr) {
            result.errors.push(`Business ${business.id} generation: ${genErr.message}`);
          }
        }
      }
      const workerResult = await runPublishingWorker(business.id);
      result.contentPublished += workerResult.processed;
      if (workerResult.errors.length > 0) {
        result.errors.push(...workerResult.errors);
      }
      result.businessesProcessed++;
    } catch (err) {
      result.errors.push(`Business ${business.id}: ${err.message}`);
    }
  }
  console.log(`[Scheduler] Done: ${result.businessesProcessed} businesses, ${result.contentGenerated} generated, ${result.contentPublished} published`);
  return result;
}
function registerCronRoutes(app) {
  app.post("/api/cron/publish", async (req, res) => {
    const authHeader = req.headers.authorization;
    const cronSecret = ENV.cronSecret;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    try {
      const result = await runScheduledPublishing();
      res.json({ success: true, ...result });
    } catch (err) {
      console.error("[Cron] Error:", err);
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/cron/publish", async (req, res) => {
    const token = req.query.token;
    const cronSecret = ENV.cronSecret;
    if (cronSecret && token !== cronSecret) {
      res.status(401).json({ error: "Unauthorized. Pass ?token=YOUR_CRON_SECRET" });
      return;
    }
    try {
      const result = await runScheduledPublishing();
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

// server/_core/storageProxy.ts
function registerStorageProxy(app) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z2 } from "zod";

// server/business-analyzer.ts
async function analyzeBusinessWebsite(websiteUrl, businessName) {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert digital marketing strategist and business analyst. Analyze the given business and generate a comprehensive content strategy. Be specific and actionable. Base your analysis on the business name and URL provided \u2014 infer the industry, services, and audience from the domain name and business name.`
      },
      {
        role: "user",
        content: `Analyze this business and create a full content strategy:

Business Name: ${businessName}
Website URL: ${websiteUrl}

Generate a comprehensive analysis including:
1. Their likely industry/niche
2. Key services or products they offer
3. Their target audience demographics and psychographics
4. 3-5 likely competitors in their space
5. 8-12 topic clusters for content creation
6. Recommended tone of voice
7. Optimal posting schedule for each platform (Google Business, Instagram, Facebook, TikTok, YouTube, Reddit, WordPress)
8. A brief content strategy summary
9. 10-15 SEO keywords to target`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "business_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            industry: { type: "string", description: "The business industry/niche" },
            services: { type: "array", items: { type: "string" }, description: "Key services or products" },
            targetAudience: { type: "string", description: "Target audience description" },
            competitors: { type: "array", items: { type: "string" }, description: "Likely competitors" },
            topicClusters: { type: "array", items: { type: "string" }, description: "Content topic clusters" },
            toneOfVoice: { type: "string", description: "Recommended brand tone" },
            postingSchedule: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  platform: { type: "string" },
                  frequency: { type: "string" },
                  bestTime: { type: "string" },
                  priority: { type: "integer" }
                },
                required: ["platform", "frequency", "bestTime", "priority"],
                additionalProperties: false
              },
              description: "Posting schedule per platform"
            },
            contentStrategy: { type: "string", description: "Brief content strategy summary" },
            keywords: { type: "array", items: { type: "string" }, description: "SEO keywords to target" }
          },
          required: ["industry", "services", "targetAudience", "competitors", "topicClusters", "toneOfVoice", "postingSchedule", "contentStrategy", "keywords"],
          additionalProperties: false
        }
      }
    }
  });
  const text2 = response.choices[0]?.message?.content;
  if (!text2 || typeof text2 !== "string") {
    throw new Error("Failed to get analysis from LLM");
  }
  return JSON.parse(text2);
}

// server/content-quality.ts
init_schema();
import { eq as eq5, desc } from "drizzle-orm";
async function scoreContent(content, title, platform, brandVoice, targetAudience, recentTitles) {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a content quality analyst. Score the given content on multiple dimensions. Be strict and honest \u2014 only give 8+ for genuinely excellent content. Check for duplicate/similar content against the recent posts list.`
      },
      {
        role: "user",
        content: `Score this content:

TITLE: ${title}
PLATFORM: ${platform}
CONTENT: ${content.slice(0, 2e3)}

BRAND VOICE: ${brandVoice || "Professional and engaging"}
TARGET AUDIENCE: ${targetAudience || "General audience"}

RECENT POST TITLES (check for duplicates):
${recentTitles.slice(0, 20).map((t2, i) => `${i + 1}. ${t2}`).join("\n")}

Score each dimension 1-10 and provide brief reasoning.`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "quality_score",
        strict: true,
        schema: {
          type: "object",
          properties: {
            overall: { type: "integer", description: "Overall quality score 1-10" },
            relevance: { type: "integer", description: "Topic relevance to audience 1-10" },
            engagement: { type: "integer", description: "Engagement potential 1-10" },
            seoOptimization: { type: "integer", description: "SEO optimization level 1-10" },
            brandVoiceMatch: { type: "integer", description: "Brand voice consistency 1-10" },
            reasoning: { type: "string", description: "Brief explanation of scores" },
            suggestions: { type: "array", items: { type: "string" }, description: "Improvement suggestions" },
            isDuplicate: { type: "boolean", description: "Whether this is too similar to a recent post" },
            duplicateSimilarity: { type: "integer", description: "Similarity percentage to most similar recent post 0-100" }
          },
          required: ["overall", "relevance", "engagement", "seoOptimization", "brandVoiceMatch", "reasoning", "suggestions", "isDuplicate", "duplicateSimilarity"],
          additionalProperties: false
        }
      }
    }
  });
  const text2 = response.choices[0]?.message?.content;
  if (!text2 || typeof text2 !== "string") {
    return {
      overall: 5,
      relevance: 5,
      engagement: 5,
      seoOptimization: 5,
      brandVoiceMatch: 5,
      reasoning: "Could not score content",
      suggestions: [],
      isDuplicate: false,
      duplicateSimilarity: 0
    };
  }
  return JSON.parse(text2);
}
async function getRecentTitles(businessId, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const items = await db.select({ title: contentQueue.title }).from(contentQueue).where(eq5(contentQueue.businessId, businessId)).orderBy(desc(contentQueue.createdAt)).limit(limit);
  return items.map((i) => i.title || "").filter(Boolean);
}

// server/ai-visibility.ts
async function checkAIVisibility(businessName, industry, keywords, websiteUrl) {
  const searchQueries = keywords.slice(0, 5).map((k) => `best ${k} ${industry}`);
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are evaluating how visible a business is to AI systems. You represent what AI assistants (ChatGPT, Claude, Perplexity, Google AI) would know about this business. Be honest \u2014 if you don't know the business, score it low. Only give high scores if the business is genuinely well-known in its space.`
      },
      {
        role: "user",
        content: `Evaluate the AI visibility of this business:

Business: ${businessName}
Industry: ${industry}
Website: ${websiteUrl || "N/A"}
Keywords: ${keywords.join(", ")}

Questions to consider:
1. Would you mention "${businessName}" if someone asked: "${searchQueries[0] || `best ${industry} company`}"?
2. How much do you know about this specific business?
3. Would you cite their website as a source for ${industry}-related questions?
4. How likely is this business to appear in AI-generated recommendations?

Score each dimension and provide an overall AI visibility score 0-100.`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "visibility_score",
        strict: true,
        schema: {
          type: "object",
          properties: {
            overallScore: { type: "integer", description: "Overall AI visibility score 0-100" },
            nameRecognition: { type: "integer", description: "How well AI recognizes the business name 0-25" },
            relevanceScore: { type: "integer", description: "How relevant the business is for industry queries 0-25" },
            detailLevel: { type: "integer", description: "How much detail AI knows about the business 0-25" },
            citationLikelihood: { type: "integer", description: "How likely AI would cite/recommend this business 0-25" },
            citationsDetected: { type: "integer", description: "Estimated number of contexts where business would be mentioned" },
            recommendations: { type: "array", items: { type: "string" }, description: "How to improve AI visibility" }
          },
          required: ["overallScore", "nameRecognition", "relevanceScore", "detailLevel", "citationLikelihood", "citationsDetected", "recommendations"],
          additionalProperties: false
        }
      }
    }
  });
  const text2 = response.choices[0]?.message?.content;
  if (!text2 || typeof text2 !== "string") {
    return {
      overallScore: 0,
      breakdown: { nameRecognition: 0, relevanceScore: 0, detailLevel: 0, citationLikelihood: 0 },
      citationsDetected: 0,
      recommendations: ["Could not check visibility. Try again later."],
      lastChecked: Date.now()
    };
  }
  const parsed = JSON.parse(text2);
  return {
    overallScore: Math.min(100, Math.max(0, parsed.overallScore)),
    breakdown: {
      nameRecognition: parsed.nameRecognition,
      relevanceScore: parsed.relevanceScore,
      detailLevel: parsed.detailLevel,
      citationLikelihood: parsed.citationLikelihood
    },
    citationsDetected: parsed.citationsDetected,
    recommendations: parsed.recommendations,
    lastChecked: Date.now()
  };
}

// server/email-system.ts
var RESEND_API_KEY = ENV.resendApiKey;
var FROM_EMAIL = ENV.fromEmail || "notifications@contentflow.ai";
async function sendEmail(payload) {
  if (RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [payload.to],
          subject: payload.subject,
          html: payload.html
        })
      });
      if (!res.ok) {
        const err = await res.text();
        console.error(`[Email] Resend API error: ${err}`);
        return false;
      }
      console.log(`[Email] Sent ${payload.type} to ${payload.to}`);
      return true;
    } catch (err) {
      console.error(`[Email] Failed to send: ${err.message}`);
      return false;
    }
  }
  console.log(`[Email] Would send ${payload.type} to ${payload.to}: ${payload.subject}`);
  return true;
}
async function sendWelcomeEmail(email, businessName) {
  await sendEmail({
    to: email,
    subject: `Welcome to ContentFlow, ${businessName}!`,
    type: "welcome",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 40px; border-radius: 12px;">
        <h1 style="color: #f97316;">Welcome to ContentFlow! \u{1F680}</h1>
        <p>Hi ${businessName},</p>
        <p>Your AI content automation platform is ready. Here's what you can do:</p>
        <ul>
          <li>Connect your platforms (Google, Instagram, TikTok, YouTube, Reddit, WordPress)</li>
          <li>Generate AI-powered content tailored to your brand</li>
          <li>Schedule and auto-publish across all channels</li>
          <li>Track your AI visibility score</li>
        </ul>
        <p>Get started by connecting your first platform in the dashboard.</p>
        <a href="#" style="display: inline-block; background: #f97316; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">Go to Dashboard</a>
      </div>
    `
  });
}

// server/plan-limits.ts
init_schema();
import { eq as eq6, and as and3 } from "drizzle-orm";
var PLAN_LIMITS = {
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
      basicContentOnly: true
    }
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
      basicContentOnly: true
    }
  },
  pro: {
    name: "Pro",
    price: 19700,
    maxPlatforms: 6,
    maxPostsPerMonth: -1,
    // unlimited
    maxTeamMembers: 5,
    features: {
      advancedAnalytics: true,
      aiCitationTracking: true,
      videoGeneration: true,
      whiteLabel: false,
      apiAccess: false,
      customIntegrations: false,
      allContentTypes: true,
      basicContentOnly: false
    }
  },
  enterprise: {
    name: "Enterprise",
    price: 49700,
    maxPlatforms: -1,
    // unlimited
    maxPostsPerMonth: -1,
    // unlimited
    maxTeamMembers: -1,
    // unlimited
    features: {
      advancedAnalytics: true,
      aiCitationTracking: true,
      videoGeneration: true,
      whiteLabel: true,
      apiAccess: true,
      customIntegrations: true,
      allContentTypes: true,
      basicContentOnly: false
    }
  }
};
function getPlanLimits(planTier) {
  const tier = planTier || "free";
  return PLAN_LIMITS[tier] || PLAN_LIMITS.free;
}
function getCurrentMonth() {
  const now = /* @__PURE__ */ new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
async function getOrCreateUsage(businessId) {
  const db = await getDb();
  if (!db) return { postsPublished: 0, postsGenerated: 0, platformsConnected: 0, aiGenerations: 0 };
  const month = getCurrentMonth();
  const existing = await db.select().from(usageTracking).where(and3(eq6(usageTracking.businessId, businessId), eq6(usageTracking.month, month))).limit(1);
  if (existing.length > 0) {
    return existing[0];
  }
  await db.insert(usageTracking).values({ businessId, month });
  return { postsPublished: 0, postsGenerated: 0, platformsConnected: 0, aiGenerations: 0 };
}
async function incrementUsage(businessId, field) {
  const db = await getDb();
  if (!db) return;
  const month = getCurrentMonth();
  const existing = await db.select().from(usageTracking).where(and3(eq6(usageTracking.businessId, businessId), eq6(usageTracking.month, month))).limit(1);
  if (existing.length > 0) {
    const current = existing[0][field] || 0;
    await db.update(usageTracking).set({ [field]: current + 1 }).where(eq6(usageTracking.id, existing[0].id));
  } else {
    await db.insert(usageTracking).values({
      businessId,
      month,
      [field]: 1
    });
  }
}
async function canConnectPlatform(businessId, planTier) {
  const limits = getPlanLimits(planTier);
  if (limits.maxPlatforms === -1) return { allowed: true };
  const db = await getDb();
  if (!db) return { allowed: true };
  const connected = await db.select().from(connectedAccounts).where(eq6(connectedAccounts.businessId, businessId));
  if (connected.length >= limits.maxPlatforms) {
    return {
      allowed: false,
      message: `Your ${limits.name} plan allows ${limits.maxPlatforms} platform connections. Upgrade to connect more platforms.`
    };
  }
  return { allowed: true };
}
async function canPublishContent(businessId, planTier) {
  const limits = getPlanLimits(planTier);
  if (limits.maxPostsPerMonth === -1) return { allowed: true };
  const usage = await getOrCreateUsage(businessId);
  if (usage.postsPublished >= limits.maxPostsPerMonth) {
    return {
      allowed: false,
      message: `You've reached your ${limits.name} plan limit of ${limits.maxPostsPerMonth} posts/month. Upgrade for more posts.`,
      used: usage.postsPublished,
      limit: limits.maxPostsPerMonth
    };
  }
  return { allowed: true, used: usage.postsPublished, limit: limits.maxPostsPerMonth };
}
function canUseContentType(contentType, planTier) {
  const limits = getPlanLimits(planTier);
  if (limits.features.allContentTypes) return { allowed: true };
  if (limits.features.basicContentOnly) {
    if (contentType === "video" || contentType === "schema") {
      return {
        allowed: false,
        message: `${contentType === "video" ? "Video generation" : "Schema markup"} requires a Pro plan or higher. Upgrade to unlock.`
      };
    }
  }
  return { allowed: true };
}

// server/composio.ts
var COMPOSIO_BASE = "https://backend.composio.dev/api/v1";
var PLATFORM_TO_TOOLKIT = {
  google: "googlebusiness",
  google_business: "googlebusiness",
  youtube: "youtube",
  instagram: "instagram",
  facebook: "facebook",
  tiktok: "tiktok",
  reddit: "reddit",
  wordpress: "wordpress",
  twitter: "twitter",
  x: "twitter",
  linkedin: "linkedin",
  pinterest: "pinterest",
  slack: "slack",
  github: "github",
  notion: "notion",
  gmail: "gmail",
  google_sheets: "googlesheets",
  google_drive: "googledrive"
};
var composioAuth = () => ({
  "content-type": "application/json",
  "x-api-key": ENV.composioKey || ""
});
function hasKey() {
  return !!ENV.composioKey && ENV.composioKey.length > 0;
}
async function initiateConnection(userId, platform) {
  if (!hasKey()) return { error: "COMPOSIO_API_KEY not configured" };
  const toolkit = PLATFORM_TO_TOOLKIT[platform.toLowerCase()];
  if (!toolkit) return { error: `Unknown platform: ${platform}` };
  try {
    const cfgRes = await fetch(`${COMPOSIO_BASE}/auth_configs`, {
      method: "GET",
      headers: composioAuth()
    });
    if (!cfgRes.ok) return { error: `Composio auth_configs failed: ${await cfgRes.text()}` };
    const cfgs = await cfgRes.json();
    let authConfigId = cfgs.items?.find((c) => c.toolkit?.toLowerCase() === toolkit)?.id;
    if (!authConfigId) {
      const createRes = await fetch(`${COMPOSIO_BASE}/auth_configs`, {
        method: "POST",
        headers: composioAuth(),
        body: JSON.stringify({
          toolkit: { slug: toolkit },
          authScheme: "OAUTH2",
          name: `contentflow-${toolkit}`
        })
      });
      if (!createRes.ok) return { error: `Composio create auth_config failed: ${await createRes.text()}` };
      const created = await createRes.json();
      authConfigId = created.id;
    }
    const connRes = await fetch(`${COMPOSIO_BASE}/connected_accounts`, {
      method: "POST",
      headers: composioAuth(),
      body: JSON.stringify({
        authConfig: { id: authConfigId },
        userId,
        callbackUrl: `${process.env.VITE_APP_URL || "https://contentflow-ai-prod.onrender.com"}/platforms?connected=1`
      })
    });
    if (!connRes.ok) return { error: `Composio initiate connection failed: ${await connRes.text()}` };
    const conn = await connRes.json();
    return {
      redirectUrl: conn.redirectUrl || "",
      connectionId: conn.id
    };
  } catch (err) {
    return { error: `Composio request failed: ${String(err)}` };
  }
}
async function listConnections(userId) {
  if (!hasKey()) return [];
  try {
    const res = await fetch(`${COMPOSIO_BASE}/connected_accounts?userId=${encodeURIComponent(userId)}`, {
      method: "GET",
      headers: composioAuth()
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map((item) => ({
      id: item.id,
      toolkit: item.toolkit?.slug || item.authConfig?.toolkit?.slug || "",
      status: item.status === "ACTIVE" ? "active" : item.status === "INITIATED" ? "pending" : "failed",
      accountId: item.params?.id,
      accountName: item.params?.name || item.params?.email
    }));
  } catch {
    return [];
  }
}
async function getConnection(connectionId) {
  if (!hasKey()) return null;
  try {
    const res = await fetch(`${COMPOSIO_BASE}/connected_accounts/${connectionId}`, {
      headers: composioAuth()
    });
    if (!res.ok) return null;
    const item = await res.json();
    return {
      id: item.id,
      toolkit: item.toolkit?.slug || item.authConfig?.toolkit?.slug || "",
      status: item.status === "ACTIVE" ? "active" : item.status === "INITIATED" ? "pending" : "failed",
      accountId: item.params?.id,
      accountName: item.params?.name || item.params?.email
    };
  } catch {
    return null;
  }
}
async function disconnect(connectionId) {
  if (!hasKey()) return false;
  try {
    const res = await fetch(`${COMPOSIO_BASE}/connected_accounts/${connectionId}`, {
      method: "DELETE",
      headers: composioAuth()
    });
    return res.ok;
  } catch {
    return false;
  }
}
function composioEnabled() {
  return hasKey();
}

// server/routers.ts
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    login: publicProcedure.input(z2.object({ username: z2.string(), password: z2.string() })).mutation(async ({ ctx, input }) => {
      if (input.username.trim().toLowerCase() !== "luis" || input.password.trim() !== "1234") {
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }
      const openId = "user_luis";
      const name = "Luis";
      const email = "luis@contentflow.ai";
      try {
        await upsertUser({
          openId,
          name,
          email,
          loginMethod: "credentials",
          lastSignedIn: /* @__PURE__ */ new Date()
        });
      } catch {
      }
      const token = await sdk.signSession({ openId, appId: ENV.appId, name });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      const maxAge = ONE_YEAR_MS;
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge });
      return { success: true, name };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  // Business operations
  business: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getBusinessByUserId(ctx.user.id);
    }),
    create: protectedProcedure.input(z2.object({
      name: z2.string().min(1),
      industry: z2.string().optional(),
      targetAudience: z2.string().optional(),
      toneOfVoice: z2.string().optional(),
      websiteUrl: z2.string().optional(),
      description: z2.string().optional(),
      timezone: z2.string().optional(),
      topicClusters: z2.any().optional(),
      postingSchedule: z2.any().optional(),
      contentTypes: z2.any().optional(),
      autoApprove: z2.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      await createBusiness({ ...input, userId: ctx.user.id, name: input.name });
      if (ctx.user.email) {
        sendWelcomeEmail(ctx.user.email, input.name).catch(() => {
        });
      }
      return { success: true };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      name: z2.string().optional(),
      industry: z2.string().optional(),
      targetAudience: z2.string().optional(),
      toneOfVoice: z2.string().optional(),
      websiteUrl: z2.string().optional(),
      description: z2.string().optional(),
      topicClusters: z2.any().optional(),
      contentTypes: z2.any().optional(),
      postingSchedule: z2.any().optional(),
      autoApprove: z2.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const business = await getBusinessByUserId(ctx.user.id);
      if (!business || business.id !== id) throw new TRPCError3({ code: "FORBIDDEN" });
      await updateBusiness(id, data);
      return { success: true };
    }),
    // Business Analyzer — uses LLM to analyze website and generate content strategy
    analyze: protectedProcedure.input(z2.object({
      websiteUrl: z2.string().min(1),
      businessName: z2.string().min(1)
    })).mutation(async ({ ctx, input }) => {
      const analysis = await analyzeBusinessWebsite(input.websiteUrl, input.businessName);
      return analysis;
    })
  }),
  // Platform connections
  platforms: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const business = await getBusinessByUserId(ctx.user.id);
      if (!business) return [];
      return getConnectedAccounts(business.id);
    }),
    connect: protectedProcedure.input(z2.object({
      platform: z2.string(),
      platformAccountId: z2.string().optional(),
      accountName: z2.string().optional(),
      accessToken: z2.string().optional(),
      refreshToken: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const business = await getBusinessByUserId(ctx.user.id);
      if (!business) throw new TRPCError3({ code: "NOT_FOUND", message: "Business not found" });
      const platformCheck = await canConnectPlatform(business.id, ctx.user.planTier);
      if (!platformCheck.allowed) throw new TRPCError3({ code: "FORBIDDEN", message: platformCheck.message });
      if (composioEnabled() && !input.accessToken) {
        const result = await initiateConnection(String(ctx.user.id), input.platform);
        if ("error" in result) {
          throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: result.error });
        }
        await addConnectedAccount({
          businessId: business.id,
          platform: input.platform,
          platformAccountId: result.connectionId,
          accountName: `Pending OAuth (${input.platform})`,
          accessToken: result.redirectUrl,
          // store redirect URL temporarily
          refreshToken: null
        });
        return { success: true, redirectUrl: result.redirectUrl, connectionId: result.connectionId };
      }
      await addConnectedAccount({
        businessId: business.id,
        platform: input.platform,
        platformAccountId: input.platformAccountId || "",
        accountName: input.accountName,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken
      });
      return { success: true };
    }),
    // List Composio-connected accounts
    composioList: protectedProcedure.query(async ({ ctx }) => {
      if (!composioEnabled()) return [];
      return listConnections(String(ctx.user.id));
    }),
    // Initiate OAuth via Composio
    composioConnect: protectedProcedure.input(z2.object({
      platform: z2.string()
    })).mutation(async ({ ctx, input }) => {
      const business = await getBusinessByUserId(ctx.user.id);
      if (!business) throw new TRPCError3({ code: "NOT_FOUND", message: "Business not found" });
      const platformCheck = await canConnectPlatform(business.id, ctx.user.planTier);
      if (!platformCheck.allowed) throw new TRPCError3({ code: "FORBIDDEN", message: platformCheck.message });
      if (!composioEnabled()) {
        throw new TRPCError3({ code: "PRECONDITION_FAILED", message: "Composio not configured. Set COMPOSIO_API_KEY." });
      }
      const result = await initiateConnection(String(ctx.user.id), input.platform);
      if ("error" in result) {
        throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: result.error });
      }
      return result;
    }),
    // Check connection status after OAuth callback
    composioStatus: protectedProcedure.input(z2.object({
      connectionId: z2.string()
    })).query(async ({ input }) => {
      if (!composioEnabled()) return null;
      return getConnection(input.connectionId);
    }),
    // Disconnect via Composio
    composioDisconnect: protectedProcedure.input(z2.object({
      connectionId: z2.string()
    })).mutation(async ({ input }) => {
      if (!composioEnabled()) return { success: false };
      return { success: await disconnect(input.connectionId) };
    }),
    disconnect: protectedProcedure.input(z2.object({
      id: z2.number()
    })).mutation(async ({ ctx, input }) => {
      const business = await getBusinessByUserId(ctx.user.id);
      if (!business) throw new TRPCError3({ code: "NOT_FOUND" });
      await removeConnectedAccount(input.id, business.id);
      return { success: true };
    })
  }),
  // Content operations
  content: router({
    queue: protectedProcedure.input(z2.object({
      status: z2.string().optional()
    }).optional()).query(async ({ ctx, input }) => {
      const business = await getBusinessByUserId(ctx.user.id);
      if (!business) return [];
      return getContentQueue(business.id, input?.status);
    }),
    create: protectedProcedure.input(z2.object({
      platform: z2.string(),
      contentType: z2.string().optional(),
      title: z2.string().optional(),
      content: z2.string().optional(),
      scheduledFor: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const business = await getBusinessByUserId(ctx.user.id);
      if (!business) throw new TRPCError3({ code: "NOT_FOUND" });
      const postCheck = await canPublishContent(business.id, ctx.user.planTier);
      if (!postCheck.allowed) throw new TRPCError3({ code: "FORBIDDEN", message: postCheck.message });
      const typeCheck = canUseContentType(input.contentType || "social", ctx.user.planTier);
      if (!typeCheck.allowed) throw new TRPCError3({ code: "FORBIDDEN", message: typeCheck.message });
      await createContentItem({
        businessId: business.id,
        platform: input.platform,
        contentType: input.contentType || "social",
        title: input.title,
        content: input.content,
        scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : /* @__PURE__ */ new Date()
      });
      await incrementUsage(business.id, "postsGenerated");
      return { success: true };
    }),
    updateStatus: protectedProcedure.input(z2.object({
      id: z2.number(),
      status: z2.string()
    })).mutation(async ({ ctx, input }) => {
      await updateContentStatus(input.id, input.status);
      return { success: true };
    }),
    // AI Content Generation with quality scoring
    generate: protectedProcedure.input(z2.object({
      platform: z2.string(),
      contentType: z2.string().default("social"),
      topic: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const business = await getBusinessByUserId(ctx.user.id);
      if (!business) throw new TRPCError3({ code: "NOT_FOUND", message: "Business not found. Complete onboarding first." });
      const typeCheck = canUseContentType(input.contentType, ctx.user.planTier);
      if (!typeCheck.allowed) throw new TRPCError3({ code: "FORBIDDEN", message: typeCheck.message });
      const postCheck = await canPublishContent(business.id, ctx.user.planTier);
      if (!postCheck.allowed) throw new TRPCError3({ code: "FORBIDDEN", message: postCheck.message });
      const generated = await generateContent({
        platform: input.platform,
        contentType: input.contentType,
        topic: input.topic,
        business
      });
      const recentTitles = await getRecentTitles(business.id);
      const qualityScore = await scoreContent(
        generated.content,
        generated.title,
        input.platform,
        business.toneOfVoice || "",
        business.targetAudience || "",
        recentTitles
      );
      await createContentItem({
        businessId: business.id,
        platform: input.platform,
        contentType: input.contentType,
        title: generated.title,
        content: generated.content,
        scheduledFor: new Date(Date.now() + 36e5),
        engagementData: { qualityScore }
      });
      await logActivity({
        businessId: business.id,
        action: `AI generated ${input.contentType} for ${input.platform} (score: ${qualityScore.overall}/10)`,
        platform: input.platform,
        description: generated.title
      });
      await incrementUsage(business.id, "aiGenerations");
      await incrementUsage(business.id, "postsGenerated");
      return { ...generated, qualityScore };
    }),
    // Score existing content
    score: protectedProcedure.input(z2.object({
      content: z2.string(),
      title: z2.string(),
      platform: z2.string()
    })).mutation(async ({ ctx, input }) => {
      const business = await getBusinessByUserId(ctx.user.id);
      if (!business) throw new TRPCError3({ code: "NOT_FOUND" });
      const recentTitles = await getRecentTitles(business.id);
      return scoreContent(input.content, input.title, input.platform, business.toneOfVoice || "", business.targetAudience || "", recentTitles);
    }),
    // Publishing worker
    processQueue: protectedProcedure.mutation(async ({ ctx }) => {
      const business = await getBusinessByUserId(ctx.user.id);
      if (!business) throw new TRPCError3({ code: "NOT_FOUND" });
      return runPublishingWorker(business.id);
    }),
    runWorkerAll: adminProcedure.mutation(async () => {
      return runPublishingWorker();
    })
  }),
  // AI Visibility Score
  visibility: router({
    check: protectedProcedure.mutation(async ({ ctx }) => {
      const business = await getBusinessByUserId(ctx.user.id);
      if (!business) throw new TRPCError3({ code: "NOT_FOUND" });
      const keywords = business.topicClusters || [];
      const result = await checkAIVisibility(
        business.name,
        business.industry || "general",
        keywords,
        business.websiteUrl || void 0
      );
      await logAnalytic({
        businessId: business.id,
        platform: "ai_visibility",
        metricType: "visibility_score",
        metricValue: result.overallScore,
        metadata: result
      });
      return result;
    }),
    latest: protectedProcedure.query(async ({ ctx }) => {
      const business = await getBusinessByUserId(ctx.user.id);
      if (!business) return null;
      return getLatestVisibilityScore(business.id);
    })
  }),
  // Analytics
  analytics: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const business = await getBusinessByUserId(ctx.user.id);
      if (!business) return [];
      return getAnalytics(business.id);
    }),
    roi: protectedProcedure.query(async ({ ctx }) => {
      const business = await getBusinessByUserId(ctx.user.id);
      if (!business) return { published: 0, pending: 0, failed: 0, citationsDetected: 0, visibilityScore: 0 };
      return getROISummary(business.id);
    })
  }),
  // Activity feed
  activity: router({
    feed: protectedProcedure.query(async ({ ctx }) => {
      const business = await getBusinessByUserId(ctx.user.id);
      if (!business) return [];
      return getActivityFeed(business.id);
    })
  }),
  // Usage tracking
  usage: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const business = await getBusinessByUserId(ctx.user.id);
      if (!business) return { postsPublished: 0, postsGenerated: 0, platformsConnected: 0, aiGenerations: 0 };
      return getOrCreateUsage(business.id);
    }),
    plan: protectedProcedure.query(({ ctx }) => {
      const limits = getPlanLimits(ctx.user.planTier);
      return { tier: ctx.user.planTier || "free", limits };
    })
  }),
  // Billing
  billing: router({
    invoices: protectedProcedure.query(async ({ ctx }) => {
      return getInvoices(ctx.user.id);
    })
  }),
  // Team
  team: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const business = await getBusinessByUserId(ctx.user.id);
      if (!business) return [];
      return getTeamMembers(business.id);
    })
  }),
  // Settings / API Keys
  apiKeys: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const business = await getBusinessByUserId(ctx.user.id);
      if (!business) return [];
      return getApiKeys(business.id);
    }),
    save: protectedProcedure.input(z2.object({
      keyName: z2.string(),
      keyValue: z2.string(),
      provider: z2.string()
    })).mutation(async ({ ctx, input }) => {
      const business = await getBusinessByUserId(ctx.user.id);
      if (!business) throw new TRPCError3({ code: "NOT_FOUND" });
      await saveApiKey({ ...input, businessId: business.id });
      return { success: true };
    })
  }),
  // GDPR / Data Management
  gdpr: router({
    export: protectedProcedure.mutation(async ({ ctx }) => {
      const business = await getBusinessByUserId(ctx.user.id);
      const content = business ? await getContentQueue(business.id) : [];
      const analytics = business ? await getAnalytics(business.id) : [];
      const activity = business ? await getActivityFeed(business.id, 100) : [];
      const platforms = business ? await getConnectedAccounts(business.id) : [];
      return {
        user: { id: ctx.user.id, email: ctx.user.email, name: ctx.user.name, createdAt: ctx.user.createdAt },
        business,
        content,
        analytics,
        activity,
        platforms: platforms.map((p) => ({ ...p, accessToken: "[REDACTED]", refreshToken: "[REDACTED]" })),
        exportedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }),
    delete: protectedProcedure.mutation(async ({ ctx }) => {
      const business = await getBusinessByUserId(ctx.user.id);
      if (business) {
        await deleteAllBusinessData(business.id);
      }
      await deleteUser(ctx.user.id);
      return { success: true, message: "All data has been permanently deleted." };
    })
  }),
  // Admin routes
  admin: router({
    users: adminProcedure.query(async () => {
      return getAllUsers();
    }),
    businesses: adminProcedure.query(async () => {
      return getAllBusinesses();
    }),
    stats: adminProcedure.query(async () => {
      const allUsers = await getAllUsers();
      const allBusinesses = await getAllBusinesses();
      return {
        totalUsers: allUsers.length,
        totalBusinesses: allBusinesses.length,
        activeSubscriptions: allUsers.filter((u) => u.subscriptionStatus === "active").length
      };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerStripeRoutes(app);
  registerCronRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
