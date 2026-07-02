/**
 * Plan Phase — build task graph, detect dependencies, optimize execution order
 *
 * Takes an objective and current observations, produces an executable RuntimePlan.
 * Automatically:
 * - Decomposes high-level objective into subtasks
 * - Detects dependencies
 * - Groups parallelizable tasks
 * - Identifies bottlenecks
 * - Risk assessment
 */

import type {
  RuntimePlan, RuntimePhase, Task, TaskPriority,
} from "./types";
import { observeSystem } from "./observe";

const PHASE_ORDER: RuntimePhase[] = [
  "observe", "discover", "decompose", "understand", "model", "predict",
  "plan", "prioritize", "execute", "monitor", "verify", "validate",
  "compare", "analyze", "optimize", "recover", "learn", "update",
];

/**
 * Decompose an objective into ordered phases
 */
function phasesForObjective(objective: string): RuntimePhase[] {
  const lower = objective.toLowerCase();

  // Always start with observe + discover
  const phases: RuntimePhase[] = ["observe", "discover"];

  if (lower.includes("fix") || lower.includes("bug") || lower.includes("debug")) {
    phases.push("decompose", "understand", "analyze", "model", "predict");
  } else if (lower.includes("build") || lower.includes("create") || lower.includes("add")) {
    phases.push("decompose", "understand", "model");
  } else if (lower.includes("optimize") || lower.includes("improve")) {
    phases.push("analyze", "model", "predict");
  } else if (lower.includes("deploy") || lower.includes("ship")) {
    phases.push("verify", "validate");
  } else {
    // Default — explore and plan
    phases.push("decompose", "understand", "model");
  }

  phases.push("plan", "prioritize", "execute", "monitor");
  phases.push("verify", "validate");
  phases.push("compare", "optimize");
  phases.push("learn", "update");

  return phases;
}

/**
 * Build task graph from phases
 */
function buildTaskGraph(objective: string, phases: RuntimePhase[]): Task[] {
  const tasks: Task[] = [];
  let prevTaskId: string | null = null;

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    const taskId = `task-${i + 1}`;
    const dependsOn = prevTaskId ? [prevTaskId] : [];

    tasks.push({
      id: taskId,
      title: phaseTitle(phase),
      description: phaseDescription(phase, objective),
      phase,
      status: "pending",
      priority: priorityForPhase(phase),
      dependsOn,
      estimatedComplexity: complexityForPhase(phase),
      retries: 0,
    });

    prevTaskId = taskId;
  }

  return tasks;
}

function phaseTitle(phase: RuntimePhase): string {
  const titles: Record<RuntimePhase, string> = {
    observe: "Observe current system state",
    discover: "Discover available resources and capabilities",
    decompose: "Decompose objective into subtasks",
    understand: "Understand constraints and dependencies",
    model: "Model expected behavior",
    predict: "Predict outcomes and risks",
    plan: "Plan execution strategy",
    prioritize: "Prioritize work by impact",
    execute: "Execute the plan",
    monitor: "Monitor execution progress",
    verify: "Verify correctness",
    validate: "Validate against requirements",
    compare: "Compare actual vs expected",
    analyze: "Analyze results and feedback",
    optimize: "Optimize for next iteration",
    recover: "Recover from failures",
    learn: "Learn from this iteration",
    update: "Update heuristics and knowledge",
  };
  return titles[phase];
}

function phaseDescription(phase: RuntimePhase, objective: string): string {
  return `Phase "${phase}" of autonomous execution for objective: "${objective}"`;
}

function priorityForPhase(phase: RuntimePhase): TaskPriority {
  if (phase === "execute" || phase === "verify") return "high";
  if (phase === "recover" || phase === "monitor") return "high";
  if (phase === "observe" || phase === "plan") return "high";
  return "medium";
}

function complexityForPhase(phase: RuntimePhase): number {
  const map: Record<RuntimePhase, number> = {
    execute: 8, recover: 7, optimize: 6, verify: 5, analyze: 5,
    plan: 4, model: 5, observe: 3, learn: 3, monitor: 2,
    discover: 3, decompose: 4, understand: 4, predict: 4,
    prioritize: 2, validate: 4, compare: 3, update: 3,
  };
  return map[phase] || 5;
}

/**
 * Find tasks that can run in parallel (no dependency between them)
 */
function findParallelizable(tasks: Task[]): string[][] {
  const groups: string[][] = [];
  const completed = new Set<string>();

  while (completed.size < tasks.length) {
    const ready = tasks.filter(t =>
      t.status === "pending" &&
      !completed.has(t.id) &&
      t.dependsOn.every(d => completed.has(d))
    );
    if (ready.length === 0) break;
    groups.push(ready.map(t => t.id));
    ready.forEach(t => completed.add(t.id));
  }

  return groups;
}

/**
 * Predict bottlenecks (high complexity + high dependency count)
 */
function predictBottlenecks(tasks: Task[]): string[] {
  const bottlenecks: string[] = [];
  for (const t of tasks) {
    if (t.estimatedComplexity >= 7) {
      bottlenecks.push(`${t.phase} (complexity ${t.estimatedComplexity})`);
    }
    if (t.dependsOn.length >= 3) {
      bottlenecks.push(`${t.phase} has ${t.dependsOn.length} dependencies`);
    }
  }
  return bottlenecks;
}

/**
 * Risk assessment
 */
function assessRisk(tasks: Task[], observations: { issues: string[]; health: Record<string, string> }): RuntimePlan["riskAssessment"] {
  const factors: string[] = [];
  const mitigations: string[] = [];
  let level: "low" | "medium" | "high" | "critical" = "low";

  const totalComplexity = tasks.reduce((sum, t) => sum + t.estimatedComplexity, 0);
  if (totalComplexity > 40) {
    factors.push(`Total complexity ${totalComplexity} > 40`);
    mitigations.push("Consider breaking objective into smaller iterations");
    level = "high";
  } else if (totalComplexity > 25) {
    factors.push(`Total complexity ${totalComplexity} > 25`);
    level = "medium";
  }

  if (observations.issues.length > 0) {
    factors.push(`${observations.issues.length} system issues detected`);
    mitigations.push("Resolve system issues first via recovery phase");
    if (level === "low") level = "medium";
  }

  const downServices = Object.entries(observations.health).filter(([, s]) => s === "down").length;
  if (downServices > 0) {
    factors.push(`${downServices} services down`);
    mitigations.push("Trigger recovery or use fallbacks");
    if (level !== "critical") level = downServices > 2 ? "critical" : "high";
  }

  return { level, factors, mitigations };
}

/**
 * Main plan function — produce RuntimePlan for an objective
 */
export async function planExecution(objective: string): Promise<RuntimePlan> {
  const observations = await observeSystem();
  const phases = phasesForObjective(objective);
  const taskGraph = buildTaskGraph(objective, phases);
  const totalComplexity = taskGraph.reduce((sum, t) => sum + t.estimatedComplexity, 0);

  return {
    objective,
    phases,
    taskGraph,
    estimatedTotalComplexity: totalComplexity,
    parallelizableTasks: findParallelizable(taskGraph),
    serializedTasks: taskGraph.map(t => [t.id]),
    predictedBottlenecks: predictBottlenecks(taskGraph),
    riskAssessment: assessRisk(taskGraph, observations),
  };
}

export { PHASE_ORDER };