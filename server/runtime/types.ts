/**
 * Autonomous Runtime — Types
 *
 * Core type definitions for the Observe → Plan → Execute → Verify → Learn loop.
 * Mirrors the agi-autonomous-runtime skill spec.
 */

export type RuntimePhase =
  | "observe"
  | "discover"
  | "decompose"
  | "understand"
  | "model"
  | "predict"
  | "plan"
  | "prioritize"
  | "execute"
  | "monitor"
  | "verify"
  | "validate"
  | "compare"
  | "analyze"
  | "optimize"
  | "recover"
  | "learn"
  | "update";

export type TaskStatus = "pending" | "running" | "completed" | "failed" | "skipped";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Task {
  id: string;
  title: string;
  description: string;
  phase: RuntimePhase;
  status: TaskStatus;
  priority: TaskPriority;
  dependsOn: string[]; // task IDs
  estimatedComplexity: number; // 1-10
  startedAt?: number;
  completedAt?: number;
  result?: unknown;
  error?: string;
  retries: number;
}

export interface RuntimeState {
  cycleId: string;
  objective: string;
  startedAt: number;
  phase: RuntimePhase;
  confidence: number; // 0-1
  tasks: Task[];
  observations: Observation[];
  decisions: Decision[];
  metrics: RuntimeMetrics;
  recoveryLog: RecoveryEvent[];
  learnings: Learning[];
  terminalStatus: "running" | "success" | "failed" | "timeout";
}

export interface Observation {
  phase: RuntimePhase;
  timestamp: number;
  data: Record<string, unknown>;
  insights: string[];
}

export interface Decision {
  phase: RuntimePhase;
  timestamp: number;
  decision: string;
  reasoning: string;
  alternatives: string[];
  chosen: string;
  confidence: number; // 0-1
}

export interface RuntimeMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalDurationMs: number;
  avgTaskDurationMs: number;
  recoveryEvents: number;
  patternsDetected: number;
}

export interface RecoveryEvent {
  timestamp: number;
  type: "retry" | "rollback" | "repair_config" | "repair_dependency" | "repair_build" | "repair_deploy" | "repair_test" | "skip";
  description: string;
  success: boolean;
}

export interface Learning {
  timestamp: number;
  pattern: string;
  insight: string;
  appliesTo: string; // pattern category
  confidence: number;
}

export interface RuntimePlan {
  objective: string;
  phases: RuntimePhase[];
  taskGraph: Task[];
  estimatedTotalComplexity: number;
  parallelizableTasks: string[][];
  serializedTasks: string[][];
  predictedBottlenecks: string[];
  riskAssessment: {
    level: "low" | "medium" | "high" | "critical";
    factors: string[];
    mitigations: string[];
  };
}