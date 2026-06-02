/**
 * ContentFlow AI — Automated Publishing Worker
 *
 * This module handles the core automation engine:
 * 1. Pulls queued content items that are due for publishing
 * 2. Generates AI content if the body is empty
 * 3. Simulates publishing to each platform (real API calls require OAuth tokens)
 * 4. Updates status, logs activity, and records analytics
 *
 * In production, replace the platform stubs with real API calls:
 *   - Google Business: Google My Business API v4
 *   - Instagram/Facebook: Meta Graph API
 *   - TikTok: TikTok for Business API
 *   - YouTube: YouTube Data API v3
 *   - Reddit: Reddit OAuth2 + /api/submit
 *   - WordPress: XML-RPC or REST API (/wp-json/wp/v2/posts)
 */

import { getDb } from "./db";
import { generateContent } from "./ai-content";
import { contentQueue, businesses, connectedAccounts, activityFeed, analyticsLogs } from "../drizzle/schema";
import { eq, and, lte } from "drizzle-orm";

export type WorkerResult = {
  processed: number;
  failed: number;
  skipped: number;
  errors: string[];
};

/**
 * Platform publisher stubs.
 * Each returns true on success, throws on failure.
 * Replace with real API calls once OAuth tokens are stored.
 */
const platformPublishers: Record<string, (content: string, title: string, accessToken?: string) => Promise<boolean>> = {
  google: async (content, title, token) => {
    if (!token) throw new Error("Google Business: No access token. Connect your Google account in Platforms.");
    // Real: POST https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/localPosts
    console.log(`[Worker] Google Business: Publishing "${title}"`);
    return true;
  },
  instagram: async (content, title, token) => {
    if (!token) throw new Error("Instagram: No access token. Connect your Meta account in Platforms.");
    // Real: POST https://graph.facebook.com/v18.0/{ig-user-id}/media + /media_publish
    console.log(`[Worker] Instagram: Publishing "${title}"`);
    return true;
  },
  facebook: async (content, title, token) => {
    if (!token) throw new Error("Facebook: No access token. Connect your Meta account in Platforms.");
    // Real: POST https://graph.facebook.com/v18.0/{page-id}/feed
    console.log(`[Worker] Facebook: Publishing "${title}"`);
    return true;
  },
  tiktok: async (content, title, token) => {
    if (!token) throw new Error("TikTok: No access token. Connect your TikTok account in Platforms.");
    // Real: POST https://open.tiktokapis.com/v2/post/publish/video/init/
    console.log(`[Worker] TikTok: Publishing "${title}"`);
    return true;
  },
  youtube: async (content, title, token) => {
    if (!token) throw new Error("YouTube: No access token. Connect your Google account in Platforms.");
    // Real: POST https://www.googleapis.com/upload/youtube/v3/videos
    console.log(`[Worker] YouTube: Publishing "${title}"`);
    return true;
  },
  reddit: async (content, title, token) => {
    if (!token) throw new Error("Reddit: No access token. Connect your Reddit account in Platforms.");
    // Real: POST https://oauth.reddit.com/api/submit
    console.log(`[Worker] Reddit: Publishing "${title}"`);
    return true;
  },
  wordpress: async (content, title, token) => {
    if (!token) throw new Error("WordPress: No credentials. Add your WordPress site in Platforms.");
    // Real: POST https://{site}/wp-json/wp/v2/posts with Basic Auth or Application Password
    console.log(`[Worker] WordPress: Publishing "${title}"`);
    return true;
  },
};

/**
 * Main worker function — processes all due content items across all businesses.
 * Called by the tRPC processQueue mutation or can be triggered by a heartbeat job.
 */
export async function runPublishingWorker(businessId?: number): Promise<WorkerResult> {
  const db = await getDb();
  if (!db) {
    return { processed: 0, failed: 0, skipped: 0, errors: ["Database not available"] };
  }

  const result: WorkerResult = { processed: 0, failed: 0, skipped: 0, errors: [] };
  const now = new Date();

  // Fetch pending items due for publishing
  const conditions = [
    eq(contentQueue.status, "pending"),
    lte(contentQueue.scheduledFor, now),
  ];
  if (businessId) {
    conditions.push(eq(contentQueue.businessId, businessId));
  }

  const pendingItems = await db
    .select()
    .from(contentQueue)
    .where(and(...conditions))
    .limit(50); // Process max 50 at a time to avoid timeout

  console.log(`[Worker] Found ${pendingItems.length} items due for publishing`);

  for (const item of pendingItems) {
    try {
      // Get the business for this item
      const [business] = await db
        .select()
        .from(businesses)
        .where(eq(businesses.id, item.businessId))
        .limit(1);

      if (!business) {
        await db.update(contentQueue).set({ status: "failed", errorLog: "Business not found" }).where(eq(contentQueue.id, item.id));
        result.failed++;
        result.errors.push(`Item ${item.id}: Business not found`);
        continue;
      }

      // Generate content if empty
      let finalContent = item.content;
      let finalTitle = item.title;

      if (!finalContent) {
        console.log(`[Worker] Generating content for item ${item.id} (${item.platform}/${item.contentType})`);
        const generated = await generateContent({
          platform: item.platform,
          contentType: item.contentType || "social",
          topic: item.title || undefined,
          business,
        });
        finalContent = generated.content;
        finalTitle = generated.title;
        // Update the item with generated content
        await db.update(contentQueue).set({
          content: finalContent,
          title: finalTitle,
        }).where(eq(contentQueue.id, item.id));
      }

      // Get the access token for this platform
      const [account] = await db
        .select()
        .from(connectedAccounts)
        .where(and(
          eq(connectedAccounts.businessId, item.businessId),
          eq(connectedAccounts.platform, item.platform),
          eq(connectedAccounts.status, "active"),
        ))
        .limit(1);

      const accessToken = account?.accessToken || undefined;

      // Attempt to publish
      const publisher = platformPublishers[item.platform];
      if (!publisher) {
        await db.update(contentQueue).set({
          status: "failed",
          errorLog: `No publisher configured for platform: ${item.platform}`,
        }).where(eq(contentQueue.id, item.id));
        result.failed++;
        result.errors.push(`Item ${item.id}: No publisher for ${item.platform}`);
        continue;
      }

      await publisher(finalContent || "", finalTitle || "", accessToken);

      // Mark as published
      await db.update(contentQueue).set({
        status: "published",
        publishedAt: new Date(),
      }).where(eq(contentQueue.id, item.id));

      // Log activity
      await db.insert(activityFeed).values({
        businessId: item.businessId,
        action: `Published to ${item.platform}`,
        platform: item.platform,
        description: finalTitle || "Content published",
      });

      // Record analytics
      await db.insert(analyticsLogs).values({
        businessId: item.businessId,
        platform: item.platform,
        metricType: "post_published",
        metricValue: 1,
        metadata: { contentType: item.contentType, title: finalTitle },
      });

      result.processed++;
    } catch (err: any) {
      const errorMsg = err?.message || "Unknown error";
      console.error(`[Worker] Failed to publish item ${item.id}:`, errorMsg);

      // Increment retry count
      const newRetryCount = (item.retryCount || 0) + 1;
      const newStatus = newRetryCount >= 3 ? "failed" : "pending";

      await db.update(contentQueue).set({
        status: newStatus,
        errorLog: errorMsg,
        retryCount: newRetryCount,
      }).where(eq(contentQueue.id, item.id));

      if (newStatus === "failed") {
        result.failed++;
        result.errors.push(`Item ${item.id} (${item.platform}): ${errorMsg}`);
      } else {
        result.skipped++; // Will retry
      }
    }
  }

  console.log(`[Worker] Complete: ${result.processed} published, ${result.failed} failed, ${result.skipped} retrying`);
  return result;
}
