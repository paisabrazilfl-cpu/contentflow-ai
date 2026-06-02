import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Globe, TrendingUp, Bot, Plus, Zap,
  ArrowUpRight, Clock, CheckCircle, AlertCircle
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const impressionsData = [
  { name: "Jan", value: 2400 }, { name: "Feb", value: 3600 },
  { name: "Mar", value: 4200 }, { name: "Apr", value: 5800 },
  { name: "May", value: 7200 }, { name: "Jun", value: 8900 },
];

const activityFeed = [
  { id: 1, action: "Published to Instagram", platform: "instagram", time: "2 min ago", status: "success" },
  { id: 2, action: "AI generated blog post", platform: "wordpress", time: "15 min ago", status: "success" },
  { id: 3, action: "Scheduled TikTok video", platform: "tiktok", time: "1 hour ago", status: "pending" },
  { id: 4, action: "Published to Google Business", platform: "google", time: "2 hours ago", status: "success" },
  { id: 5, action: "Reddit post failed - rate limit", platform: "reddit", time: "3 hours ago", status: "error" },
];

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { data: business } = trpc.business.get.useQuery();
  const { data: activityData } = trpc.activity.feed.useQuery();
  const { data: contentData } = trpc.content.queue.useQuery();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Command Center</h1>
            <p className="text-muted-foreground text-sm mt-1">Your AI content automation at a glance</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Clock className="w-4 h-4 mr-2" /> Schedule Post
            </Button>
            <Button size="sm" className="gradient-orange text-black font-semibold hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> Create Content
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Posts Published</p>
                  <p className="text-3xl font-bold mt-1">127</p>
                  <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" /> +23% this month
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Platforms</p>
                  <p className="text-3xl font-bold mt-1">5</p>
                  <p className="text-xs text-muted-foreground mt-1">of 6 connected</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Search Impressions</p>
                  <p className="text-3xl font-bold mt-1">8.9K</p>
                  <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" /> +47% vs last month
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">AI Citations</p>
                  <p className="text-3xl font-bold mt-1">14</p>
                  <p className="text-xs text-primary mt-1 flex items-center gap-1">
                    <Bot className="w-3 h-3" /> ChatGPT, Claude, Gemini
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart + Activity */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Impressions Chart */}
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Search Impressions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={impressionsData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.72 0.17 50)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.72 0.17 50)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.01 285)" />
                    <XAxis dataKey="name" stroke="oklch(0.65 0.01 285)" fontSize={12} />
                    <YAxis stroke="oklch(0.65 0.01 285)" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "oklch(0.178 0.008 285)", border: "1px solid oklch(0.28 0.01 285)", borderRadius: "8px" }}
                      labelStyle={{ color: "oklch(0.985 0.002 285)" }}
                    />
                    <Area type="monotone" dataKey="value" stroke="oklch(0.72 0.17 50)" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityFeed.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                      item.status === "success" ? "bg-green-400" :
                      item.status === "error" ? "bg-red-400" : "bg-yellow-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.action}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                    {item.status === "success" && <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />}
                    {item.status === "error" && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
                    {item.status === "pending" && <Clock className="w-4 h-4 text-yellow-400 shrink-0" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:border-primary/50 hover:bg-primary/5">
                <Zap className="w-5 h-5 text-primary" />
                <span className="text-xs">Generate Content</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:border-primary/50 hover:bg-primary/5">
                <Globe className="w-5 h-5 text-primary" />
                <span className="text-xs">Connect Platform</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:border-primary/50 hover:bg-primary/5">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-xs">View Queue</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:border-primary/50 hover:bg-primary/5">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-xs">View Analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
