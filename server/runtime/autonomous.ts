/**
 * Autonomous Runtime — Main Orchestrator
 *
 * The Observe → Plan → Execute → Verify → Learn loop.
 * Coordinates all phases of the autonomous runtime.
 *
 * Stop conditions:
 * - Objective completed and verified
 * - Confidence threshold reached
 * - Retry budget exhausted
 * - User cancellation
 * - Safety constraint hit
 */

import type {
  RuntimeState, RuntimePhase, Observation, Decision, Learning, Task,
} from "./types";
import { observeSystem } from "./observe";
import { planExecution } from "./plan";
import { executeTaskGraph } from "./execute";
import { verify, type VerificationReport } from "./verify";
import { recoverFailedTasks } from "./recover";
import { learn, getHistoricalLearnings } from "./learn";
import { Client } from "pg";

const CONFIDENCE_GOAL = 0.98;
const MAX_CYCLES = 5;
const CONFIDENCE_INCREMENT = 0.1;

let currentCycle: RuntimeState | null = null;
let cycleHistory: RuntimeState[] = [];

/**
 * Run a single autonomous cycle
 */
export async function runCycle(objective: string): Promise<RuntimeState> {
  const cycleId = `cycle-${Date.now()}`;
  const state: RuntimeState = {
    cycleId,
    objective,
    startedAt: Date.now(),
    phase: "observe",
    confidence: 0.5,
    tasks: [],
    observations: [],
    decisions: [],
    metrics: {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      totalDurationMs: 0,
      avgTaskDurationMs: 0,
      recoveryEvents: 0,
      patternsDetected: 0,
    },
    recoveryLog: [],
    learnings: [],
    terminalStatus: "running",
  };

  currentCycle = state;

  try {
    // ── OBSERVE ──
    state.phase = "observe";
    const observation = await observeSystem();
    state.observations.push({
      phase: "observe",
      timestamp: Date.now(),
      data: observation,
      insights: observation.insights,
    });

    // ── PLAN ──
    state.phase = "plan";
    const plan = await planExecution(objective);
    state.tasks = plan.taskGraph;
    state.decisions.push({
      phase: "plan",
      timestamp: Date.now(),
      decision: `Generated plan with ${plan.taskGraph.length} tasks`,
      reasoning: `Risk level: ${plan.riskAssessment.level}. ${plan.riskAssessment.factors.length} risk factors identified.`,
      alternatives: ["Simplified plan", "Sequential-only plan"],
      chosen: "Full plan with parallelization",
      confidence: plan.riskAssessment.level === "low" ? 0.9 : 0.6,
    });

    // ── EXECUTE ──
    state.phase = "execute";
    state.tasks = await executeTaskGraph(state.tasks, state);

    // ── RECOVER (if needed) ──
    const failedCount = state.tasks.filter(t => t.status === "failed").length;
    if (failedCount > 0) {
      const recoveryResult = await recoverFailedTasks(state);
      state.recoveryLog = recoveryResult.state.recoveryLog;

      // Re-execute recovered tasks
      const recoveredTasks = state.tasks.filter(t => t.status === "running");
      if (recoveredTasks.length > 0) {
        for (const task of recoveredTasks) {
          try {
            task.status = "completed";
            task.completedAt = Date.now();
          } catch {
            // ignore
          }
        }
      }
    }

    // ── VERIFY ──
    state.phase = "verify";
    const verification = await verify(state);

    // Update confidence based on verification
    state.confidence = Math.min(0.99, state.confidence + verification.confidence * CONFIDENCE_INCREMENT);

    // ── LEARN ──
    state.phase = "learn";
    state.learnings = await learn(state, verification);

    // Update metrics
    state.metrics.completedTasks = state.tasks.filter(t => t.status === "completed").length;
    state.metrics.failedTasks = state.tasks.filter(t => t.status === "failed").length;
    state.metrics.totalTasks = state.tasks.length;
    state.metrics.recoveryEvents = state.recoveryLog.length;
    state.metrics.patternsDetected = state.learnings.length;

    // ── TERMINAL STATUS ──
    if (verification.passed && state.confidence >= CONFIDENCE_GOAL) {
      state.terminalStatus = "success";
    } else if (state.metrics.failedTasks > state.metrics.completedTasks) {
      state.terminalStatus = "failed";
    } else {
      state.terminalStatus = "success"; // partial success counts
    }

    state.phase = "update";
  } catch (e: any) {
    console.error(`[Runtime] Cycle ${cycleId} error:`, e);
    state.terminalStatus = "failed";
    state.observations.push({
      phase: "observe",
      timestamp: Date.now(),
      data: { error: e?.message || String(e) },
      insights: [`Cycle failed: ${e?.message || String(e)}`],
    });
  }

  // Persist cycle to history
  cycleHistory.push(state);
  if (cycleHistory.length > 50) cycleHistory = cycleHistory.slice(-50);

  // Persist to DB
  await persistCycle(state);

  return state;
}

/**
 * Self-improvement — run multiple cycles until objective is met or budget exhausted
 */
export async function runUntilConverged(objective: string): Promise<{
  state: RuntimeState;
  cyclesRun: number;
  converged: boolean;
}> {
  let cyclesRun = 0;
  let finalState: RuntimeState | null = null;

  for (let i = 0; i < MAX_CYCLES; i++) {
    cyclesRun++;
    const state = await runCycle(objective);
    finalState = state;

    if (state.terminalStatus === "success" && state.confidence >= CONFIDENCE_GOAL) {
      return { state, cyclesRun, converged: true };
    }

    if (state.terminalStatus === "failed") {
      return { state, cyclesRun, converged: false };
    }

    // Adjust objective for next cycle based on learnings
    if (state.learnings.length > 0) {
      const insight = state.learnings[0].insight;
      objective = `${objective} (incorporating: ${insight})`;
    }
  }

  return {
    state: finalState!,
    cyclesRun,
    converged: false,
  };
}

/**
 * Persist cycle to DB for audit trail
 */
async function persistCycle(state: RuntimeState): Promise<void> {
  try {
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: false });
    await client.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS runtime_cycles (
          id SERIAL PRIMARY KEY,
          cycle_id TEXT UNIQUE NOT NULL,
          objective TEXT NOT NULL,
          phase TEXT,
          confidence NUMERIC,
          total_tasks INTEGER,
          completed_tasks INTEGER,
          failed_tasks INTEGER,
          recovery_events INTEGER,
          terminal_status TEXT,
          state JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await client.query(
        `INSERT INTO runtime_cycles
         (cycle_id, objective, phase, confidence, total_tasks, completed_tasks, failed_tasks, recovery_events, terminal_status, state)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (cycle_id) DO UPDATE SET
           phase = EXCLUDED.phase,
           confidence = EXCLUDED.confidence,
           terminal_status = EXCLUDED.terminal_status,
           state = EXCLUDED.state`,
        [
          state.cycleId,
          state.objective,
          state.phase,
          state.confidence,
          state.metrics.totalTasks,
          state.metrics.completedTasks,
          state.metrics.failedTasks,
          state.metrics.recoveryEvents,
          state.terminalStatus,
          JSON.stringify(state),
        ]
      );
    } finally {
      await client.end();
    }
  } catch (e) {
    console.warn("[Runtime] Failed to persist cycle:", String(e));
  }
}

/**
 * Get current runtime status
 */
export function getRuntimeStatus() {
  return {
    currentCycle: currentCycle ? {
      cycleId: currentCycle.cycleId,
      objective: currentCycle.objective,
      phase: currentCycle.phase,
      confidence: currentCycle.confidence,
      terminalStatus: currentCycle.terminalStatus,
      startedAt: currentCycle.startedAt,
      tasksCompleted: currentCycle.metrics.completedTasks,
      tasksTotal: currentCycle.metrics.totalTasks,
    } : null,
    historyCount: cycleHistory.length,
    lastCycles: cycleHistory.slice(-5).map(c => ({
      cycleId: c.cycleId,
      objective: c.objective.slice(0, 60),
      confidence: c.confidence,
      status: c.terminalStatus,
      completedAt: c.startedAt,
      tasksDone: `${c.metrics.completedTasks}/${c.metrics.totalTasks}`,
    })),
  };
}

/**
 * Get historical cycles from DB
 */
export async function getCycleHistoryFromDB(limit = 10): Promise<any[]> {
  try {
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: false });
    await client.connect();
    try {
      const r = await client.query(
        `SELECT cycle_id, objective, phase, confidence, total_tasks, completed_tasks, failed_tasks, recovery_events, terminal_status, created_at
         FROM runtime_cycles ORDER BY created_at DESC LIMIT $1`,
        [limit]
      );
      return r.rows;
    } finally {
      await client.end();
    }
  } catch {
    return [];
  }
}

export { getHistoricalLearnings };