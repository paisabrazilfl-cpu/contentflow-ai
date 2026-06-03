import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Globe, Plus, CheckCircle, AlertCircle, RefreshCw, Trash2, ExternalLink, Inbox
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const AVAILABLE_PLATFORMS = [
  { id: "google", name: "Google Business / YouTube", description: "Post updates and upload videos via Google APIs", scopes: "YouTube, Business Profile, Search Console" },
  { id: "instagram", name: "Instagram", description: "Publish to Instagram feed and stories via Meta Graph API", scopes: "instagram_content_publishing" },
  { id: "facebook", name: "Facebook", description: "Post to Facebook pages via Meta Graph API", scopes: "pages_manage_posts" },
  { id: "tiktok", name: "TikTok", description: "Upload short-form videos via TikTok Content Posting API", scopes: "video.upload" },
  { id: "reddit", name: "Reddit", description: "Post to subreddits via Reddit OAuth API", scopes: "submit, read" },
  { id: "wordpress", name: "WordPress", description: "Publish blog posts via WordPress REST API", scopes: "Application Password" },
];

const platformColors: Record<string, string> = {
  google: "bg-blue-500/10 text-blue-400",
  instagram: "bg-pink-500/10 text-pink-400",
  facebook: "bg-indigo-500/10 text-indigo-400",
  tiktok: "bg-violet-500/10 text-violet-400",
  youtube: "bg-red-500/10 text-red-400",
  reddit: "bg-orange-500/10 text-orange-400",
  wordpress: "bg-cyan-500/10 text-cyan-400",
};

export default function Platforms() {
  const { data: connectedAccounts, isLoading } = trpc.platforms.list.useQuery();
  const utils = trpc.useUtils();

  const disconnectMutation = trpc.platforms.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Platform disconnected");
      utils.platforms.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // Handle OAuth callback messages from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const email = params.get("email");
    const error = params.get("error");
    if (connected) {
      toast.success(`Successfully connected ${connected} account${email ? ` (${email})` : ""}`);
      window.history.replaceState({}, document.title, "/platforms");
      utils.platforms.list.invalidate();
    } else if (error) {
      toast.error(`Failed to connect: ${error}`);
      window.history.replaceState({}, document.title, "/platforms");
    }
  }, []);

  const connectedPlatformIds = new Set(connectedAccounts?.map(a => a.platform) || []);
  const activeCount = connectedAccounts?.filter(a => a.status === "active").length || 0;
  const expiredCount = connectedAccounts?.filter(a => a.status !== "active").length || 0;
  const disconnectedCount = AVAILABLE_PLATFORMS.filter(p => !connectedPlatformIds.has(p.id)).length;

  const handleConnect = (platformId: string) => {
    if (platformId === "google") {
      window.location.href = "/api/oauth/google/init";
    } else {
      toast.info(`OAuth connection for ${platformId} requires platform credentials. Add them in Settings → API Keys first.`);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Platform Connections</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your connected social and publishing accounts</p>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Active Connections</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{expiredCount}</p>
                <p className="text-xs text-muted-foreground">Needs Attention</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Globe className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{disconnectedCount}</p>
                <p className="text-xs text-muted-foreground">Not Connected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Connected Accounts */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-card border-border"><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Show connected accounts first */}
            {connectedAccounts && connectedAccounts.length > 0 && (
              <>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Connected</h3>
                {connectedAccounts.map((account) => (
                  <Card key={account.id} className={`bg-card border-border ${account.status !== "active" ? "border-yellow-500/30" : ""}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${platformColors[account.platform] || "bg-muted"}`}>
                            <Globe className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{account.platform}</h3>
                              <Badge variant="outline" className={
                                account.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                              }>
                                {account.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {account.accountName || account.platformAccountId || "Connected account"}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              {account.platformAccountId && <span>ID: {account.platformAccountId}</span>}
                              <span>Connected: {new Date(account.createdAt).toLocaleDateString()}</span>
                              {account.expiresAt && <span>Expires: {new Date(account.expiresAt).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {account.status !== "active" && (
                            <Button size="sm" variant="outline" className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                              onClick={() => handleConnect(account.platform)}>
                              <RefreshCw className="w-4 h-4 mr-2" /> Reconnect
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10"
                            onClick={() => disconnectMutation.mutate({ id: account.id })}
                            disabled={disconnectMutation.isPending}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {/* Show available platforms that aren't connected */}
            {disconnectedCount > 0 && (
              <>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mt-6">Available to Connect</h3>
                {AVAILABLE_PLATFORMS.filter(p => !connectedPlatformIds.has(p.id)).map((platform) => (
                  <Card key={platform.id} className="bg-card border-border">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${platformColors[platform.id] || "bg-muted"}`}>
                            <Globe className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{platform.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{platform.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">Scopes: {platform.scopes}</p>
                          </div>
                        </div>
                        <Button size="sm" className="gradient-orange text-black font-semibold hover:opacity-90"
                          onClick={() => handleConnect(platform.id)}>
                          <Plus className="w-4 h-4 mr-2" /> Connect
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {/* Empty state */}
            {!connectedAccounts?.length && disconnectedCount === 0 && (
              <Card className="bg-card border-border">
                <CardContent className="p-8 flex flex-col items-center justify-center text-muted-foreground">
                  <Inbox className="w-10 h-10 mb-3 opacity-30" />
                  <p className="font-medium">No platforms available</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* OAuth Info */}
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <ExternalLink className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Platform OAuth Setup</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Google/YouTube is ready to connect. For other platforms, add your OAuth client credentials in Settings → API Keys, then return here to connect.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
