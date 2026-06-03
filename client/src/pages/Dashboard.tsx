import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Link2,
  Sparkles,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useLocation } from "wouter";

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: React.ElementType; sub?: string }) {
  return (
    <div className="p-5 rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: stats, isLoading } = trpc.analytics.getDashboardStats.useQuery();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          {greeting()}, {user?.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your content today.</p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="AI Generations"
            value={stats?.generationsUsed ?? 0}
            icon={Sparkles}
            sub={stats?.generationLimit ? `of ${stats.generationLimit} this month` : "Unlimited"}
          />
          <StatCard
            label="Connected Platforms"
            value={stats?.connectedPlatforms ?? 0}
            icon={Link2}
            sub="of 6 available"
          />
          <StatCard
            label="Posts Published"
            value={stats?.publishedCount ?? 0}
            icon={CheckCircle2}
            sub="all time"
          />
          <StatCard
            label="Posts Pending"
            value={stats?.pendingCount ?? 0}
            icon={Clock}
            sub="in queue"
          />
        </div>
      )}

      {/* Usage bar */}
      {stats?.generationLimit && (
        <div className="p-5 rounded-xl border border-border bg-card mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium text-foreground text-sm">AI Generation Usage</p>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">{stats.plan} plan</p>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {stats.generationsUsed} / {stats.generationLimit}
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(100, (stats.generationsUsed / stats.generationLimit) * 100)}%` }}
            />
          </div>
          {stats.generationsUsed >= stats.generationLimit && (
            <p className="text-xs text-destructive mt-2 flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Limit reached — upgrade to continue generating
            </p>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Generate Content", desc: "Create AI-optimized posts", icon: Sparkles, href: "/generate", color: "text-primary" },
          { label: "Connect Platform", desc: "Link your social accounts", icon: Link2, href: "/connections", color: "text-blue-400" },
          { label: "Schedule Post", desc: "Queue content for publishing", icon: Calendar, href: "/queue", color: "text-green-400" },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.href)}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <Icon className={`w-5 h-5 ${action.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          );
        })}
      </div>

      {/* Recent content */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Recent Generations</h2>
          <button
            onClick={() => navigate("/generate")}
            className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            Generate new <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        {!stats?.recentContent?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Sparkles className="w-10 h-10 text-muted-foreground/50 mb-3" />
            <p className="font-medium text-foreground">No content yet</p>
            <p className="text-sm text-muted-foreground mt-1">Generate your first piece of AI content to get started.</p>
            <button
              onClick={() => navigate("/generate")}
              className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Generate Now
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {stats.recentContent.map((item) => (
              <div key={item.id} className="px-5 py-3.5 flex items-start gap-3">
                <div className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.prompt ?? "Untitled"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.platform?.replace(/_/g, " ")} · {item.contentType?.replace(/_/g, " ")} ·{" "}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
