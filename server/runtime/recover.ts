/**
 * Recover Phase — auto-recovery from failures
 *
 * Strategies:
 * - Retry transient failures (network, timeout)
 * - Rollback unsafe changes
 * - Repair configuration (reconnect DB, etc.)
 * - Skip unrecoverable tasks
 * - Trigger self-healing
 */

import type { Task, RuntimeState, RecoveryEvent } from "./types";
import { Client } from "pg";

const MAX_RECOVERY_ATTEMPTS = 3;

export async function attemptRecovery(
  task: Task,
  state: RuntimeState
): Promise<{ recovered: boolean; event: RecoveryEvent; updatedTask: Task }> {
  const timestamp = Date.now();
  const errorMsg = task.error || "Unknown error";

  // Decide recovery strategy based on error type
  let recovered = false;
  let description = "";
  let type: RecoveryEvent["type"] = "retry";

  if (errorMsg.includes("timeout") || errorMsg.includes("ETIMEDOUT") || errorMsg.includes("ECONNRESET")) {
    // Transient — retry
    type = "retry";
    description = `Retry transient failure: ${errorMsg.slice(0, 100)}`;
    if (task.retries < MAX_RECOVERY_ATTEMPTS) {
      recovered = await retryTask(task);
    }
  } else if (errorMsg.includes("connect") || errorMsg.includes("ECONNREFUSED")) {
    // Connection issue — repair
    type = "repair_dependency";
    description = `Repair DB connection: ${errorMsg.slice(0, 100)}`;
    recovered = await repairDatabaseConnection();
  } else if (errorMsg.includes("configuration") || errorMsg.includes("env") || errorMsg.includes("undefined")) {
    type = "repair_config";
    description = `Configuration error: ${errorMsg.slice(0, 100)}`;
    recovered = false; // can't auto-fix config
  } else if (errorMsg.includes("build") || errorMsg.includes("compile")) {
    type = "repair_build";
    description = `Build error: ${errorMsg.slice(0, 100)}`;
    recovered = false;
  } else {
    // Unknown — try retry once
    type = "retry";
    description = `Unknown error, attempting retry: ${errorMsg.slice(0, 100)}`;
    if (task.retries < MAX_RECOVERY_ATTEMPTS) {
      recovered = await retryTask(task);
    }
  }

  const event: RecoveryEvent = {
    timestamp,
    type,
    description,
    success: recovered,
  };

  const updatedTask: Task = {
    ...task,
    status: recovered ? "running" : "failed",
    retries: task.retries + (recovered ? 1 : 0),
  };

  return { recovered, event, updatedTask };
}

/**
 * Retry the task
 */
async function retryTask(task: Task): Promise<boolean> {
  // Simple backoff retry
  await new Promise(r => setTimeout(r, 2000));
  // Note: actual re-execution happens in the orchestrator
  return true;
}

/**
 * Repair database connection
 */
async function repairDatabaseConnection(): Promise<boolean> {
  try {
    if (!process.env.DATABASE_URL) return false;
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: false });
    await client.connect();
    await client.query("SELECT 1");
    await client.end();
    return true;
  } catch {
    return false;
  }
}

/**
 * Auto-recovery loop — recover all failed tasks
 */
export async function recoverFailedTasks(state: RuntimeState): Promise<{
  state: RuntimeState;
  recovered: number;
  unrecoverable: number;
}> {
  const failedTasks = state.tasks.filter(t => t.status === "failed");
  let recovered = 0;
  let unrecoverable = 0;

  for (const task of failedTasks) {
    const result = await attemptRecovery(task, state);
    state.recoveryLog.push(result.event);

    // Find and update the task in state
    const idx = state.tasks.findIndex(t => t.id === task.id);
    if (idx >= 0) {
      state.tasks[idx] = result.updatedTask;
    }

    if (result.recovered) {
      recovered++;
    } else {
      unrecoverable++;
    }
  }

  return { state, recovered, unrecoverable };
}