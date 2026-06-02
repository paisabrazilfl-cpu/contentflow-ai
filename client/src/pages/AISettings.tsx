import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Palette, Tags, Calendar, Save, Plus, X, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const contentTypes = [
  { id: "blog", name: "Blog Posts", desc: "Long-form SEO content for WordPress", enabled: true },
  { id: "social", name: "Social Media", desc: "Short-form posts for Instagram, Facebook, Reddit", enabled: true },
  { id: "video", name: "Video Scripts", desc: "30-45 second scripts for TikTok & YouTube Shorts", enabled: true },
  { id: "schema", name: "Schema Markup", desc: "JSON-LD structured data for AI engine optimization", enabled: false },
];

const defaultSchedule = [
  { platform: "Google Business", frequency: "Daily", time: "9:00 AM" },
  { platform: "Instagram", frequency: "Daily", time: "12:00 PM" },
  { platform: "Facebook", frequency: "Daily", time: "12:00 PM" },
  { platform: "TikTok", frequency: "3x/week", time: "3:00 PM" },
  { platform: "YouTube", frequency: "2x/week", time: "10:00 AM" },
  { platform: "Reddit", frequency: "3x/week", time: "10:00 AM" },
  { platform: "WordPress", frequency: "2x/week", time: "8:00 AM" },
];

export default function AISettings() {
  const [topics, setTopics] = useState(["Digital Marketing", "SEO Tips", "Content Strategy"]);
  const [newTopic, setNewTopic] = useState("");
  const [autoApprove, setAutoApprove] = useState(false);

  const addTopic = () => {
    if (newTopic.trim()) {
      setTopics([...topics, newTopic.trim()]);
      setNewTopic("");
    }
  };

  const removeTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Content Settings</h1>
            <p className="text-muted-foreground text-sm mt-1">Configure your AI content generation pipeline</p>
          </div>
          <Button className="gradient-orange text-black font-semibold hover:opacity-90" onClick={() => toast.success("Settings saved!")}>
            <Save className="w-4 h-4 mr-2" /> Save Changes
          </Button>
        </div>

        <Tabs defaultValue="voice" className="space-y-4">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="voice" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Palette className="w-4 h-4 mr-2" /> Brand Voice
            </TabsTrigger>
            <TabsTrigger value="topics" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Tags className="w-4 h-4 mr-2" /> Topics
            </TabsTrigger>
            <TabsTrigger value="types" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Bot className="w-4 h-4 mr-2" /> Content Types
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Calendar className="w-4 h-4 mr-2" /> Schedule
            </TabsTrigger>
          </TabsList>

          {/* Brand Voice Tab */}
          <TabsContent value="voice" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Brand Voice Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Business Description</Label>
                  <Textarea
                    placeholder="Describe your business, services, and what makes you unique..."
                    className="mt-1.5 bg-secondary border-border min-h-[100px]"
                    defaultValue="We are a full-service digital marketing agency specializing in SEO, content marketing, and social media management for small businesses."
                  />
                </div>
                <div>
                  <Label>Target Audience</Label>
                  <Input
                    placeholder="e.g., Small business owners aged 30-55"
                    className="mt-1.5 bg-secondary border-border"
                    defaultValue="Small business owners and marketing managers looking to grow their online presence"
                  />
                </div>
                <div>
                  <Label>Tone of Voice</Label>
                  <Select defaultValue="professional">
                    <SelectTrigger className="mt-1.5 bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="authoritative">Authoritative</SelectItem>
                      <SelectItem value="humorous">Humorous</SelectItem>
                      <SelectItem value="inspirational">Inspirational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                  <div>
                    <p className="font-medium text-sm">Auto-approve generated content</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Publish AI content without manual review</p>
                  </div>
                  <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Topics Tab */}
          <TabsContent value="topics" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Topic Clusters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Define the topics your AI should generate content about. These form the basis of your content strategy.</p>
                <div className="flex gap-2">
                  <Input
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="Add a topic cluster..."
                    className="bg-secondary border-border"
                    onKeyDown={(e) => e.key === "Enter" && addTopic()}
                  />
                  <Button onClick={addTopic} variant="outline"><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topics.map((topic, i) => (
                    <Badge key={i} variant="outline" className="px-3 py-1.5 bg-primary/5 border-primary/20 text-foreground">
                      {topic}
                      <button onClick={() => removeTopic(i)} className="ml-2 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Types Tab */}
          <TabsContent value="types" className="space-y-4">
            <div className="space-y-3">
              {contentTypes.map((type) => (
                <Card key={type.id} className="bg-card border-border">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{type.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{type.desc}</p>
                      </div>
                    </div>
                    <Switch defaultChecked={type.enabled} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Posting Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {defaultSchedule.map((item) => (
                    <div key={item.platform} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                      <span className="font-medium text-sm">{item.platform}</span>
                      <div className="flex items-center gap-3">
                        <Select defaultValue={item.frequency}>
                          <SelectTrigger className="w-[120px] h-8 bg-background border-border text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Daily">Daily</SelectItem>
                            <SelectItem value="3x/week">3x/week</SelectItem>
                            <SelectItem value="2x/week">2x/week</SelectItem>
                            <SelectItem value="Weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select defaultValue={item.time}>
                          <SelectTrigger className="w-[110px] h-8 bg-background border-border text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="8:00 AM">8:00 AM</SelectItem>
                            <SelectItem value="9:00 AM">9:00 AM</SelectItem>
                            <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                            <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                            <SelectItem value="3:00 PM">3:00 PM</SelectItem>
                            <SelectItem value="6:00 PM">6:00 PM</SelectItem>
                          </SelectContent>
                        </Select>
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
