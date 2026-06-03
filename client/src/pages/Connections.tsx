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
    description: "Upload and publish videos to your TikTok creator account",
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

  const { data: accounts, isLoading } = trpc.oauth.list.useQuery();
  // configuredPlatforms tells us which platforms have server-side credentials —
  // used only to decide whether to show an error toast on click, never to hide buttons.
  const { data: configuredPlatforms } = trpc.oauth.getConfiguredPlatforms.useQuery();

  const getAuthUrl = trpc.oauth.getAuthUrl.useMutation();
  const disconnect = trpc.oauth.disconnect.useMutation({
    onSuccess: () => {
      utils.oauth.list.invalidate();
      toast.success("Platform disconnected");
    },
    onError: (err) => toast.error(err.message),
  });

  const connectedMap = new Map(accounts?.map((a) => [a.platform, a]));
  const configuredSet = new Set(configuredPlatforms ?? []);
  const connectedCount = accounts?.length ?? 0;

  const handleConnect = async (platformId: PlatformId) => {
    // If server credentials aren't configured yet, show a friendly toast instead of an error page
    if (configuredPlatforms !== undefined && !configuredSet.has(platformId)) {
      toast.info("This platform will be available soon. Check back shortly.");
      return;
    }

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

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Connected Platforms</h1>
        <p className="text-muted-foreground mt-1">
          Connect your social media accounts to start publishing AI-generated content automatically.
        </p>
      </div>

      {/* Connected count */}
      {!isLoading && connectedCount > 0 && (
        <div className="flex items-center gap-2 mb-6 px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/20 w-fit">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            {connectedCount} platform{connectedCount !== 1 ? "s" : ""} connected
          </span>
        </div>
      )}

      {/* Platform grid — always shows all 6 */}
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
            const isConnecting = connecting === platform.id;

            return (
              <div
                key={platform.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isConnected
                    ? "border-primary/30 bg-card"
                    : "border-border bg-card hover:border-border/60"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
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

                {/* Action */}
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
                  ) : (
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
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
