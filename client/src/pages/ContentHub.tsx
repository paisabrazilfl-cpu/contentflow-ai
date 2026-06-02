import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Plus, Clock, CheckCircle, AlertCircle, Calendar, FileText,
  Send, Eye, Edit, Trash2, MoreHorizontal, Filter, Zap
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const queueItems = [
  { id: 1, title: "5 Tips for Better SEO in 2026", platform: "wordpress", type: "blog", status: "pending", scheduledFor: "Jun 3, 2026 9:00 AM" },
  { id: 2, title: "New summer collection spotlight", platform: "instagram", type: "social", status: "pending", scheduledFor: "Jun 3, 2026 12:00 PM" },
  { id: 3, title: "Behind the scenes of our process", platform: "tiktok", type: "video", status: "processing", scheduledFor: "Jun 3, 2026 3:00 PM" },
  { id: 4, title: "Weekly industry roundup", platform: "reddit", type: "social", status: "pending", scheduledFor: "Jun 4, 2026 10:00 AM" },
  { id: 5, title: "Google Business update", platform: "google", type: "social", status: "approved", scheduledFor: "Jun 4, 2026 8:00 AM" },
];

const publishedItems = [
  { id: 6, title: "How AI is Transforming Local SEO", platform: "wordpress", type: "blog", status: "published", publishedAt: "Jun 1, 2026", engagement: { views: 342, clicks: 28 } },
  { id: 7, title: "Customer success story highlight", platform: "instagram", type: "social", status: "published", publishedAt: "Jun 1, 2026", engagement: { views: 1240, likes: 89 } },
  { id: 8, title: "Quick tip: Optimize your GBP listing", platform: "youtube", type: "video", status: "published", publishedAt: "May 31, 2026", engagement: { views: 567, likes: 45 } },
  { id: 9, title: "AMA about content marketing", platform: "reddit", type: "social", status: "published", publishedAt: "May 30, 2026", engagement: { views: 2100, comments: 34 } },
];

const calendarDays = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  posts: Math.floor(Math.random() * 4),
}));

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  processing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  approved: "bg-green-500/10 text-green-400 border-green-500/20",
  published: "bg-primary/10 text-primary border-primary/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
};

const platformColors: Record<string, string> = {
  google: "bg-blue-500/10 text-blue-400",
  instagram: "bg-pink-500/10 text-pink-400",
  meta: "bg-indigo-500/10 text-indigo-400",
  tiktok: "bg-pink-500/10 text-pink-400",
  youtube: "bg-red-500/10 text-red-400",
  reddit: "bg-orange-500/10 text-orange-400",
  wordpress: "bg-cyan-500/10 text-cyan-400",
};

export default function ContentHub() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: queueData } = trpc.content.queue.useQuery();
  const createMutation = trpc.content.create.useMutation({
    onSuccess: () => { setCreateOpen(false); toast.success("Post added to queue"); },
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Content Hub</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your content queue, calendar, and publishing history</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-orange text-black font-semibold hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" /> Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Title</Label>
                  <Input placeholder="Post title..." className="mt-1.5 bg-secondary border-border" />
                </div>
                <div>
                  <Label>Content</Label>
                  <Textarea placeholder="Write your content or let AI generate it..." className="mt-1.5 bg-secondary border-border min-h-[120px]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Platform</Label>
                    <Select>
                      <SelectTrigger className="mt-1.5 bg-secondary border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google Business</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="reddit">Reddit</SelectItem>
                        <SelectItem value="wordpress">WordPress</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Content Type</Label>
                    <Select>
                      <SelectTrigger className="mt-1.5 bg-secondary border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blog">Blog</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="schema">Schema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => { toast.info("AI generation coming soon"); }}>
                    <Zap className="w-4 h-4 mr-2" /> AI Generate
                  </Button>
                  <Button className="flex-1 gradient-orange text-black font-semibold hover:opacity-90" onClick={() => { setCreateOpen(false); toast.success("Post added to queue"); }}>
                    <Send className="w-4 h-4 mr-2" /> Add to Queue
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="queue" className="space-y-4">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="queue" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Clock className="w-4 h-4 mr-2" /> Queue ({queueItems.length})
            </TabsTrigger>
            <TabsTrigger value="published" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <CheckCircle className="w-4 h-4 mr-2" /> Published
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Calendar className="w-4 h-4 mr-2" /> Calendar
            </TabsTrigger>
          </TabsList>

          {/* Queue Tab */}
          <TabsContent value="queue" className="space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
              <Select>
                <SelectTrigger className="w-[150px] bg-secondary border-border h-9"><SelectValue placeholder="All platforms" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All platforms</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="reddit">Reddit</SelectItem>
                  <SelectItem value="wordpress">WordPress</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {queueItems.map((item) => (
              <Card key={item.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${platformColors[item.platform] || "bg-secondary"}`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground capitalize">{item.platform}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{item.scheduledFor}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={statusColors[item.status]}>{item.status}</Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Published Tab */}
          <TabsContent value="published" className="space-y-3">
            {publishedItems.map((item) => (
              <Card key={item.id} className="bg-card border-border">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${platformColors[item.platform] || "bg-secondary"}`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground capitalize">{item.platform}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{item.publishedAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{Object.values(item.engagement)[0]?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{Object.keys(item.engagement)[0]}</p>
                    </div>
                    <Badge variant="outline" className={statusColors[item.status]}>{item.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">June 2026</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                    <div key={d} className="text-center text-xs text-muted-foreground py-2 font-medium">{d}</div>
                  ))}
                  {calendarDays.map((day) => (
                    <div key={day.day} className="aspect-square border border-border/50 rounded-lg p-1 hover:border-primary/50 transition-colors cursor-pointer">
                      <div className="text-xs text-muted-foreground">{day.day}</div>
                      {day.posts > 0 && (
                        <div className="mt-1 flex gap-0.5">
                          {Array.from({ length: Math.min(day.posts, 3) }).map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" />
                          ))}
                        </div>
                      )}
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

