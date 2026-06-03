import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Link2, Loader2, Unlink } from "lucide-react";

const PLATFORMS = [
  {
    id: "google_youtube" as const,
    name: "YouTube",
    description: "Upload videos and post community updates",
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    icon: "▶",
  },
  {
    id: "google_business" as const,
    name: "Google Business",
    description: "Post updates to your Google Business Profile",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    icon: "G",
  },
  {
    id: "meta_facebook" as const,
    name: "Facebook",
    description: "Publish posts and photos to your Facebook Pages",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    icon: "f",
  },
  {
    id: "meta_instagram" as const,
    name: "Instagram",
    description: "Post photos and reels to your Instagram Business account",
    color: "text-pink-400",
    bgColor: "bg-pink-400/10",
    icon: "📷",
  },
  {
    id: "tiktok" as const,
    name: "TikTok",
    description: "Upload videos to your TikTok creator account",
    color: "text-foreground",
    bgColor: "bg-secondary",
    icon: "♪",
  },
  {
    id: "reddit" as const,
    name: "Reddit",
    description: "Submit posts to subreddits",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    icon: "👾",
  },
];

type PlatformId = typeof PLATFORMS[number]["id"];

export default function Connections() {
  const [connecting, setConnecting] = useState<PlatformId | null>(null);
  const utils = trpc.useUtils();

  const { data: accounts, isLoading } = trpc.oauth.list.useQuery();
  const getAuthUrl = trpc.oauth.getAuthUrl.useMutation();
  const disconnect = trpc.oauth.disconnect.useMutation({
    onSuccess: () => {
      utils.oauth.list.invalidate();
      toast.success("Platform disconnected");
    },
    onError: (err) => toast.error(err.message),
  });

  const connectedMap = new Map(accounts?.map((a) => [a.platform, a]));

  const handleConnect = async (platformId: PlatformId) => {
    setConnecting(platformId);
    try {
      const redirectUri = `${window.location.origin}/oauth/callback`;
      const result = await getAuthUrl.mutateAsync({ platform: platformId, redirectUri });
      // Store platform in sessionStorage for callback
      sessionStorage.setItem("oauth_platform", platformId);
      sessionStorage.setItem("oauth_redirect_uri", redirectUri);
      window.location.href = result.url;
    } catch (err) {
      toast.error("Failed to initiate OAuth flow");
      setConnecting(null);
    }
  };

  const handleDisconnect = (platformId: PlatformId) => {
    disconnect.mutate({ platform: platformId });
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Platform Connections</h1>
        <p className="text-muted-foreground mt-1">Connect your social media accounts to enable publishing.</p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-card border border-border animate-pulse" />
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
                className={`p-5 rounded-xl border transition-all ${
                  isConnected ? "border-primary/30 bg-card" : "border-border bg-card"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${platform.bgColor} flex items-center justify-center text-lg flex-shrink-0`}>
                    {platform.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-foreground text-sm">{platform.name}</h3>
                      {isConnected && (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle2 className="w-3 h-3" /> Connected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{platform.description}</p>
                    {isConnected && account.platformUsername && (
                      <p className="text-xs text-muted-foreground mt-1">@{account.platformUsername}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  {isConnected ? (
                    <button
                      onClick={() => handleDisconnect(platform.id)}
                      disabled={disconnect.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/10 transition-all disabled:opacity-50"
                    >
                      <Unlink className="w-3.5 h-3.5" /> Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(platform.id)}
                      disabled={isConnecting}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
                    >
                      {isConnecting ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting...</>
                      ) : (
                        <><Link2 className="w-3.5 h-3.5" /> Connect</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 p-4 rounded-xl border border-border bg-card">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Note:</strong> OAuth credentials must be configured in your environment variables before connecting platforms. See <code className="text-primary">ENV_TEMPLATE.md</code> for the full list of required variables.
        </p>
      </div>
    </div>
  );
}
