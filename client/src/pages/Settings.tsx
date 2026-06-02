import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Key, Users, Bell, Webhook, Download, Plus, Eye, EyeOff, Trash2, Copy, Save
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const apiKeyConfigs = [
  { id: "openai", provider: "OpenAI", keyName: "OPENAI_API_KEY", configured: true, lastUsed: "2 min ago" },
  { id: "anthropic", provider: "Anthropic", keyName: "ANTHROPIC_API_KEY", configured: true, lastUsed: "5 min ago" },
  { id: "google", provider: "Google OAuth", keyName: "GOOGLE_CLIENT_ID", configured: true, lastUsed: "1 hour ago" },
  { id: "meta", provider: "Meta App", keyName: "META_APP_ID", configured: false, lastUsed: null },
  { id: "tiktok", provider: "TikTok Developer", keyName: "TIKTOK_CLIENT_KEY", configured: false, lastUsed: null },
  { id: "reddit", provider: "Reddit App", keyName: "REDDIT_CLIENT_ID", configured: true, lastUsed: "30 min ago" },
  { id: "stripe", provider: "Stripe", keyName: "STRIPE_SECRET_KEY", configured: true, lastUsed: "1 hour ago" },
  { id: "elevenlabs", provider: "ElevenLabs", keyName: "ELEVENLABS_API_KEY", configured: false, lastUsed: null },
];

const teamMembers = [
  { id: 1, name: "John Smith", email: "john@acme.com", role: "Owner", status: "active" },
  { id: 2, name: "Sarah Johnson", email: "sarah@acme.com", role: "Admin", status: "active" },
  { id: 3, name: "Mike Chen", email: "mike@acme.com", role: "Member", status: "active" },
  { id: 4, name: "pending@acme.com", email: "pending@acme.com", role: "Member", status: "pending" },
];

const webhooks = [
  { id: 1, url: "https://hooks.zapier.com/hooks/catch/123456", events: ["content.published", "content.failed"], active: true },
  { id: 2, url: "https://api.slack.com/webhooks/abc123", events: ["content.published"], active: true },
];

export default function Settings() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

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
            <TabsTrigger value="team" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Users className="w-4 h-4 mr-2" /> Team
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Bell className="w-4 h-4 mr-2" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Webhook className="w-4 h-4 mr-2" /> Webhooks
            </TabsTrigger>
            <TabsTrigger value="export" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Download className="w-4 h-4 mr-2" /> Export
            </TabsTrigger>
          </TabsList>

          {/* API Keys Tab */}
          <TabsContent value="apikeys" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">API Key Configuration</CardTitle>
                  <Button size="sm" className="gradient-orange text-black font-semibold hover:opacity-90" onClick={() => toast.success("Settings saved!")}>
                    <Save className="w-4 h-4 mr-2" /> Save All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">Configure your API keys for AI providers and platform integrations. Keys are encrypted at rest.</p>
                {apiKeyConfigs.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${key.configured ? "bg-green-500/10" : "bg-muted"}`}>
                        <Key className={`w-5 h-5 ${key.configured ? "text-green-400" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{key.provider}</p>
                          <Badge variant="outline" className={key.configured ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-muted text-muted-foreground"}>
                            {key.configured ? "Configured" : "Not Set"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{key.keyName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type={showKeys[key.id] ? "text" : "password"}
                        placeholder={key.configured ? "••••••••••••••••" : "Enter API key..."}
                        className="w-[200px] h-8 bg-background border-border text-xs"
                      />
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowKeys(prev => ({ ...prev, [key.id]: !prev[key.id] }))}>
                        {showKeys[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Team Members</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => toast.info("Invite flow coming soon")}>
                    <Plus className="w-4 h-4 mr-2" /> Invite Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">{member.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={member.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"}>
                        {member.status}
                      </Badge>
                      <Select defaultValue={member.role.toLowerCase()}>
                        <SelectTrigger className="w-[100px] h-8 bg-background border-border text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                      {member.role !== "Owner" && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Content published successfully", desc: "Get notified when posts go live", default: true },
                  { label: "Content generation failed", desc: "Alert when AI generation encounters errors", default: true },
                  { label: "Platform disconnected", desc: "Notify when OAuth tokens expire", default: true },
                  { label: "AI citation detected", desc: "Alert when AI engines mention your business", default: true },
                  { label: "Weekly performance report", desc: "Summary of content performance metrics", default: false },
                  { label: "Team member activity", desc: "Notify about team actions and changes", default: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                    <Switch defaultChecked={item.default} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Webhook Endpoints</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => toast.info("Add webhook coming soon")}>
                    <Plus className="w-4 h-4 mr-2" /> Add Webhook
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {webhooks.map((wh) => (
                  <div key={wh.id} className="p-4 rounded-lg bg-secondary space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">{wh.url}</code>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { navigator.clipboard.writeText(wh.url); toast.success("Copied!"); }}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <Switch defaultChecked={wh.active} />
                    </div>
                    <div className="flex gap-2">
                      {wh.events.map(e => (
                        <Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Data Export</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Export your data in various formats for backup or migration purposes.</p>
                {[
                  { label: "Content History", desc: "All published and queued content", format: "CSV" },
                  { label: "Analytics Data", desc: "Performance metrics and engagement data", format: "JSON" },
                  { label: "Platform Connections", desc: "Connected account metadata (tokens excluded)", format: "JSON" },
                  { label: "Full Backup", desc: "Complete data export including settings", format: "ZIP" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast.info("Export coming soon")}>
                      <Download className="w-4 h-4 mr-2" /> {item.format}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
