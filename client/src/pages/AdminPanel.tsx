import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";
import {
  Users, DollarSign, Activity, Shield, Search, MoreHorizontal,
  CheckCircle, AlertCircle, Ban, Eye, TrendingUp, Server
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const revenueData = [
  { month: "Jan", revenue: 4800, users: 12 },
  { month: "Feb", revenue: 7200, users: 18 },
  { month: "Mar", revenue: 12400, users: 28 },
  { month: "Apr", revenue: 18600, users: 42 },
  { month: "May", revenue: 24800, users: 58 },
  { month: "Jun", revenue: 32400, users: 74 },
];

const tenants = [
  { id: 1, name: "Acme Marketing", email: "john@acme.com", plan: "Pro", status: "active", posts: 127, mrr: 197, joined: "Jan 15, 2026" },
  { id: 2, name: "TechFlow Inc", email: "sarah@techflow.io", plan: "Enterprise", status: "active", posts: 342, mrr: 497, joined: "Feb 3, 2026" },
  { id: 3, name: "LocalEats", email: "marcus@localeats.com", plan: "Starter", status: "active", posts: 45, mrr: 97, joined: "Mar 12, 2026" },
  { id: 4, name: "BrightMedia Agency", email: "emily@brightmedia.co", plan: "Enterprise", status: "active", posts: 890, mrr: 497, joined: "Jan 22, 2026" },
  { id: 5, name: "FitLife Gym", email: "alex@fitlife.com", plan: "Pro", status: "past_due", posts: 67, mrr: 197, joined: "Apr 5, 2026" },
  { id: 6, name: "HomeServ Pro", email: "dave@homeserv.com", plan: "Starter", status: "active", posts: 23, mrr: 97, joined: "May 1, 2026" },
  { id: 7, name: "CloudNine SaaS", email: "lisa@cloudnine.io", plan: "Pro", status: "trialing", posts: 8, mrr: 0, joined: "May 28, 2026" },
];

const systemHealth = [
  { service: "API Server", status: "healthy", uptime: "99.97%", latency: "45ms" },
  { service: "Database", status: "healthy", uptime: "99.99%", latency: "12ms" },
  { service: "Content Queue", status: "healthy", uptime: "99.95%", latency: "120ms" },
  { service: "AI Generation", status: "degraded", uptime: "98.2%", latency: "2.4s" },
  { service: "OAuth Service", status: "healthy", uptime: "99.98%", latency: "89ms" },
  { service: "Stripe Webhooks", status: "healthy", uptime: "100%", latency: "34ms" },
];

const moderationQueue = [
  { id: 1, content: "10 Ways to Boost Your Local SEO Rankings Fast", platform: "wordpress", user: "Acme Marketing", flagReason: "Potential spam keywords", createdAt: "2 hours ago" },
  { id: 2, content: "AMAZING DEALS - Click Now!!!", platform: "instagram", user: "FitLife Gym", flagReason: "Clickbait detected", createdAt: "5 hours ago" },
  { id: 3, content: "Why our competitors are terrible...", platform: "reddit", user: "HomeServ Pro", flagReason: "Negative competitor mention", createdAt: "1 day ago" },
];

export default function AdminPanel() {
  const { user } = useAuth();
  const { data: adminStats } = trpc.admin.stats.useQuery(undefined, { enabled: user?.role === 'admin' });
  const { data: adminUsers } = trpc.admin.users.useQuery(undefined, { enabled: user?.role === 'admin' });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground text-sm mt-1">Platform administration and monitoring</p>
          </div>
          <Badge className="gradient-orange text-black font-semibold">Admin Access</Badge>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">74</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">$32.4K</p>
                  <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">1,502</p>
                  <p className="text-xs text-muted-foreground">Posts This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">97%</p>
                  <p className="text-xs text-muted-foreground">Gross Margin</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="users" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Users className="w-4 h-4 mr-2" /> Users
            </TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <DollarSign className="w-4 h-4 mr-2" /> Revenue
            </TabsTrigger>
            <TabsTrigger value="health" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Server className="w-4 h-4 mr-2" /> System Health
            </TabsTrigger>
            <TabsTrigger value="moderation" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Shield className="w-4 h-4 mr-2" /> Moderation
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search users..." className="pl-9 bg-secondary border-border" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[120px] bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Business</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Plan</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Posts</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">MRR</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Joined</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenants.map((tenant) => (
                        <tr key={tenant.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm font-medium">{tenant.name}</p>
                              <p className="text-xs text-muted-foreground">{tenant.email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={
                              tenant.plan === "Enterprise" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                              tenant.plan === "Pro" ? "bg-primary/10 text-primary border-primary/20" :
                              "bg-muted text-muted-foreground"
                            }>{tenant.plan}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={
                              tenant.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                              tenant.status === "past_due" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                              "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            }>{tenant.status}</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm">{tenant.posts}</td>
                          <td className="py-3 px-4 text-sm font-medium">${tenant.mrr}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{tenant.joined}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Eye className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive"><Ban className="w-3.5 h-3.5" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Revenue & Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.01 285)" />
                      <XAxis dataKey="month" stroke="oklch(0.65 0.01 285)" fontSize={12} />
                      <YAxis stroke="oklch(0.65 0.01 285)" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: "oklch(0.178 0.008 285)", border: "1px solid oklch(0.28 0.01 285)", borderRadius: "8px" }} />
                      <Bar dataKey="revenue" fill="oklch(0.72 0.17 50)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total MRR</p>
                  <p className="text-2xl font-bold mt-1">$32,400</p>
                  <p className="text-xs text-green-400 mt-1">+30.6% vs last month</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Avg Revenue/User</p>
                  <p className="text-2xl font-bold mt-1">$438</p>
                  <p className="text-xs text-green-400 mt-1">+12% vs last month</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Churn Rate</p>
                  <p className="text-2xl font-bold mt-1">2.1%</p>
                  <p className="text-xs text-green-400 mt-1">-0.4% vs last month</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="health" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Service Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {systemHealth.map((service) => (
                  <div key={service.service} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${service.status === "healthy" ? "bg-green-400" : "bg-yellow-400"}`} />
                      <div>
                        <p className="font-medium text-sm">{service.service}</p>
                        <p className="text-xs text-muted-foreground">Uptime: {service.uptime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">Latency: {service.latency}</span>
                      <Badge variant="outline" className={service.status === "healthy" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"}>
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Moderation Tab */}
          <TabsContent value="moderation" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Content Moderation Queue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {moderationQueue.map((item) => (
                  <div key={item.id} className="p-4 rounded-lg bg-secondary space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">"{item.content}"</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{item.user}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground capitalize">{item.platform}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{item.createdAt}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" /> {item.flagReason}
                      </Badge>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success("Content approved")}>
                          <CheckCircle className="w-3 h-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30" onClick={() => toast.success("Content rejected")}>
                          <Ban className="w-3 h-3 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
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
