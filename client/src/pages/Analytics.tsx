import { trpc } from "@/lib/trpc";
import { BarChart3, CheckCircle2, Clock, Link2, Sparkles, XCircle } from "lucide-react";

const PLATFORM_LABELS: Record<string, string> = {
  google_youtube: "YouTube",
  google_business: "Google Business",
  meta_facebook: "Facebook",
  meta_instagram: "Instagram",
  tiktok: "TikTok",
  reddit: "Reddit",
};

const PLATFORM_COLORS: Record<string, string> = {
  google_youtube: "bg-red-400",
  google_business: "bg-blue-400",
  meta_facebook: "bg-blue-500",
  meta_instagram: "bg-pink-400",
  tiktok: "bg-foreground",
  reddit: "bg-orange-400",
};

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } = trpc.analytics.getDashboardStats.useQuery();
  const { data: queueStats, isLoading: queueLoading } = trpc.analytics.getQueueStats.useQuery();
  const { data: usage } = trpc.content.getUsage.useQuery();

  const isLoading = statsLoading || queueLoading;

  const totalPosts = queueStats?.total ?? 0;
  const published = queueStats?.byStatus?.published ?? 0;
  const failed = queueStats?.byStatus?.failed ?? 0;
  const pending = queueStats?.byStatus?.pending ?? 0;
  const successRate = totalPosts > 0 ? Math.round((published / totalPosts) * 100) : 0;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your content performance and usage across all platforms.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Key metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Posts", value: totalPosts, icon: BarChart3, color: "text-primary" },
              { label: "Published", value: published, icon: CheckCircle2, color: "text-green-400" },
              { label: "Pending", value: pending, icon: Clock, color: "text-yellow-400" },
              { label: "Failed", value: failed, icon: XCircle, color: "text-destructive" },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="p-5 rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <Icon className={`w-4 h-4 ${m.color}`} />
                  </div>
                  <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                </div>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Success rate */}
            <div className="p-5 rounded-xl border border-border bg-card">
              <h2 className="font-semibold text-foreground text-sm mb-4">Publishing Success Rate</h2>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="oklch(0.22 0.01 240)" strokeWidth="2.5" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke="oklch(0.65 0.18 40)" strokeWidth="2.5"
                      strokeDasharray={`${successRate} ${100 - successRate}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
                    {successRate}%
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    <span className="text-muted-foreground">Published: <span className="text-foreground font-medium">{published}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                    <span className="text-muted-foreground">Failed: <span className="text-foreground font-medium">{failed}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <span className="text-muted-foreground">Pending: <span className="text-foreground font-medium">{pending}</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Posts by platform */}
            <div className="p-5 rounded-xl border border-border bg-card">
              <h2 className="font-semibold text-foreground text-sm mb-4">Posts by Platform</h2>
              {Object.keys(queueStats?.byPlatform ?? {}).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                  <BarChart3 className="w-8 h-8 opacity-30 mb-2" />
                  <p className="text-sm">No data yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(queueStats?.byPlatform ?? {}).map(([platform, count]) => {
                    const pct = totalPosts > 0 ? Math.round((count / totalPosts) * 100) : 0;
                    return (
                      <div key={platform}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{PLATFORM_LABELS[platform] ?? platform}</span>
                          <span className="text-foreground font-medium">{count}</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${PLATFORM_COLORS[platform] ?? "bg-primary"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* AI Usage */}
          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground text-sm">AI Generation Usage — {usage?.month}</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{usage?.used ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Used</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{usage?.limit ?? "∞"}</p>
                <p className="text-xs text-muted-foreground mt-1">Limit</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground capitalize">{usage?.plan ?? "free"}</p>
                <p className="text-xs text-muted-foreground mt-1">Plan</p>
              </div>
            </div>
            {usage?.limit && (
              <div className="mt-4">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((usage.used ?? 0) / usage.limit) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Connected platforms */}
          <div className="mt-6 p-5 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <Link2 className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground text-sm">Connected Platforms</h2>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats?.connectedPlatforms ?? 0} <span className="text-sm font-normal text-muted-foreground">of 6 platforms connected</span></p>
            <a href="/connections" className="text-xs text-primary hover:text-primary/80 transition-colors mt-2 inline-block">
              Manage connections →
            </a>
          </div>
        </>
      )}
    </div>
  );
}
