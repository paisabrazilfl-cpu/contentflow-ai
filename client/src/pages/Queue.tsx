import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Calendar, CheckCircle2, Clock, Loader2, Trash2, XCircle, AlertCircle } from "lucide-react";

const PLATFORM_LABELS: Record<string, string> = {
  google_youtube: "YouTube",
  google_business: "Google Business",
  meta_facebook: "Facebook",
  meta_instagram: "Instagram",
  tiktok: "TikTok",
  reddit: "Reddit",
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-yellow-400" },
  processing: { label: "Processing", icon: Loader2, color: "text-blue-400" },
  published: { label: "Published", icon: CheckCircle2, color: "text-green-400" },
  failed: { label: "Failed", icon: XCircle, color: "text-destructive" },
  cancelled: { label: "Cancelled", icon: AlertCircle, color: "text-muted-foreground" },
};

export default function Queue() {
  const utils = trpc.useUtils();
  const { data: queue, isLoading } = trpc.content.getQueue.useQuery();
  const deleteItem = trpc.content.deleteQueueItem.useMutation({
    onSuccess: () => {
      utils.content.getQueue.invalidate();
      toast.success("Post removed from queue");
    },
    onError: (err) => toast.error(err.message),
  });

  const pending = queue?.filter((q) => q.status === "pending") ?? [];
  const published = queue?.filter((q) => q.status === "published") ?? [];
  const failed = queue?.filter((q) => q.status === "failed") ?? [];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Content Queue</h1>
        <p className="text-muted-foreground mt-1">Scheduled posts are published automatically every 5 minutes.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Pending", value: pending.length, color: "text-yellow-400" },
          { label: "Published", value: published.length, color: "text-green-400" },
          { label: "Failed", value: failed.length, color: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl border border-border bg-card text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : !queue?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border bg-card">
          <Calendar className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="font-semibold text-foreground">No posts in queue</p>
          <p className="text-sm text-muted-foreground mt-1">Generate content and schedule it to see it here.</p>
          <a
            href="/generate"
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Generate Content
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((item) => {
            const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = statusCfg.icon;
            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-border bg-card flex items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                      {PLATFORM_LABELS[item.platform] ?? item.platform}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {item.contentType.replace(/_/g, " ")}
                    </span>
                    <span className={`flex items-center gap-1 text-xs font-medium ${statusCfg.color}`}>
                      <StatusIcon className={`w-3 h-3 ${item.status === "processing" ? "animate-spin" : ""}`} />
                      {statusCfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">{item.body}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.status === "published" && item.publishedAt
                        ? `Published ${new Date(item.publishedAt).toLocaleString()}`
                        : `Scheduled ${new Date(item.scheduledAt).toLocaleString()}`}
                    </span>
                  </div>
                  {item.errorMessage && (
                    <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {item.errorMessage}
                    </p>
                  )}
                </div>
                {item.status !== "published" && (
                  <button
                    onClick={() => deleteItem.mutate({ id: item.id })}
                    disabled={deleteItem.isPending}
                    className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 mt-0.5"
                    title="Remove from queue"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
