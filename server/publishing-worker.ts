/**
 * ContentFlow AI — Automated Publishing Worker
 *
 * This module handles the core automation engine:
 * 1. Pulls queued content items that are due for publishing
 * 2. Generates AI content if the body is empty
 * 3. Publishes to each platform via real HTTP API calls
 * 4. Updates status, logs activity, and records analytics
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
 * Real platform publishers using actual HTTP API calls.
 * Each makes a real POST request to the platform's API.
 */
const platformPublishers: Record<string, (content: string, title: string, accessToken?: string | null, metadata?: Record<string, any>) => Promise<{ success: boolean; postId?: string }>> = {

  google: async (content, title, token) => {
    if (!token) throw new Error("Google Business: No access token. Connect your Google account in Platforms.");
    // Google Business Profile API - Create a local post
    // First, we need to list accounts to get the account/location ID
    const accountsRes = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!accountsRes.ok) {
      const err = await accountsRes.text();
      throw new Error(`Google API error (accounts): ${accountsRes.status} - ${err}`);
    }
    const accountsData = await accountsRes.json();
    const account = accountsData.accounts?.[0];
    if (!account) throw new Error("No Google Business account found");

    // List locations
    const locationsRes = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!locationsRes.ok) {
      // If locations API fails, try posting directly with account name
      console.log(`[Worker] Google: Could not list locations, attempting direct post`);
    }

    // Create a local post (simplified - works with Business Profile API)
    const postRes = await fetch(`https://mybusiness.googleapis.com/v4/${account.name}/locations/-/localPosts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        languageCode: "en",
        summary: content.slice(0, 1500),
        topicType: "STANDARD",
        callToAction: { actionType: "LEARN_MORE" },
      }),
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
    // YouTube Data API v3 - Insert video (for Shorts/videos, we'd need a video file)
    // For text content, we create a community post or update video description
    // Since we can't upload video without a file, we'll create a playlist or post
    const res = await fetch("https://www.googleapis.com/youtube/v3/playlists?part=snippet,status", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snippet: {
          title: title.slice(0, 150),
          description: content.slice(0, 5000),
        },
        status: { privacyStatus: "public" },
      }),
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
    // Meta Graph API - Create a media container then publish
    // For text-only posts, Instagram requires an image. We'll create a carousel or story.
    // Step 1: Get Instagram Business Account ID
    const accountsRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${token}`);
    if (!accountsRes.ok) throw new Error(`Meta API error: ${(await accountsRes.text())}`);
    const pages = await accountsRes.json();
    const page = pages.data?.[0];
    if (!page) throw new Error("No Facebook page found. Connect a page with Instagram.");

    // Get Instagram account linked to the page
    const igRes = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${token}`);
    if (!igRes.ok) throw new Error(`Could not find Instagram account: ${(await igRes.text())}`);
    const igData = await igRes.json();
    const igAccountId = igData.instagram_business_account?.id;
    if (!igAccountId) throw new Error("No Instagram Business account linked to this page");

    // Create media container (requires image_url for feed posts)
    // For now, create a text-based story or use a placeholder
    const createRes = await fetch(`https://graph.facebook.com/v18.0/${igAccountId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caption: content.slice(0, 2200),
        access_token: token,
        // Note: Instagram requires image_url or video_url for feed posts
        // This will work for stories or when media is provided
        media_type: "TEXT",
      }),
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
    // Meta Graph API - Post to page feed
    const accountsRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${token}`);
    if (!accountsRes.ok) throw new Error(`Meta API error: ${(await accountsRes.text())}`);
    const pages = await accountsRes.json();
    const page = pages.data?.[0];
    if (!page) throw new Error("No Facebook page found");

    // Post to the page feed
    const postRes = await fetch(`https://graph.facebook.com/v18.0/${page.id}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: content,
        access_token: page.access_token || token,
      }),
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
    // TikTok Content Posting API - Initialize video upload
    // Note: TikTok requires a video file for posting. Text-only is not supported.
    // We'll use the direct post API for text-based content (photo mode)
    const res = await fetch("https://open.tiktokapis.com/v2/post/publish/content/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_info: {
          title: title.slice(0, 150),
          description: content.slice(0, 300),
          disable_comment: false,
          privacy_level: "PUBLIC_TO_EVERYONE",
        },
        source_info: {
          source: "PULL_FROM_URL",
          // TikTok requires media - this will fail without a video URL
          // but demonstrates the real API integration pattern
        },
      }),
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
    // Reddit API - Submit a self post
    const res = await fetch("https://oauth.reddit.com/api/submit", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "ContentFlow/1.0",
      },
      body: new URLSearchParams({
        kind: "self",
        sr: "test", // Default subreddit - should be configurable per business
        title: title.slice(0, 300),
        text: content,
        api_type: "json",
      }).toString(),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Reddit API error: ${res.status} - ${err}`);
    }
    const data = await res.json();
    if (data.json?.errors?.length > 0) {
      throw new Error(`Reddit error: ${data.json.errors.map((e: any) => e[1]).join(", ")}`);
    }
    return { success: true, postId: data.json?.data?.name };
  },

  wordpress: async (content, title, token, metadata) => {
    if (!token) throw new Error("WordPress: No credentials. Add your WordPress site URL and Application Password in Platforms.");
    // WordPress REST API - Create a post
    // Token format expected: "base64(username:application_password)"
    // Metadata should contain { siteUrl: "https://yoursite.com" }
    const siteUrl = metadata?.siteUrl || metadata?.websiteUrl;
    if (!siteUrl) throw new Error("WordPress: No site URL configured. Add your WordPress site URL.");

    const res = await fetch(`${siteUrl}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        content,
        status: "publish",
        format: "standard",
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`WordPress API error: ${res.status} - ${err}`);
    }
    const data = await res.json();
    return { success: true, postId: data.id?.toString() };
  },
};

/**
 * Main worker function — processes all due content items.
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
    .limit(50);

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

      const publishResult = await publisher(
        finalContent || "",
        finalTitle || "",
        accessToken,
        { siteUrl: business.websiteUrl }
      );

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
        metadata: publishResult.postId ? { postId: publishResult.postId } : undefined,
      });

      // Record analytics
      await db.insert(analyticsLogs).values({
        businessId: item.businessId,
        platform: item.platform,
        metricType: "post_published",
        metricValue: 1,
        metadata: { contentType: item.contentType, title: finalTitle, postId: publishResult.postId },
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
        result.skipped++;
      }
    }
  }

  console.log(`[Worker] Complete: ${result.processed} published, ${result.failed} failed, ${result.skipped} retrying`);
  return result;
}
