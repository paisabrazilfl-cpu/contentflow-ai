/**
 * Runtime Monitor — autonomous runtime dashboard
 *
 * Shows:
 * - Current cycle status (phase, confidence, progress)
 * - Historical cycles
 * - Extracted learnings
 * - Run new cycle button (with custom objective)
 */

import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Brain, Play, Loader2, CheckCircle2, XCircle, AlertCircle,
  Activity, Target, TrendingUp, RefreshCw, Clock, Zap
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";

export default function RuntimeMonitor() {
  const [objective, setObjective] = useState("Continuously improve system health, reliability, and performance");

  const { data: status, refetch: refetchStatus } = trpc.runtime.status.useQuery(undefined, {
    refetchInterval: 5000,
  });
  const { data: history, refetch: refetchHistory } = trpc.runtime.history.useQuery({ limit: 20 } as any);
  const { data: learnings, refetch: refetchLearnings } = trpc.runtime.learnings.useQuery({ limit: 20 } as any);

  const runMutation = trpc.runtime.run.useMutation({
    onSuccess: (result) => {
      toast.success(`Cycle ${result.cycleId}: ${result.terminalStatus} (conf: ${(result.confidence * 100).toFixed(0)}%)`);
      refetchStatus();
      refetchHistory();
      refetchLearnings();
    },
    onError: (err) => toast.error(err.message),
  });

  const runConvergedMutation = trpc.runtime.runUntilConverged.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.cyclesRun} cycles run. Converged: ${result.converged ? "yes" : "no"}`);
      refetchStatus();
      refetchHistory();
      refetchLearnings();
    },
    onError: (err) => toast.error(err.message),
  });

  const current = status?.currentCycle;
  const lastCycles = status?.lastCycles || [];
  const isRunning = runMutation.isPending || runConvergedMutation.isPending;

  const refreshAll = () => {
    refetchStatus();
    refetchHistory();
    refetchLearnings();
    toast.success("Refreshed");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              Autonomous Runtime
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Observe → Plan → Execute → Verify → Learn loop. Self-improving, self-healing.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refreshAll}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Cycles</p>
                  <p className="text-2xl font-bold">{history?.length || 0}</p>
                </div>
                <Activity className="w-8 h-8 text-muted-foreground opacity-30" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Successful</p>
                  <p className="text-2xl font-bold text-green-400">
                    {history?.filter((c: any) => c.terminal_status === "success").length || 0}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-400">
                    {history?.filter((c: any) => c.terminal_status === "failed").length || 0}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Patterns Learned</p>
                  <p className="text-2xl font-bold text-primary">{learnings?.length || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Run new cycle */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Run Autonomous Cycle</CardTitle>
            <CardDescription className="text-xs">
              Submit an objective. The runtime will observe the system, plan execution,
              run tasks in parallel, verify results, and extract learnings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Objective</Label>
              <Input
                className="mt-1"
                placeholder="e.g., Improve content generation quality"
                value={objective}
                onChange={e => setObjective(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => runMutation.mutate({ objective })}
                disabled={isRunning || !objective.trim()}
                className="gradient-orange text-black font-semibold"
              >
                {runMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Run 1 Cycle
              </Button>
              <Button
                onClick={() => runConvergedMutation.mutate({ objective })}
                disabled={isRunning || !objective.trim()}
                variant="outline"
              >
                {runConvergedMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Target className="w-4 h-4 mr-2" />
                )}
                Run Until Converged
              </Button>
              <span className="text-xs text-muted-foreground ml-auto">
                Last result: {lastCycles[0]?.status || "—"} ({lastCycles[0]?.tasksDone || "—"})
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Current cycle */}
        {current && (
          <Card className="bg-card border-border border-primary/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary animate-pulse" />
                Active Cycle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Phase</p>
                  <p className="text-sm font-mono">{current.phase}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <p className="text-sm font-mono">{(current.confidence * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Progress</p>
                  <p className="text-sm font-mono">{current.tasksCompleted}/{current.tasksTotal}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={current.terminalStatus === "success" ? "default" : "destructive"}>
                    {current.terminalStatus}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Objective</p>
                <p className="text-sm">{current.objective}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cycle history */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Cycle History</CardTitle>
            <CardDescription className="text-xs">Last {history?.length || 0} autonomous cycles</CardDescription>
          </CardHeader>
          <CardContent>
            {!history ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No cycles yet. Run one above to start.
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((c: any) => {
                  const conf = parseFloat(c.confidence || "0");
                  const completed = c.completed_tasks || 0;
                  const total = c.total_tasks || 1;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                  return (
                    <div key={c.cycle_id} className="p-3 rounded-lg bg-secondary/30 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{c.cycle_id.slice(0, 16)}</span>
                          {c.terminal_status === "success" ? (
                            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">SUCCESS</Badge>
                          ) : c.terminal_status === "failed" ? (
                            <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">FAILED</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">{c.terminal_status}</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{c.objective}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Confidence: <span className="text-foreground font-mono">{(conf * 100).toFixed(0)}%</span></span>
                        <span>Tasks: <span className="text-foreground font-mono">{completed}/{total} ({pct}%)</span></span>
                        {c.recovery_events > 0 && (
                          <span className="text-amber-400">Recoveries: {c.recovery_events}</span>
                        )}
                      </div>
                      <Progress value={pct} className="mt-2 h-1" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Learnings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Patterns Learned
            </CardTitle>
            <CardDescription className="text-xs">Heuristics extracted from past cycles</CardDescription>
          </CardHeader>
          <CardContent>
            {!learnings || learnings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No learnings yet. Patterns are detected after cycles complete.
              </p>
            ) : (
              <div className="space-y-2">
                {learnings.map((l: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px]">{l.appliesTo || l.applies_to}</Badge>
                      <Badge variant="outline" className="text-[10px]">{l.pattern}</Badge>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        conf: {(parseFloat(l.confidence) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm">{l.insight}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(l.createdAt || l.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}