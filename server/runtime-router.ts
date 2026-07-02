/**
 * Runtime tRPC Router
 *
 * Exposes the autonomous runtime as tRPC procedures:
 * - status: current runtime status
 * - run: run a single cycle with an objective
 * - runUntilConverged: run until success or budget exhausted
 * - history: historical cycles
 * - learnings: extracted patterns
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  runCycle,
  runUntilConverged,
  getRuntimeStatus,
  getCycleHistoryFromDB,
  getHistoricalLearnings,
} from "./runtime/autonomous";

export const runtimeRouter = router({
  status: publicProcedure.query(() => getRuntimeStatus()),

  run: publicProcedure
    .input(z.object({
      objective: z.string().min(1).max(500),
    }))
    .mutation(async ({ input }) => {
      const state = await runCycle(input.objective);
      return {
        cycleId: state.cycleId,
        terminalStatus: state.terminalStatus,
        confidence: state.confidence,
        totalTasks: state.metrics.totalTasks,
        completedTasks: state.metrics.completedTasks,
        failedTasks: state.metrics.failedTasks,
        learningsCount: state.learnings.length,
        recoveryEvents: state.metrics.recoveryEvents,
        durationMs: Date.now() - state.startedAt,
      };
    }),

  runUntilConverged: publicProcedure
    .input(z.object({
      objective: z.string().min(1).max(500),
    }))
    .mutation(async ({ input }) => {
      const result = await runUntilConverged(input.objective);
      return {
        cyclesRun: result.cyclesRun,
        converged: result.converged,
        terminalStatus: result.state.terminalStatus,
        confidence: result.state.confidence,
        totalTasks: result.state.metrics.totalTasks,
        completedTasks: result.state.metrics.completedTasks,
        failedTasks: result.state.metrics.failedTasks,
        learningsCount: result.state.learnings.length,
        recoveryEvents: result.state.metrics.recoveryEvents,
      };
    }),

  history: publicProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const cycles = await getCycleHistoryFromDB(input?.limit || 10);
      return cycles;
    }),

  learnings: publicProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const learnings = await getHistoricalLearnings(input?.limit || 20);
      return learnings;
    }),
});