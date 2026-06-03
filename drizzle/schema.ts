import {
  bigint,
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Subscriptions ────────────────────────────────────────────────────────────
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  stripePriceId: varchar("stripePriceId", { length: 128 }),
  plan: mysqlEnum("plan", ["starter", "pro", "agency", "free"]).default("free").notNull(),
  status: mysqlEnum("status", [
    "active",
    "trialing",
    "past_due",
    "canceled",
    "unpaid",
    "incomplete",
    "incomplete_expired",
    "paused",
  ]).default("active").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ─── Connected Accounts (OAuth tokens per platform per user) ─────────────────
export const connectedAccounts = mysqlTable("connected_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  platform: mysqlEnum("platform", [
    "google_youtube",
    "google_business",
    "meta_facebook",
    "meta_instagram",
    "tiktok",
    "reddit",
  ]).notNull(),
  platformUserId: varchar("platformUserId", { length: 256 }),
  platformUsername: varchar("platformUsername", { length: 256 }),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  scopes: text("scopes"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ConnectedAccount = typeof connectedAccounts.$inferSelect;
export type InsertConnectedAccount = typeof connectedAccounts.$inferInsert;

// ─── Content Queue (scheduled posts) ─────────────────────────────────────────
export const contentQueue = mysqlTable("content_queue", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  platform: mysqlEnum("platform", [
    "google_youtube",
    "google_business",
    "meta_facebook",
    "meta_instagram",
    "tiktok",
    "reddit",
  ]).notNull(),
  contentType: mysqlEnum("contentType", [
    "post",
    "video",
    "story",
    "reel",
    "community_post",
    "blog",
  ]).default("post").notNull(),
  title: varchar("title", { length: 512 }),
  body: text("body"),
  mediaUrls: json("mediaUrls"),
  metadata: json("metadata"),
  scheduledAt: timestamp("scheduledAt").notNull(),
  status: mysqlEnum("status", [
    "pending",
    "processing",
    "published",
    "failed",
    "cancelled",
  ]).default("pending").notNull(),
  publishedAt: timestamp("publishedAt"),
  errorMessage: text("errorMessage"),
  retryCount: int("retryCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentQueueItem = typeof contentQueue.$inferSelect;
export type InsertContentQueueItem = typeof contentQueue.$inferInsert;

// ─── Usage Tracking (AI generation counts) ───────────────────────────────────
export const usageTracking = mysqlTable("usage_tracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM
  generationCount: int("generationCount").default(0).notNull(),
  publishCount: int("publishCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertUsageTracking = typeof usageTracking.$inferInsert;

// ─── Brand Voice Settings ─────────────────────────────────────────────────────
export const brandVoice = mysqlTable("brand_voice", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  businessName: varchar("businessName", { length: 256 }),
  industry: varchar("industry", { length: 128 }),
  targetAudience: text("targetAudience"),
  toneKeywords: text("toneKeywords"),
  avoidKeywords: text("avoidKeywords"),
  sampleContent: text("sampleContent"),
  websiteUrl: varchar("websiteUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BrandVoice = typeof brandVoice.$inferSelect;
export type InsertBrandVoice = typeof brandVoice.$inferInsert;

// ─── Generated Content History ────────────────────────────────────────────────
export const generatedContent = mysqlTable("generated_content", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  platform: varchar("platform", { length: 64 }),
  contentType: varchar("contentType", { length: 64 }),
  prompt: text("prompt"),
  result: text("result"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GeneratedContent = typeof generatedContent.$inferSelect;
export type InsertGeneratedContent = typeof generatedContent.$inferInsert;
