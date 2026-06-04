/**
 * Publishing worker — runs every 5 minutes to process the content_queue.
 * Uses node-cron for scheduling.
 */
import cron from "node-cron";
import { getPendingQueueItems } from "../db";
import { publishQueueItem } from "./publisher";

let isRunning = false;

export async function runPublishingWorker(): Promise<void> {
  if (isRunning) {
    console.log("[Worker] Publishing worker already running, skipping this tick");
    return;
  }
  isRunning = true;
  try {
    const items = await getPendingQueueItems();
    if (items.length === 0) return;
    console.log(`[Worker] Processing ${items.length} queued item(s)`);
    await Promise.allSettled(items.map((item) => publishQueueItem(item)));
  } catch (err) {
    console.error("[Worker] Publishing worker error:", err);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the cron-based publishing worker.
 * Fires every 5 minutes. Cron pattern: 0 slash5 star star star star (6-field)
 */
export function startPublishingWorker(): void {
  console.log("[Worker] Starting publishing worker — runs every 5 minutes");
  // Run once immediately on startup
  runPublishingWorker().catch(console.error);
  // Then every 5 minutes
  const cronExpr = "0 */5 * * * *";
  cron.schedule(cronExpr, () => {
    runPublishingWorker().catch(console.error);
  });
}
