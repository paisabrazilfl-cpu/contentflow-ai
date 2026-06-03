import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
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
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Businesses table - multi-tenant workspace
 */
export const businesses = mysqlTable("businesses", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = typeof businesses.$inferInsert;

/**
 * Connected platform accounts (OAuth tokens)
 */
export const connectedAccounts = mysqlTable("connected_accounts", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ConnectedAccount = typeof connectedAccounts.$inferSelect;
export type InsertConnectedAccount = typeof connectedAccounts.$inferInsert;

/**
 * Content queue - the state machine for scheduled posts
 */
export const contentQueue = mysqlTable("content_queue", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentItem = typeof contentQueue.$inferSelect;
export type InsertContentItem = typeof contentQueue.$inferInsert;

/**
 * Analytics logs
 */
export const analyticsLogs = mysqlTable("analytics_logs", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  platform: varchar("platform", { length: 32 }),
  metricType: varchar("metricType", { length: 64 }).notNull(),
  metricValue: int("metricValue").default(0),
  metadata: json("metadata"),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type AnalyticsLog = typeof analyticsLogs.$inferSelect;
export type InsertAnalyticsLog = typeof analyticsLogs.$inferInsert;

/**
 * Invoices / billing history
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 128 }),
  amount: int("amount").notNull(),
  currency: varchar("currency", { length: 8 }).default("usd"),
  status: varchar("status", { length: 32 }).default("paid"),
  description: varchar("description", { length: 512 }),
  invoiceUrl: text("invoiceUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Team members
 */
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  userId: int("userId"),
  email: varchar("email", { length: 320 }).notNull(),
  role: varchar("role", { length: 32 }).default("member"),
  status: varchar("status", { length: 32 }).default("pending"),
  invitedAt: timestamp("invitedAt").defaultNow().notNull(),
  joinedAt: timestamp("joinedAt"),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

/**
 * API keys stored by users
 */
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  keyName: varchar("keyName", { length: 128 }).notNull(),
  keyValue: text("keyValue").notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * Activity feed
 */
export const activityFeed = mysqlTable("activity_feed", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  action: varchar("action", { length: 128 }).notNull(),
  description: text("description"),
  platform: varchar("platform", { length: 32 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityItem = typeof activityFeed.$inferSelect;
export type InsertActivityItem = typeof activityFeed.$inferInsert;

/**
 * Usage tracking per business per month
 */
export const usageTracking = mysqlTable("usage_tracking", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM format
  postsPublished: int("postsPublished").default(0).notNull(),
  postsGenerated: int("postsGenerated").default(0).notNull(),
  platformsConnected: int("platformsConnected").default(0).notNull(),
  aiGenerations: int("aiGenerations").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UsageRecord = typeof usageTracking.$inferSelect;
export type InsertUsageRecord = typeof usageTracking.$inferInsert;
