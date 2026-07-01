import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Key, Users, Bell, Webhook, Download, Plus, Eye, EyeOff, Trash2, Copy, Save, Loader2, Inbox, Clock, Play, Pause, Bot, Zap
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { CronJobsTab } from "@/components/CronJobsTab";

const API_KEY_PROVIDERS = [
  { provider: "OpenAI", keyName: "OPENAI_API_KEY", description: "Used for GPT-based content generation" },
  { provider: "Anthropic", keyName: "ANTHROPIC_API_KEY", description: "Used for Claude-based content generation" },
  { provider: "Google OAuth", keyName: "GOOGLE_CLIENT_ID", description: "Google Business / YouTube OAuth" },
  { provider: "Meta App", keyName: "META_APP_ID", description: "Instagram / Facebook OAuth" },
  { provider: "TikTok", keyName: "TIKTOK_CLIENT_KEY", description: "TikTok for Business OAuth" },
  { provider: "Reddit", keyName: "REDDIT_CLIENT_ID", description: "Reddit OAuth" },
  { provider: "Stripe", keyName: "STRIPE_SECRET_KEY", description: "Payment processing" },
  { provider: "Composio", keyName: "COMPOSIO_API_KEY", description: "Universal OAuth hub (Google, Meta, TikTok, Reddit, etc.)" },
  { provider: "A2E AI", keyName: "A2E_API_KEY", description: "AI video generation provider" },
];

export default function Settings() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [newKeyProvider, setNewKeyProvider] = useState("");
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");

  const { data: apiKeys, isLoading: keysLoading } = trpc.apiKeys.list.useQuery();
  const { data: teamMembers, isLoading: teamLoading } = trpc.team.list.useQuery();
  const utils = trpc.useUtils();

  const exportMutation = trpc.gdpr.export.useMutation();
  const deleteMutation = trpc.gdpr.delete.useMutation({
    onSuccess: () => {
      toast.success("Account deleted. Redirecting...");
      setTimeout(() => window.location.href = "/", 2000);
    },
    onError: (err) => toast.error(err.message),
  });

  const saveKeyMutation = trpc.apiKeys.save.useMutation({
    onSuccess: () => {
      toast.success("API key saved");
      utils.apiKeys.list.invalidate();
      setNewKeyProvider("");
      setNewKeyName("");
      setNewKeyValue("");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSaveKey = () => {
    if (!newKeyName || !newKeyValue || !newKeyProvider) {
      toast.error("Fill in all fields");
      return;
    }
    saveKeyMutation.mutate({
      keyName: newKeyName,
      keyValue: newKeyValue,
      provider: newKeyProvider,
    });
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return "••••••••";
    return key.slice(0, 4) + "••••••••" + key.slice(-4);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground text-sm mt-1">Configure API keys, team, notifications, and integrations</p>
          </div>
        </div>

        <Tabs defaultValue="apikeys" className="space-y-4">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="apikeys" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Key className="w-4 h-4 mr-2" /> API Keys
            </TabsTrigger>
            <TabsTrigger value="cron" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Clock className="w-4 h-4 mr-2" /> Scheduled Jobs
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Users className="w-4 h-4 mr-2" /> Team
            </TabsTrigger>
            <TabsTrigger value="export" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Download className="w-4 h-4 mr-2" /> Export
            </TabsTrigger>
          </TabsList>

          {/* API Keys Tab */}
          <TabsContent value="apikeys" className="space-y-4">
            {/* Add new key */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Add API Key</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Provider</Label>
                    <Input className="mt-1" placeholder="e.g., OpenAI" value={newKeyProvider} onChange={e => setNewKeyProvider(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Key Name</Label>
                    <Input className="mt-1" placeholder="e.g., OPENAI_API_KEY" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Value</Label>
                    <Input className="mt-1" type="password" placeholder="sk-..." value={newKeyValue} onChange={e => setNewKeyValue(e.target.value)} />
                  </div>
                </div>
                <Button size="sm" onClick={handleSaveKey} disabled={saveKeyMutation.isPending}
                  className="gradient-orange text-black font-semibold hover:opacity-90">
                  {saveKeyMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Key
                </Button>
              </CardContent>
            </Card>

            {/* Saved keys */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Saved API Keys</CardTitle>
              </CardHeader>
              <CardContent>
                {keysLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : apiKeys && apiKeys.length > 0 ? (
                  <div className="space-y-3">
                    {apiKeys.map((key: any) => (
                      <div key={key.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Key className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{key.provider}</p>
                            <p className="text-xs text-muted-foreground">{key.keyName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-secondary px-2 py-1 rounded">
                            {showKeys[key.id.toString()] ? key.keyValue : maskKey(key.keyValue)}
                          </code>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                            onClick={() => setShowKeys(prev => ({ ...prev, [key.id.toString()]: !prev[key.id.toString()] }))}>
                            {showKeys[key.id.toString()] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                            onClick={() => { navigator.clipboard.writeText(key.keyValue); toast.success("Copied!"); }}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Key className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">No API keys saved yet</p>
                    <p className="text-xs mt-1">Add keys above to enable platform integrations</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick reference */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Required Keys Reference</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {API_KEY_PROVIDERS.map(p => (
                    <div key={p.keyName} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium">{p.provider}</p>
                        <p className="text-xs text-muted-foreground">{p.description}</p>
                      </div>
                      <Badge variant="outline" className={
                        apiKeys?.some(k => k.keyName === p.keyName)
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-muted text-muted-foreground"
                      }>
                        {apiKeys?.some(k => k.keyName === p.keyName) ? "Configured" : "Not set"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cron Jobs Tab */}
          <TabsContent value="cron" className="space-y-4">
            <CronJobsTab />
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Team Members</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {teamLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : teamMembers && teamMembers.length > 0 ? (
                  <div className="space-y-3">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{member.email}</p>
                            <p className="text-xs text-muted-foreground">{member.role}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{member.status || "active"}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">No team members yet</p>
                    <p className="text-xs mt-1">You are the only user on this account</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <Card className="bg-card border-border">
              <CardContent className="p-5 space-y-4">
                <div>
                  <h4 className="font-semibold text-sm">GDPR Data Export</h4>
                  <p className="text-xs text-muted-foreground mt-1">Download all your data (business info, content, analytics, connections) as JSON. OAuth tokens are redacted for security.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={async () => {
                    try {
                      const result = await exportMutation.mutateAsync();
                      const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `contentflow-export-${new Date().toISOString().slice(0,10)}.json`;
                      a.click();
                      toast.success("Data exported successfully");
                    } catch (err: any) {
                      toast.error(err.message);
                    }
                  }} disabled={exportMutation.isPending}>
                    {exportMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    Export All My Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border border-red-500/30">
              <CardContent className="p-5 space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-red-400">Delete My Account</h4>
                  <p className="text-xs text-muted-foreground mt-1">Permanently delete your account and all associated data. This action cannot be undone. All content, analytics, connections, and business data will be permanently removed.</p>
                  <Button variant="outline" size="sm" className="mt-3 border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => {
                    if (window.confirm("Are you sure you want to permanently delete your account and all data? This cannot be undone.")) {
                      deleteMutation.mutate();
                    }
                  }} disabled={deleteMutation.isPending}>
                    {deleteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Delete My Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
