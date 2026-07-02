import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2, Link2, Loader2, Unlink, ChevronDown, Search,
  ExternalLink, Plug, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
  const [composioConnecting, setComposioConnecting] = useState<string | null>(null);
  const [showComposioDropdown, setShowComposioDropdown] = useState(false);
  const [composioSearch, setComposioSearch] = useState("");
  const utils = trpc.useUtils();

  const { data: accounts, isLoading } = trpc.oauth.list.useQuery();
  const { data: configuredPlatforms } = trpc.oauth.getConfiguredPlatforms.useQuery();

  // Composio data
  const { data: composioData } = trpc.platforms.composioList.useQuery();
  const composioAuthConfigsQuery = trpc.platforms.composioAuthConfigs.useQuery();

  const getAuthUrl = trpc.oauth.getAuthUrl.useMutation();
  const disconnect = trpc.oauth.disconnect.useMutation({
    onSuccess: () => {
      utils.oauth.list.invalidate();
      toast.success("Platform disconnected");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleComposioConnect = async (platform: string) => {
    setComposioConnecting(platform);
    try {
      const result = await utils.client.platforms.composioConnect.mutate({ platform });
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        toast.error("No redirect URL returned. Check API key configuration.");
        setComposioConnecting(null);
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to start Composio connection");
      setComposioConnecting(null);
    }
  };

  const connectedMap = new Map(accounts?.map((a) => [a.platform, a]));
  const configuredSet = new Set(configuredPlatforms ?? []);
  const connectedCount = accounts?.length ?? 0;

  // Build a unified list of all available services (Composio + direct OAuth)
  const composioPlatforms = (composioData as any)?.composioPlatforms || [];
  const composioEnabled = (composioData as any)?.composioEnabled || false;

  // Filter by search
  const filteredServices = composioPlatforms.filter((s: any) =>
    !composioSearch ||
    s.name?.toLowerCase().includes(composioSearch.toLowerCase()) ||
    s.description?.toLowerCase().includes(composioSearch.toLowerCase())
  );

  const handleConnect = async (platformId: PlatformId) => {
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
    <div className="px-2 md:px-0 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Connected Platforms <span className="text-xs text-muted-foreground font-normal">v2.0</span></h1>
        <p className="text-muted-foreground text-xs md:text-sm mt-1">
          Connect your social media accounts to start publishing AI-generated content automatically.
        </p>
      </div>

      {/* ═══════════ COMPOSIO CONNECTOR ═══════════ */}
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/30 mb-6">
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Connect via Composio
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                One-click OAuth for 1000+ apps — Instagram, Facebook, TikTok, Gmail, GitHub, Reddit, and more.
                Uses your existing Composio auth configs.
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowComposioDropdown(!showComposioDropdown)}
              className="gradient-orange text-black font-semibold"
            >
              <Plug className="w-4 h-4 mr-2" />
              {showComposioDropdown ? "Hide" : "Browse Services"}
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showComposioDropdown ? "rotate-180" : ""}`} />
            </Button>
          </div>
        </CardHeader>

        {showComposioDropdown && (
          <CardContent className="pt-0 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search 1000+ services..."
                className="pl-9"
                value={composioSearch}
                onChange={e => setComposioSearch(e.target.value)}
              />
            </div>

            {/* Service list */}
            <div className="max-h-96 overflow-y-auto border border-border rounded-lg bg-background/50">
              {!composioEnabled ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Composio not configured. Set COMPOSIO_API_KEY in Render env vars to enable 1000+ integrations.
                </div>
              ) : composioPlatforms.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  <p className="font-medium text-foreground mb-1">No auth configs found yet</p>
                  <p>Add auth configs in your{" "}
                    <a
                      href="https://dashboard.composio.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Composio dashboard
                      <ExternalLink className="w-3 h-3" />
                    </a>{" "}
                    to enable services. (You have Gmail, Google Drive, Reddit, LinkedIn, etc. ready to go.)
                  </p>
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No services match "{composioSearch}"
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredServices.map((service: any) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-3 hover:bg-secondary/30 transition-colors gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold">{service.name}</p>
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-green-500/10 text-green-400 border-green-500/20"
                          >
                            Ready
                          </Badge>
                          {service.toolsCount > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              {service.toolsCount} tools
                            </span>
                          )}
                          {service.connections?.length > 0 && (
                            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary">
                              {service.connections.length} connected
                            </Badge>
                          )}
                        </div>
                        {service.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {service.description}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleComposioConnect(service.id)}
                        disabled={composioConnecting === service.id}
                        className="flex-shrink-0"
                      >
                        {composioConnecting === service.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Link2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {composioEnabled && composioPlatforms.length > 0 && (
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  {filteredServices.length} service{filteredServices.length !== 1 ? "s" : ""} shown
                  {(composioData as any)?.composioToolkitsCount > composioPlatforms.length && (
                    <> · {(composioData as any).composioToolkitsCount - composioPlatforms.length} need auth config</>
                  )}
                </span>
                <a
                  href="https://dashboard.composio.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  Manage auth configs
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Connected count */}
      {!isLoading && connectedCount > 0 && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 w-fit">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-primary">
            {connectedCount} platform{connectedCount !== 1 ? "s" : ""} connected
          </span>
        </div>
      )}

      {/* Native OAuth platforms — quick connect */}
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-foreground">Direct OAuth (App Credentials)</h2>
        <p className="text-xs text-muted-foreground">Connect with your own app credentials — requires you to register an OAuth app.</p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {PLATFORMS.map((platform) => {
            const account = connectedMap.get(platform.id);
            const isConnected = !!account;
            const isConnecting = connecting === platform.id;

            return (
              <div
                key={platform.id}
                className={`p-3 md:p-4 rounded-xl border transition-all ${
                  isConnected ? "border-primary/30 bg-card" : "border-border bg-card"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 md:w-10 md:h-10 rounded-lg ${platform.bg} border ${platform.border} flex items-center justify-center text-base flex-shrink-0 font-bold ${platform.color}`}
                  >
                    {platform.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <h3 className="font-semibold text-foreground text-sm">{platform.name}</h3>
                      {isConnected && (
                        <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Connected
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                      {platform.description}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  {isConnected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(platform.id)}
                      disabled={disconnect.isPending}
                      className="border-destructive/30 text-destructive hover:bg-destructive/10 h-7 text-xs"
                    >
                      <Unlink className="w-3 h-3 mr-1" />
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleConnect(platform.id)}
                      disabled={isConnecting}
                      className="h-7 text-xs gradient-orange text-black font-semibold"
                    >
                      {isConnecting ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Link2 className="w-3 h-3 mr-1" />
                      )}
                      Connect
                    </Button>
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