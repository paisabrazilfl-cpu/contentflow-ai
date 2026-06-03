import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import {
  TrendingUp, Bot, Globe, Eye, MousePointer, Inbox
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";

export default function Analytics() {
  const { data: analyticsData, isLoading } = trpc.analytics.get.useQuery();
  const { data: contentData } = trpc.content.queue.useQuery();
  const { data: platformsData } = trpc.platforms.list.useQuery();

  // Compute platform performance from content queue
  const platformPerformance = (() => {
    if (!contentData) return [];
    const grouped: Record<string, { posts: number; published: number }> = {};
    contentData.forEach(item => {
      if (!grouped[item.platform]) grouped[item.platform] = { posts: 0, published: 0 };
      grouped[item.platform].posts++;
      if (item.status === "published") grouped[item.platform].published++;
    });
    return Object.entries(grouped).map(([name, data]) => ({ name, ...data }));
  })();

  // Build time series from analytics logs
  const timeSeriesData = (() => {
    if (!analyticsData || analyticsData.length === 0) return [];
    const grouped: Record<string, number> = {};
    analyticsData.forEach(a => {
      const date = new Date(a.recordedAt);
      const key = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      grouped[key] = (grouped[key] || 0) + (a.metricValue || 0);
    });
    return Object.entries(grouped).slice(-12).map(([name, value]) => ({ name, value }));
  })();

  // Top content from published items
  const topContent = contentData
    ?.filter(c => c.status === "published")
    ?.slice(0, 5)
    ?.map(c => ({
      title: c.title || "Untitled",
      platform: c.platform,
      publishedAt: c.publishedAt ? new Date(c.publishedAt).toLocaleDateString() : "N/A",
    })) || [];

  const totalPublished = contentData?.filter(c => c.status === "published").length || 0;
  const totalPending = contentData?.filter(c => c.status === "pending").length || 0;
  const totalFailed = contentData?.filter(c => c.status === "failed").length || 0;
  const totalAnalyticsEvents = analyticsData?.length || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground text-sm mt-1">Track content performance across all platforms</p>
          </div>
          <Badge variant="outline" className="text-xs">{totalAnalyticsEvents} events tracked</Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{totalPublished}</p>}
                  <p className="text-xs text-muted-foreground">Published</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <MousePointer className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{totalPending}</p>}
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{totalFailed}</p>}
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{platformsData?.length || 0}</p>}
                  <p className="text-xs text-muted-foreground">Platforms</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Over Time */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Activity Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {timeSeriesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0 0)" />
                    <XAxis dataKey="name" stroke="oklch(0.5 0 0)" fontSize={11} />
                    <YAxis stroke="oklch(0.5 0 0)" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "oklch(0.2 0 0)", border: "1px solid oklch(0.3 0 0)", borderRadius: "8px" }} />
                    <Area type="monotone" dataKey="value" stroke="oklch(0.72 0.17 50)" fill="oklch(0.72 0.17 50 / 0.2)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground">
                  <TrendingUp className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No analytics data yet</p>
                  <p className="text-xs mt-1">Publish content to start tracking</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform Performance */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Platform Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {platformPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={platformPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0 0)" />
                    <XAxis dataKey="name" stroke="oklch(0.5 0 0)" fontSize={11} />
                    <YAxis stroke="oklch(0.5 0 0)" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "oklch(0.2 0 0)", border: "1px solid oklch(0.3 0 0)", borderRadius: "8px" }} />
                    <Bar dataKey="posts" fill="oklch(0.72 0.17 50)" radius={[4, 4, 0, 0]} name="Total Posts" />
                    <Bar dataKey="published" fill="oklch(0.6 0.15 160)" radius={[4, 4, 0, 0]} name="Published" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground">
                  <Globe className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No platform data yet</p>
                  <p className="text-xs mt-1">Create content for different platforms</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Content */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Recently Published Content</CardTitle>
          </CardHeader>
          <CardContent>
            {topContent.length > 0 ? (
              <div className="space-y-3">
                {topContent.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px]">{item.platform}</Badge>
                          <span className="text-xs text-muted-foreground">{item.publishedAt}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Inbox className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No published content yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
