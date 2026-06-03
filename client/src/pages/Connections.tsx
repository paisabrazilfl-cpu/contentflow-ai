import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Link2, Loader2, Unlink } from "lucide-react";

const PLATFORMS = [
  {
    id: "google_youtube" as const,
    name: "YouTube",
    description: "Upload videos and post community updates to your YouTube channel",
    emoji: "▶",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
  },
  {
    id: "google_business" as const,
    name: "Google Business",
    description: "Post updates and offers to your Google Business Profile",
    emoji: "G",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
  },
  {
    id: "meta_facebook" as const,
    name: "Facebook",
    description: "Publish posts and photos to your Facebook Pages",
    emoji: "f",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    id: "meta_instagram" as const,
    name: "Instagram",
    description: "Post photos and reels to your Instagram Business account",
    emoji: "📷",
    color: "text-pink-400",
    bg: "bg-pink-400/10",
    border: "border-pink-400/20",
  },
  {
    id: "tiktok" as const,
    name: "TikTok",
    description: "Upload videos to your TikTok creator account",
    emoji: "♪",
    color: "text-foreground",
    bg: "bg-white/5",
    border: "border-white/10",
  },
  {
    id: "reddit" as const,
    name: "Reddit",
    description: "Submit posts to subreddits from your Reddit account",
    emoji: "👾",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/20",
  },
] as const;

type PlatformId = typeof PLATFORMS[number]["id"];

export default function Connections() {
  const [connecting, setConnecting] = useState<PlatformId | null>(null);
  const utils = trpc.useUtils();

  const { data: accounts, isLoading: accountsLoading } = trpc.oauth.list.useQuery();
  const { data: configuredPlatforms, isLoading: configLoading } = trpc.oauth.getConfiguredPlatforms.useQuery();

  const getAuthUrl = trpc.oauth.getAuthUrl.useMutation();
  const disconnect = trpc.oauth.disconnect.useMutation({
    onSuccess: () => {
      utils.oauth.list.invalidate();
      toast.success("Platform disconnected");
    },
    onError: (err) => toast.error(err.message),
  });

  const isLoading = accountsLoading || configLoading;
  const connectedMap = new Map(accounts?.map((a) => [a.platform, a]));
  const configuredSet = new Set(configuredPlatforms ?? []);

  const handleConnect = async (platformId: PlatformId) => {
    setConnecting(platformId);
    try {
      const redirectUri = `${window.location.origin}/oauth/callback`;
      const result = await getAuthUrl.mutateAsync({ platform: platformId, redirectUri });
      sessionStorage.setItem("oauth_platform", platformId);
      sessionStorage.setItem("oauth_redirect_uri", redirectUri);
      window.location.href = result.url;
    } catch {
      toast.error("Could not start the connection. Please try again.");
      setConnecting(null);
    }
  };

  const handleDisconnect = (platformId: PlatformId) => {
    disconnect.mutate({ platform: platformId });
  };

  const connectedCount = accounts?.length ?? 0;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Connected Platforms</h1>
        <p className="text-muted-foreground mt-1">
          Connect your accounts to start publishing AI-generated content automatically.
        </p>
      </div>

      {/* Connected count badge */}
      {!isLoading && connectedCount > 0 && (
        <div className="flex items-center gap-2 mb-6 px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/20 w-fit">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            {connectedCount} platform{connectedCount !== 1 ? "s" : ""} connected
          </span>
        </div>
      )}

      {/* Platform grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {PLATFORMS.map((platform) => {
            const account = connectedMap.get(platform.id);
            const isConnected = !!account;
            const isConfigured = configuredSet.has(platform.id);
            const isConnecting = connecting === platform.id;

            return (
              <div
                key={platform.id}
                className={`relative p-5 rounded-2xl border transition-all ${
                  isConnected
                    ? "border-primary/30 bg-card"
                    : isConfigured
                    ? "border-border bg-card hover:border-border/80"
                    : "border-border/40 bg-card/50 opacity-60"
                }`}
              >
                {/* Coming soon badge for unconfigured */}
                {!isConfigured && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs font-medium">
                    Coming Soon
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Platform icon */}
                  <div
                    className={`w-11 h-11 rounded-xl ${platform.bg} border ${platform.border} flex items-center justify-center text-lg flex-shrink-0 font-bold ${platform.color}`}
                  >
                    {platform.emoji}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-foreground text-sm">{platform.name}</h3>
                      {isConnected && (
                        <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Connected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {platform.description}
                    </p>
                    {isConnected && account.platformUsername && (
                      <p className="text-xs text-primary mt-1 font-medium">
                        @{account.platformUsername}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action button */}
                <div className="mt-4 flex justify-end">
                  {isConnected ? (
                    <button
                      onClick={() => handleDisconnect(platform.id)}
                      disabled={disconnect.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/10 transition-all disabled:opacity-50"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      Disconnect
                    </button>
                  ) : isConfigured ? (
                    <button
                      onClick={() => handleConnect(platform.id)}
                      disabled={isConnecting}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 shadow-sm"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Connecting…
                        </>
                      ) : (
                        <>
                          <Link2 className="w-3.5 h-3.5" />
                          Connect
                        </>
                      )}
                    </button>
                  ) : (
                    // Unconfigured — no button, just the Coming Soon badge above
                    null
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state if nothing is configured yet */}
      {!isLoading && configuredSet.size === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-border">
          <Link2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="font-semibold text-foreground">No platforms available yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Platform connections are being set up. Check back soon.
          </p>
        </div>
      )}
    </div>
  );
}
