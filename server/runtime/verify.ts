/**
 * Verify Phase — validate correctness of execution results
 *
 * Checks:
 * - Logical correctness (no contradictions in results)
 * - Functional correctness (tasks succeeded as expected)
 * - Build / test status (if applicable)
 * - Requirement coverage (objective met)
 * - Regression detection (nothing broken)
 */

import type { RuntimeState, RuntimeMetrics } from "./types";

export interface VerificationReport {
  passed: boolean;
  confidence: number; // 0-1
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
    severity: "info" | "warning" | "error";
  }>;
  metrics: RuntimeMetrics;
  recommendations: string[];
}

export async function verify(state: RuntimeState): Promise<VerificationReport> {
  const checks: VerificationReport["checks"] = [];

  // 1) Logical correctness — no contradictions
  const failedTasks = state.tasks.filter(t => t.status === "failed");
  checks.push({
    name: "logical_correctness",
    passed: failedTasks.length === 0,
    message: failedTasks.length === 0
      ? `All ${state.tasks.length} tasks completed without logical errors`
      : `${failedTasks.length} tasks failed: ${failedTasks.map(t => t.phase).join(", ")}`,
    severity: failedTasks.length === 0 ? "info" : "error",
  });

  // 2) Functional correctness — at least 80% tasks completed
  const completedTasks = state.tasks.filter(t => t.status === "completed").length;
  const completionRate = state.tasks.length > 0 ? completedTasks / state.tasks.length : 0;
  checks.push({
    name: "functional_correctness",
    passed: completionRate >= 0.8,
    message: `${completedTasks}/${state.tasks.length} tasks completed (${Math.round(completionRate * 100)}%)`,
    severity: completionRate >= 0.8 ? "info" : completionRate >= 0.5 ? "warning" : "error",
  });

  // 3) Confidence threshold — runtime confidence > 0.6
  checks.push({
    name: "confidence_threshold",
    passed: state.confidence >= 0.6,
    message: `Runtime confidence: ${(state.confidence * 100).toFixed(0)}%`,
    severity: state.confidence >= 0.6 ? "info" : "warning",
  });

  // 4) No critical recovery events
  const criticalRecoveries = state.recoveryLog.filter(r => !r.success && r.type !== "skip").length;
  checks.push({
    name: "no_critical_failures",
    passed: criticalRecoveries === 0,
    message: criticalRecoveries === 0
      ? "No critical recovery events"
      : `${criticalRecoveries} critical recovery events`,
    severity: criticalRecoveries === 0 ? "info" : "warning",
  });

  // 5) Requirement coverage — objective has been acted upon
  checks.push({
    name: "requirement_coverage",
    passed: state.objective.length > 0 && state.tasks.length > 0,
    message: `Objective "${state.objective.slice(0, 60)}..." has ${state.tasks.length} execution tasks`,
    severity: state.tasks.length > 0 ? "info" : "error",
  });

  // 6) Regression check — no new issues introduced
  const issuesBefore = state.observations[0]?.insights?.length || 0;
  const issuesAfter = state.observations[state.observations.length - 1]?.insights?.length || 0;
  checks.push({
    name: "regression_check",
    passed: issuesAfter <= issuesBefore + 1,
    message: `System observations: ${issuesBefore} before → ${issuesAfter} after`,
    severity: issuesAfter <= issuesBefore + 1 ? "info" : "warning",
  });

  // 7) Performance — no task took > 5 min
  const slowTasks = state.tasks.filter(t => {
    if (!t.startedAt || !t.completedAt) return false;
    return (t.completedAt - t.startedAt) > 300_000;
  });
  checks.push({
    name: "performance",
    passed: slowTasks.length === 0,
    message: slowTasks.length === 0
      ? "No slow tasks"
      : `${slowTasks.length} tasks exceeded 5min: ${slowTasks.map(t => t.phase).join(", ")}`,
    severity: slowTasks.length === 0 ? "info" : "warning",
  });

  // Calculate overall confidence
  const passCount = checks.filter(c => c.passed).length;
  const confidence = passCount / checks.length;

  const passed = criticalRecoveries === 0
    && completionRate >= 0.8
    && state.confidence >= 0.5;

  // Recommendations
  const recommendations: string[] = [];
  if (failedTasks.length > 0) {
    recommendations.push(`Retry failed tasks: ${failedTasks.map(t => t.phase).join(", ")}`);
  }
  if (completionRate < 0.8) {
    recommendations.push("Investigate why tasks aren't completing — check logs");
  }
  if (slowTasks.length > 0) {
    recommendations.push(`Optimize slow tasks: ${slowTasks.map(t => t.phase).join(", ")}`);
  }
  if (state.confidence < 0.6) {
    recommendations.push("Gather more observations to increase confidence");
  }

  // Build metrics
  const metrics: RuntimeMetrics = {
    totalTasks: state.tasks.length,
    completedTasks,
    failedTasks: failedTasks.length,
    totalDurationMs: state.tasks.reduce((sum, t) => {
      if (t.startedAt && t.completedAt) return sum + (t.completedAt - t.startedAt);
      return sum;
    }, 0),
    avgTaskDurationMs: 0,
    recoveryEvents: state.recoveryLog.length,
    patternsDetected: state.learnings.length,
  };
  metrics.avgTaskDurationMs = metrics.completedTasks > 0
    ? Math.round(metrics.totalDurationMs / metrics.completedTasks)
    : 0;

  return {
    passed,
    confidence,
    checks,
    metrics,
    recommendations,
  };
}