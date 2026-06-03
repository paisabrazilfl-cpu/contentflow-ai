/**
 * Scheduling Engine
 * 
 * Provides:
 * - /api/cron/publish endpoint callable by external cron/heartbeat
 * - Auto-generates content if queue is empty based on schedule
 * - Publishes due items for all businesses with auto-publish enabled
 */

import { getDb } from "./db";
import { businesses, contentQueue } from "../drizzle/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import { generateContent } from "./ai-content";
import { runPublishingWorker } from "./publishing-worker";
import type { Express, Request, Response } from "express";

export type CronResult = {
  businessesProcessed: number;
  contentGenerated: number;
  contentPublished: number;
  errors: string[];
};

/**
 * Main cron job: for each business with auto-approve enabled,
 * check schedule, generate content if needed, publish due items.
 */
export async function runScheduledPublishing(): Promise<CronResult> {
  const db = await getDb();
  if (!db) return { businessesProcessed: 0, contentGenerated: 0, contentPublished: 0, errors: ["DB unavailable"] };

  const result: CronResult = { businessesProcessed: 0, contentGenerated: 0, contentPublished: 0, errors: [] };

  // Get all businesses with auto-approve enabled
  const autoPublishBusinesses = await db
    .select()
    .from(businesses)
    .where(eq(businesses.autoApprove, true));

  console.log(`[Scheduler] Found ${autoPublishBusinesses.length} businesses with auto-publish`);

  for (const business of autoPublishBusinesses) {
    try {
      // Check if queue has pending items for this business
      const pendingCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(contentQueue)
        .where(and(
          eq(contentQueue.businessId, business.id),
          eq(contentQueue.status, "pending")
        ));

      const pending = pendingCount[0]?.count || 0;

      // If queue is empty, generate content based on schedule
      if (pending === 0) {
        const schedule = (business.postingSchedule as any[]) || [];
        const topicClusters = (business.topicClusters as string[]) || [];

        // Generate one piece of content for the highest-priority platform
        if (schedule.length > 0) {
          const topPlatform = schedule.sort((a: any, b: any) => (a.priority || 99) - (b.priority || 99))[0];
          const randomTopic = topicClusters.length > 0
            ? topicClusters[Math.floor(Math.random() * topicClusters.length)]
            : undefined;

          try {
            const generated = await generateContent({
              platform: topPlatform.platform?.toLowerCase().replace(/\s+/g, "") || "google",
              contentType: "social",
              topic: randomTopic,
              business,
            });

            await db.insert(contentQueue).values({
              businessId: business.id,
              platform: topPlatform.platform?.toLowerCase().replace(/\s+/g, "") || "google",
              contentType: "social",
              title: generated.title,
              content: generated.content,
              scheduledFor: new Date(), // Publish immediately
              status: "pending",
            });

            result.contentGenerated++;
          } catch (genErr: any) {
            result.errors.push(`Business ${business.id} generation: ${genErr.message}`);
          }
        }
      }

      // Run the publishing worker for this business
      const workerResult = await runPublishingWorker(business.id);
      result.contentPublished += workerResult.processed;
      if (workerResult.errors.length > 0) {
        result.errors.push(...workerResult.errors);
      }

      result.businessesProcessed++;
    } catch (err: any) {
      result.errors.push(`Business ${business.id}: ${err.message}`);
    }
  }

  console.log(`[Scheduler] Done: ${result.businessesProcessed} businesses, ${result.contentGenerated} generated, ${result.contentPublished} published`);
  return result;
}

/**
 * Register the cron endpoint
 */
export function registerCronRoutes(app: Express) {
  app.post("/api/cron/publish", async (req: Request, res: Response) => {
    // Optional: verify a secret token for security
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const result = await runScheduledPublishing();
      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error("[Cron] Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Also support GET for simple webhook/heartbeat triggers
  app.get("/api/cron/publish", async (req: Request, res: Response) => {
    const token = req.query.token as string;
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && token !== cronSecret) {
      res.status(401).json({ error: "Unauthorized. Pass ?token=YOUR_CRON_SECRET" });
      return;
    }

    try {
      const result = await runScheduledPublishing();
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
