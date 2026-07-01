import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Globe, TrendingUp, Bot, Plus, Zap,
  ArrowUpRight, Clock, CheckCircle, AlertCircle, Inbox
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Brain } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { data: business, isLoading: bizLoading } = trpc.business.get.useQuery();
  const { data: activityData, isLoading: actLoading } = trpc.activity.feed.useQuery();
  const { data: contentData } = trpc.content.queue.useQuery();
  const { data: platformsData } = trpc.platforms.list.useQuery();
  const { data: analyticsData } = trpc.analytics.get.useQuery();
  const { data: roiData } = trpc.analytics.roi.useQuery();
  const { data: usageData } = trpc.usage.get.useQuery();
  const { data: planData } = trpc.usage.plan.useQuery();
  const { data: visibilityData } = trpc.visibility.latest.useQuery();
  const visibilityMutation = trpc.visibility.check.useMutation({
    onSuccess: () => toast.success("AI Visibility Score updated!"),
    onError: (err) => toast.error(err.message),
  });

  // Redirect to onboarding if no business
  useEffect(() => {
    if (!bizLoading && !business) {
      toast.info("Complete onboarding to set up your business");
      navigate("/onboarding");
    }
  }, [bizLoading, business, navigate]);

  // Compute real stats
  const publishedCount = contentData?.filter(c => c.status === "published").length || 0;
  const pendingCount = contentData?.filter(c => c.status === "pending").length || 0;
  const activePlatforms = platformsData?.filter(p => p.status === "active").length || 0;
  const totalPlatforms = platformsData?.length || 0;
  const postsUsed = usageData?.postsPublished || 0;
  const postsLimit = planData?.limits?.maxPostsPerMonth || 0;
  const isUnlimited = postsLimit === -1;

  // Build chart data from analytics
  const chartData = (() => {
    if (!analyticsData || analyticsData.length === 0) {
      return [{ name: "No data", value: 0 }];
    }
    // Group by month
    const grouped: Record<string, number> = {};
    analyticsData.forEach(a => {
      const date = new Date(a.recordedAt);
      const key = date.toLocaleDateString("en-US", { month: "short" });
      grouped[key] = (grouped[key] || 0) + (a.metricValue || 0);
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  })();

  const statusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "error": return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Command Center</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {business ? `${business.name} — AI content automation at a glance` : "Your AI content automation at a glance"}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/content")}>
              <Clock className="w-4 h-4 mr-2" /> View Queue
            </Button>
            <Button size="sm" className="gradient-orange text-black font-semibold hover:opacity-90" onClick={() => navigate("/content")}>
              <Plus className="w-4 h-4 mr-2" /> Create Content
            </Button>
          </div>
        </div>

        {/* AI Visibility Score Card */}
        <Card className="bg-card border-border border-primary/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl gradient-orange flex items-center justify-center">
                  <Brain className="w-7 h-7 text-black" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">AI Visibility Score</p>
                  <p className="text-4xl font-bold mt-0.5">
                    {visibilityData?.metricValue ?? "--"}
                    <span className="text-lg text-muted-foreground font-normal">/100</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Button size="sm" variant="outline" onClick={() => visibilityMutation.mutate()} disabled={visibilityMutation.isPending}>
                  {visibilityMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  {visibilityData ? `Last: ${new Date(visibilityData.recordedAt).toLocaleDateString()}` : "Not checked yet"}
                </p>
              </div>
            </div>
            {roiData && (
              <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-lg font-bold text-green-400">{roiData.published}</p>
                  <p className="text-[10px] text-muted-foreground">Published</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-yellow-400">{roiData.pending}</p>
                  <p className="text-[10px] text-muted-foreground">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-400">{roiData.citationsDetected}</p>
                  <p className="text-[10px] text-muted-foreground">Citations</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-primary">{roiData.visibilityScore}</p>
                  <p className="text-[10px] text-muted-foreground">Visibility</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Posts This Month</p>
                  {bizLoading ? <Skeleton className="h-8 w-16 mt-1" /> : (
                    <p className="text-3xl font-bold mt-1">{postsUsed}{!isUnlimited && <span className="text-lg text-muted-foreground font-normal">/{postsLimit}</span>}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{isUnlimited ? "Unlimited" : `${Math.max(0, postsLimit - postsUsed)} remaining`}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Platforms</p>
                  {bizLoading ? <Skeleton className="h-8 w-16 mt-1" /> : (
                    <p className="text-3xl font-bold mt-1">{activePlatforms}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">of {totalPlatforms} connected</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Analytics Events</p>
                  {bizLoading ? <Skeleton className="h-8 w-16 mt-1" /> : (
                    <p className="text-3xl font-bold mt-1">{analyticsData?.length || 0}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">total tracked</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Content Queue</p>
                  {bizLoading ? <Skeleton className="h-8 w-16 mt-1" /> : (
                    <p className="text-3xl font-bold mt-1">{contentData?.length || 0}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">items total</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <Card className="bg-card border-border lg:col-span-2">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Analytics Overview</h3>
                <Badge variant="outline" className="text-xs">{analyticsData?.length || 0} events</Badge>
              </div>
              {analyticsData && analyticsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0 0)" />
                    <XAxis dataKey="name" stroke="oklch(0.5 0 0)" fontSize={12} />
                    <YAxis stroke="oklch(0.5 0 0)" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: "oklch(0.2 0 0)", border: "1px solid oklch(0.3 0 0)", borderRadius: "8px" }} />
                    <Area type="monotone" dataKey="value" stroke="oklch(0.72 0.17 50)" fill="oklch(0.72 0.17 50 / 0.2)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground">
                  <TrendingUp className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No analytics data yet</p>
                  <p className="text-xs mt-1">Publish content to start tracking performance</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Activity Feed</h3>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/content")}>View all</Button>
              </div>
              <div className="space-y-3">
                {actLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="w-8 h-8 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))
                ) : activityData && activityData.length > 0 ? (
                  activityData.slice(0, 6).map((item: any) => (
                    <div key={item.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.action}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.platform && (
                            <Badge variant="outline" className="text-[10px]">{item.platform}</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Inbox className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">No activity yet</p>
                    <p className="text-xs mt-1">Generate or publish content to see activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigate("/content")}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg gradient-orange flex items-center justify-center">
                <Zap className="w-6 h-6 text-black" />
              </div>
              <div>
                <p className="font-semibold">Generate Content</p>
                <p className="text-xs text-muted-foreground">AI-powered content for all platforms</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigate("/platforms")}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Globe className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="font-semibold">Connect Platform</p>
                <p className="text-xs text-muted-foreground">Add new publishing channels</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigate("/analytics")}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="font-semibold">View Analytics</p>
                <p className="text-xs text-muted-foreground">Track performance across platforms</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
