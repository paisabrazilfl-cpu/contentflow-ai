import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Globe, Plus, CheckCircle, AlertCircle, RefreshCw, Trash2, ExternalLink, Settings
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const connectedPlatforms = [
  {
    id: "google",
    name: "Google Business Profile",
    description: "Post updates, photos, and offers to your Google Business listing",
    status: "connected",
    accountName: "Acme Marketing - Main Location",
    lastSync: "2 minutes ago",
    postsThisMonth: 12,
    enabled: true,
  },
  {
    id: "meta",
    name: "Meta (Instagram & Facebook)",
    description: "Publish to Instagram feed/stories and Facebook pages",
    status: "connected",
    accountName: "@acme_marketing",
    lastSync: "5 minutes ago",
    postsThisMonth: 24,
    enabled: true,
  },
  {
    id: "tiktok",
    name: "TikTok",
    description: "Upload short-form videos to TikTok",
    status: "connected",
    accountName: "@acmemarketing",
    lastSync: "1 hour ago",
    postsThisMonth: 8,
    enabled: true,
  },
  {
    id: "youtube",
    name: "YouTube",
    description: "Upload Shorts and long-form videos",
    status: "expired",
    accountName: "Acme Marketing Channel",
    lastSync: "Token expired",
    postsThisMonth: 4,
    enabled: false,
  },
  {
    id: "reddit",
    name: "Reddit",
    description: "Post to subreddits with conversational content",
    status: "connected",
    accountName: "u/AcmeMarketing",
    lastSync: "30 minutes ago",
    postsThisMonth: 6,
    enabled: true,
  },
  {
    id: "wordpress",
    name: "WordPress",
    description: "Publish long-form blog posts with SEO optimization",
    status: "disconnected",
    accountName: null,
    lastSync: null,
    postsThisMonth: 0,
    enabled: false,
  },
];

const platformIcons: Record<string, string> = {
  google: "bg-blue-500/10 text-blue-400",
  meta: "bg-indigo-500/10 text-indigo-400",
  tiktok: "bg-pink-500/10 text-pink-400",
  youtube: "bg-red-500/10 text-red-400",
  reddit: "bg-orange-500/10 text-orange-400",
  wordpress: "bg-cyan-500/10 text-cyan-400",
};

export default function Platforms() {
  const { data: platformsData } = trpc.platforms.list.useQuery();
  const connectMutation = trpc.platforms.connect.useMutation();
  const disconnectMutation = trpc.platforms.disconnect.useMutation();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Platform Connections</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your connected social and publishing accounts</p>
          </div>
          <Button className="gradient-orange text-black font-semibold hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" /> Connect New
          </Button>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">4</p>
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
                <p className="text-2xl font-bold">1</p>
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
                <p className="text-2xl font-bold">1</p>
                <p className="text-xs text-muted-foreground">Not Connected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Cards */}
        <div className="space-y-4">
          {connectedPlatforms.map((platform) => (
            <Card key={platform.id} className={`bg-card border-border ${platform.status === "expired" ? "border-yellow-500/30" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${platformIcons[platform.id]}`}>
                      <Globe className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{platform.name}</h3>
                        <Badge variant="outline" className={
                          platform.status === "connected" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                          platform.status === "expired" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                          "bg-muted text-muted-foreground border-border"
                        }>
                          {platform.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{platform.description}</p>
                      {platform.accountName && (
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span>Account: <span className="text-foreground">{platform.accountName}</span></span>
                          <span>Last sync: {platform.lastSync}</span>
                          <span>Posts this month: {platform.postsThisMonth}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {platform.status === "connected" && (
                      <>
                        <Switch checked={platform.enabled} onCheckedChange={() => toast.info("Toggle coming soon")} />
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {platform.status === "expired" && (
                      <Button size="sm" variant="outline" className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10" onClick={() => toast.info("Reconnect flow coming soon")}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Reconnect
                      </Button>
                    )}
                    {platform.status === "disconnected" && (
                      <Button size="sm" className="gradient-orange text-black font-semibold hover:opacity-90" onClick={() => toast.info("OAuth connection flow coming soon")}>
                        <Plus className="w-4 h-4 mr-2" /> Connect
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* OAuth Info */}
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <ExternalLink className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">OAuth Configuration</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Platform connections use OAuth 2.0 for secure authentication. Configure your OAuth client credentials in Settings &gt; API Keys to enable platform connections.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
