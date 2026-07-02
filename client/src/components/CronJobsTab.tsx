/**
 * Cron Jobs Tab — Scheduled Jobs UI
 *
 * Lets users create prompt-based automated tasks assigned to swarm agents.
 * Jobs run on schedule, dispatching their prompt to the chosen agent.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Clock, Play, Pause, Trash2, Plus, Loader2, Bot, Zap, X, Calendar
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";

const SCHEDULES = [
  { id: "every_minute", label: "Every minute" },
  { id: "every_5_min", label: "Every 5 min" },
  { id: "every_15_min", label: "Every 15 min" },
  { id: "every_30_min", label: "Every 30 min" },
  { id: "every_hour", label: "Every hour" },
  { id: "every_6_hours", label: "Every 6 hours" },
  { id: "daily_midnight", label: "Daily midnight" },
  { id: "weekly_monday", label: "Weekly Monday" },
];

const AGENT_COLORS: Record<string, string> = {
  "ABBY": "from-purple-500 to-pink-500",
  "FORGE": "from-orange-500 to-red-500",
  "CRAWLER": "from-green-500 to-emerald-500",
  "VAULT": "from-blue-500 to-cyan-500",
  "WIRE": "from-yellow-500 to-amber-500",
  "MR.NICE": "from-pink-500 to-rose-500",
};

export function CronJobsTab() {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [agent, setAgent] = useState<string>("ABBY");
  const [schedule, setSchedule] = useState<string>("every_hour");
  const [prompt, setPrompt] = useState("");

  const { data: jobs, isLoading, refetch } = trpc.cronJobs.list.useQuery();
  const { data: agents } = trpc.cronJobs.agents.useQuery();

  const createMutation = trpc.cronJobs.create.useMutation({
    onSuccess: () => {
      toast.success("Job scheduled");
      setShowForm(false);
      setName(""); setPrompt("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMutation = trpc.cronJobs.toggle.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.cronJobs.delete.useMutation({
    onSuccess: () => { toast.success("Job deleted"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const runNowMutation = trpc.cronJobs.runNow.useMutation({
    onSuccess: () => { toast.success("Job ran"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const activeCount = jobs?.filter((j: any) => j.status === "active").length || 0;
  const pausedCount = jobs?.filter((j: any) => j.status === "paused").length || 0;
  const totalRuns = jobs?.reduce((acc: number, j: any) => acc + (j.totalRuns || 0), 0) || 0;

  const formatTime = (date: any) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-US", {
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });
  };

  const formatSchedule = (s: string) => {
    return SCHEDULES.find(x => x.id === s)?.label || s;
  };

  const handleSubmit = () => {
    if (!name.trim() || !prompt.trim()) {
      toast.error("Fill in name and task description");
      return;
    }
    createMutation.mutate({ name, agent: agent as any, schedule: schedule as any, prompt });
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Stats header */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-400">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Paused</p>
            <p className="text-2xl font-bold text-amber-400">{pausedCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total runs</p>
            <p className="text-2xl font-bold text-primary">{totalRuns}</p>
          </CardContent>
        </Card>
      </div>

      {/* Schedule new job */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Schedule a new job</CardTitle>
              <CardDescription className="text-xs mt-1">
                Prompt-based, fully autonomous. The agent runs your task on schedule and writes the result to your content queue.
              </CardDescription>
            </div>
            {!showForm && (
              <Button size="sm" onClick={() => setShowForm(true)} className="gradient-orange text-black font-semibold">
                <Plus className="w-4 h-4 mr-2" /> New Job
              </Button>
            )}
          </div>
        </CardHeader>
        {showForm && (
          <CardContent className="space-y-3 md:space-y-4 p-3 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Job name</Label>
                <Input
                  className="mt-1"
                  placeholder="e.g., Daily AI news post"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Schedule</Label>
                <select
                  className="mt-1 w-full h-10 px-3 rounded-md bg-secondary border border-border text-sm"
                  value={schedule}
                  onChange={e => setSchedule(e.target.value)}
                >
                  {SCHEDULES.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Assign to agent</Label>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                {agents?.map((a: any) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAgent(a.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      agent === a.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary/30 hover:bg-secondary/60"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${AGENT_COLORS[a.id] || "from-gray-500 to-gray-700"} flex items-center justify-center`}>
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{a.name}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{a.role}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">Task (plain English — the agent dispatches it)</Label>
              <textarea
                className="mt-1 w-full min-h-[100px] px-3 py-2 rounded-md bg-secondary border border-border text-sm resize-y"
                placeholder="e.g., I want you to post AI news to my Instagram every hour"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSubmit} disabled={createMutation.isPending} className="gradient-orange text-black font-semibold">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                Schedule job
              </Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setName(""); setPrompt(""); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Jobs list */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Scheduled jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : jobs && jobs.length > 0 ? (
            <div className="space-y-3">
              {jobs.map((job: any) => (
                <div
                  key={job.id}
                  className="flex items-start justify-between p-3 md:p-4 rounded-lg bg-secondary/30 border border-border gap-2"
                >
                  <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br ${AGENT_COLORS[job.agent] || "from-gray-500 to-gray-700"} flex items-center justify-center flex-shrink-0`}>
                      <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{job.name}</p>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {job.agent}
                        </Badge>
                        <Badge
                          className={
                            job.status === "active"
                              ? "bg-green-500/10 text-green-400 border-green-500/20 text-[10px]"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]"
                          }
                        >
                          {job.status === "active" ? "ACTIVE" : "PAUSED"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{job.prompt}</p>
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatSchedule(job.schedule)}
                        </span>
                        <span>last: {formatTime(job.lastRun)}</span>
                        <span>next: {formatTime(job.nextRun)}</span>
                        <span>{job.totalRuns || 0} runs</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <Button
                      variant="ghost" size="sm" className="h-8 w-8 p-0"
                      onClick={() => runNowMutation.mutate({ id: job.id })}
                      disabled={runNowMutation.isPending}
                      title="Run now"
                    >
                      <Play className="w-4 h-4 text-green-400" />
                    </Button>
                    <Button
                      variant="ghost" size="sm" className="h-8 w-8 p-0"
                      onClick={() => toggleMutation.mutate({ id: job.id, status: job.status === "active" ? "paused" : "active" })}
                      title={job.status === "active" ? "Pause" : "Resume"}
                    >
                      {job.status === "active" ? (
                        <Pause className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Play className="w-4 h-4 text-green-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost" size="sm" className="h-8 w-8 p-0"
                      onClick={() => {
                        if (window.confirm(`Delete job "${job.name}"?`)) {
                          deleteMutation.mutate({ id: job.id });
                        }
                      }}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No scheduled jobs yet</p>
              <p className="text-xs mt-1">Create one above to run autonomous tasks on a schedule</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
