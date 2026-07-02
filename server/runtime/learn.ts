/**
 * Learn Phase — extract patterns from completed runs, update heuristics
 *
 * Detects:
 * - Recurring failure patterns
 * - Successful patterns to reinforce
 * - Optimization opportunities
 *
 * Stores learnings in DB (learning_log table) for future reference.
 */

import type { RuntimeState, Learning, VerificationReport } from "./types";
import { Client } from "pg";

/**
 * Extract learnings from a completed cycle
 */
export async function learn(state: RuntimeState, verification: VerificationReport): Promise<Learning[]> {
  const learnings: Learning[] = [];
  const timestamp = Date.now();

  // 1) Detect recurring failure patterns
  const failedTasks = state.tasks.filter(t => t.status === "failed");
  if (failedTasks.length > 0) {
    const errorMessages = failedTasks.map(t => t.error || "").filter(Boolean);
    const commonPatterns = findCommonPatterns(errorMessages);
    for (const pattern of commonPatterns) {
      learnings.push({
        timestamp,
        pattern,
        insight: `${failedTasks.length} tasks failed with similar error: ${pattern}`,
        appliesTo: "failure_recovery",
        confidence: 0.7,
      });
    }
  }

  // 2) Detect successful patterns
  const completedTasks = state.tasks.filter(t => t.status === "completed");
  if (completedTasks.length > 0 && verification.passed) {
    const avgComplexity = completedTasks.reduce((sum, t) => sum + t.estimatedComplexity, 0) / completedTasks.length;
    learnings.push({
      timestamp,
      pattern: "full_cycle_success",
      insight: `Completed ${completedTasks.length} tasks with avg complexity ${avgComplexity.toFixed(1)}`,
      appliesTo: "success_reinforcement",
      confidence: verification.confidence,
    });
  }

  // 3) Detect slow tasks
  const slowTasks = state.tasks.filter(t => {
    if (!t.startedAt || !t.completedAt) return false;
    return (t.completedAt - t.startedAt) > 60_000; // > 1 min
  });
  for (const task of slowTasks) {
    if (task.startedAt && task.completedAt) {
      learnings.push({
        timestamp,
        pattern: "slow_task",
        insight: `Task "${task.phase}" took ${Math.round((task.completedAt - task.startedAt) / 1000)}s`,
        appliesTo: "performance_optimization",
        confidence: 0.6,
      });
    }
  }

  // 4) Recovery insights
  const successfulRecoveries = state.recoveryLog.filter(r => r.success).length;
  if (successfulRecoveries > 0) {
    learnings.push({
      timestamp,
      pattern: "auto_recovery",
      insight: `Successfully auto-recovered ${successfulRecoveries} failures`,
      appliesTo: "resilience",
      confidence: 0.8,
    });
  }

  // 5) Store in DB
  await persistLearnings(learnings);

  return learnings;
}

/**
 * Find common patterns in error messages
 */
function findCommonPatterns(messages: string[]): string[] {
  const patterns: Map<string, number> = new Map();

  for (const msg of messages) {
    // Categorize by error type
    let category = "unknown";
    if (msg.includes("timeout") || msg.includes("ETIMEDOUT")) category = "network_timeout";
    else if (msg.includes("ECONNREFUSED") || msg.includes("connect")) category = "connection_refused";
    else if (msg.includes("permission") || msg.includes("auth")) category = "auth_failure";
    else if (msg.includes("not found") || msg.includes("404")) category = "resource_missing";
    else if (msg.includes("rate") || msg.includes("429")) category = "rate_limited";
    else if (msg.includes("500") || msg.includes("Internal")) category = "server_error";

    patterns.set(category, (patterns.get(category) || 0) + 1);
  }

  return Array.from(patterns.entries())
    .filter(([, count]) => count >= 2)
    .map(([pattern]) => pattern);
}

/**
 * Persist learnings to DB
 */
async function persistLearnings(learnings: Learning[]): Promise<void> {
  if (learnings.length === 0) return;
  try {
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: false });
    await client.connect();
    try {
      // Ensure table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS runtime_learnings (
          id SERIAL PRIMARY KEY,
          pattern TEXT NOT NULL,
          insight TEXT NOT NULL,
          applies_to TEXT,
          confidence NUMERIC DEFAULT 0.5,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      for (const l of learnings) {
        await client.query(
          `INSERT INTO runtime_learnings (pattern, insight, applies_to, confidence) VALUES ($1, $2, $3, $4)`,
          [l.pattern, l.insight, l.appliesTo, l.confidence]
        );
      }
    } finally {
      await client.end();
    }
  } catch (e) {
    console.warn("[Runtime] Failed to persist learnings:", String(e));
  }
}

/**
 * Get historical learnings
 */
export async function getHistoricalLearnings(limit = 20): Promise<Array<{
  pattern: string;
  insight: string;
  appliesTo: string;
  confidence: number;
  createdAt: string;
}>> {
  try {
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: false });
    await client.connect();
    try {
      const r = await client.query(
        `SELECT pattern, insight, applies_to, confidence, created_at FROM runtime_learnings ORDER BY created_at DESC LIMIT $1`,
        [limit]
      );
      return r.rows.map(row => ({
        pattern: row.pattern,
        insight: row.insight,
        appliesTo: row.applies_to,
        confidence: parseFloat(row.confidence),
        createdAt: row.created_at,
      }));
    } finally {
      await client.end();
    }
  } catch {
    return [];
  }
}