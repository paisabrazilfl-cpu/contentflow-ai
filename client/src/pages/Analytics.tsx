import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import {
  TrendingUp, Bot, Globe, Eye, MousePointer, Heart, MessageSquare, ArrowUpRight
} from "lucide-react";

const impressionsData = [
  { name: "Week 1", impressions: 1200, clicks: 89 },
  { name: "Week 2", impressions: 1800, clicks: 134 },
  { name: "Week 3", impressions: 2400, clicks: 178 },
  { name: "Week 4", impressions: 3100, clicks: 245 },
  { name: "Week 5", impressions: 4200, clicks: 312 },
  { name: "Week 6", impressions: 5600, clicks: 423 },
  { name: "Week 7", impressions: 6800, clicks: 498 },
  { name: "Week 8", impressions: 8900, clicks: 612 },
];

const platformPerformance = [
  { name: "Google", posts: 48, engagement: 2340, color: "#4285f4" },
  { name: "Instagram", posts: 62, engagement: 4520, color: "#e1306c" },
  { name: "TikTok", posts: 24, engagement: 8900, color: "#ff0050" },
  { name: "YouTube", posts: 12, engagement: 3200, color: "#ff0000" },
  { name: "Reddit", posts: 18, engagement: 1890, color: "#ff4500" },
  { name: "WordPress", posts: 8, engagement: 980, color: "#21759b" },
];

const aiCitations = [
  { engine: "ChatGPT", citations: 8, lastDetected: "2 hours ago", trend: "+3 this week" },
  { engine: "Claude", citations: 4, lastDetected: "1 day ago", trend: "+1 this week" },
  { engine: "Gemini", citations: 2, lastDetected: "3 days ago", trend: "Stable" },
];

const topContent = [
  { title: "10 SEO Tips for Local Businesses", platform: "WordPress", views: 2340, engagement: "4.2%" },
  { title: "Behind the scenes at our studio", platform: "Instagram", views: 1890, engagement: "6.8%" },
  { title: "Quick marketing tip #47", platform: "TikTok", views: 8900, engagement: "12.3%" },
  { title: "AMA: Content Marketing Strategy", platform: "Reddit", views: 3400, engagement: "8.1%" },
  { title: "New service announcement", platform: "Google", views: 1200, engagement: "3.4%" },
];

const pieData = [
  { name: "Blog", value: 35, color: "oklch(0.72 0.17 50)" },
  { name: "Social", value: 45, color: "oklch(0.6 0.15 160)" },
  { name: "Video", value: 15, color: "oklch(0.55 0.15 250)" },
  { name: "Schema", value: 5, color: "oklch(0.65 0.15 310)" },
];

export default function Analytics() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground text-sm mt-1">Track your content performance and AI citations</p>
          </div>
          <Select defaultValue="30d">
            <SelectTrigger className="w-[140px] bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">8.9K</p>
                  <p className="text-xs text-muted-foreground">Impressions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <MousePointer className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">612</p>
                  <p className="text-xs text-muted-foreground">Clicks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">21.8K</p>
                  <p className="text-xs text-muted-foreground">Engagement</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">14</p>
                  <p className="text-xs text-muted-foreground">AI Citations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Overview</TabsTrigger>
            <TabsTrigger value="platforms" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Platforms</TabsTrigger>
            <TabsTrigger value="citations" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">AI Citations</TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Top Content</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Search Impressions & Clicks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={impressionsData}>
                        <defs>
                          <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="oklch(0.72 0.17 50)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="oklch(0.72 0.17 50)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="oklch(0.6 0.15 160)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="oklch(0.6 0.15 160)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.01 285)" />
                        <XAxis dataKey="name" stroke="oklch(0.65 0.01 285)" fontSize={12} />
                        <YAxis stroke="oklch(0.65 0.01 285)" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: "oklch(0.178 0.008 285)", border: "1px solid oklch(0.28 0.01 285)", borderRadius: "8px" }} />
                        <Area type="monotone" dataKey="impressions" stroke="oklch(0.72 0.17 50)" fillOpacity={1} fill="url(#colorImpressions)" strokeWidth={2} />
                        <Area type="monotone" dataKey="clicks" stroke="oklch(0.6 0.15 160)" fillOpacity={1} fill="url(#colorClicks)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Content Mix</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "oklch(0.178 0.008 285)", border: "1px solid oklch(0.28 0.01 285)", borderRadius: "8px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-2">
                    {pieData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span>{item.name}</span>
                        </div>
                        <span className="text-muted-foreground">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="platforms" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Platform Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.01 285)" />
                      <XAxis dataKey="name" stroke="oklch(0.65 0.01 285)" fontSize={12} />
                      <YAxis stroke="oklch(0.65 0.01 285)" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: "oklch(0.178 0.008 285)", border: "1px solid oklch(0.28 0.01 285)", borderRadius: "8px" }} />
                      <Bar dataKey="engagement" fill="oklch(0.72 0.17 50)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="citations" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">AI Engine Citation Tracker</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Track when AI engines like ChatGPT, Claude, and Gemini recommend or cite your business.</p>
                {aiCitations.map((citation) => (
                  <div key={citation.engine} className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{citation.engine}</p>
                        <p className="text-xs text-muted-foreground">Last detected: {citation.lastDetected}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{citation.citations}</p>
                      <p className="text-xs text-green-400 flex items-center gap-1 justify-end">
                        <ArrowUpRight className="w-3 h-3" /> {citation.trend}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Top Performing Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topContent.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                        <div>
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.platform}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{item.views.toLocaleString()} views</p>
                        <p className="text-xs text-green-400">{item.engagement} engagement</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
