/**
 * Observe Phase — gather system state from all subsystems
 *
 * Returns a snapshot of:
 * - LLM provider health
 * - Database connectivity
 * - Active integrations
 * - Recent errors / failures
 * - Cron job status
 * - Resource usage hints
 */

import { ENV } from "../_core/env";
import { pingProvider } from "../api-pinger";
import { Client } from "pg";
import { listProviders } from "../api-pinger";

export async function observeSystem(): Promise<{
  health: Record<string, "healthy" | "degraded" | "down" | "unknown">;
  metrics: {
    dbConnected: boolean;
    cronJobsActive: number;
    integrationsConfigured: number;
    integrationsTotal: number;
    failedJobs: number;
  };
  issues: string[];
  insights: string[];
  timestamp: number;
}> {
  const timestamp = Date.now();
  const health: Record<string, "healthy" | "degraded" | "down" | "unknown"> = {};
  const issues: string[] = [];
  const insights: string[] = [];

  // 1) DB connectivity
  let dbConnected = false;
  try {
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: false });
    await client.connect();
    await client.query("SELECT 1");
    await client.end();
    dbConnected = true;
    health.database = "healthy";
  } catch (e: any) {
    health.database = "down";
    issues.push(`Database unreachable: ${e?.message}`);
  }

  // 2) LLM providers (multi-provider fallback chain)
  const llmProviders = ["OPENAI_API_KEY", "NVIDIA_API_KEY", "ANTHROPIC_API_KEY"];
  let llmHealthyCount = 0;
  for (const p of llmProviders) {
    try {
      const r = await pingProvider(p);
      if (r.ok) {
        health[p] = "healthy";
        llmHealthyCount++;
      } else {
        health[p] = "down";
        issues.push(`LLM ${p} down: ${r.message.slice(0, 100)}`);
      }
    } catch {
      health[p] = "unknown";
    }
  }
  if (llmHealthyCount === 0) {
    issues.push("All LLM providers down — content generation will fail");
  } else if (llmHealthyCount < 2) {
    insights.push(`Only ${llmHealthyCount} LLM provider(s) available — degraded resilience`);
  }

  // 3) Cron jobs (active count + failed)
  let cronJobsActive = 0;
  let failedJobs = 0;
  if (dbConnected) {
    try {
      const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: false });
      await client.connect();
      try {
        const r = await client.query(
          `SELECT status, COUNT(*) as count FROM cron_jobs GROUP BY status`
        );
        for (const row of r.rows) {
          cronJobsActive += row.count;
          if (row.status === "paused") {
            // paused = intentional, not failed
          }
        }
        // Check for jobs that haven't run in 2x their schedule
        const failed = await client.query(
          `SELECT name, "nextRun", "lastRun", "totalRuns" FROM cron_jobs WHERE status = 'active'`
        );
        const now = new Date();
        for (const job of failed.rows) {
          if (job.nextRun && new Date(job.nextRun) < new Date(now.getTime() - 3600_000)) {
            failedJobs++;
            issues.push(`Cron job "${job.name}" overdue: nextRun was ${job.nextRun}`);
          }
        }
      } finally {
        await client.end();
      }
    } catch {
      // already counted dbConnected above
    }
  }
  health.cronScheduler = failedJobs > 0 ? "degraded" : "healthy";

  // 4) Integrations
  const providers = listProviders();
  const integrationsConfigured = providers.filter(p => p.isSet).length;
  const integrationsTotal = providers.length;

  // 5) Insights
  if (integrationsConfigured / integrationsTotal > 0.7) {
    insights.push(`${Math.round((integrationsConfigured / integrationsTotal) * 100)}% of integrations configured`);
  } else if (integrationsConfigured / integrationsTotal < 0.3) {
    insights.push(`Only ${Math.round((integrationsConfigured / integrationsTotal) * 100)}% of integrations configured — consider adding more`);
  }

  return {
    health,
    metrics: {
      dbConnected,
      cronJobsActive,
      integrationsConfigured,
      integrationsTotal,
      failedJobs,
    },
    issues,
    insights,
    timestamp,
  };
}