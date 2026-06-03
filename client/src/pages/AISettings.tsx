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
import { Bot, Palette, Tags, Calendar, Save, Plus, X, Sparkles, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_CONTENT_TYPES = [
  { id: "blog", name: "Blog Posts", desc: "Long-form SEO content for WordPress", enabled: true },
  { id: "social", name: "Social Media", desc: "Short-form posts for Instagram, Facebook, Reddit", enabled: true },
  { id: "video", name: "Video Scripts", desc: "30-45 second scripts for TikTok & YouTube Shorts", enabled: true },
  { id: "schema", name: "Schema Markup", desc: "JSON-LD structured data for AI engine optimization", enabled: false },
];

const DEFAULT_SCHEDULE = [
  { platform: "Google Business", frequency: "Daily", time: "9:00 AM" },
  { platform: "Instagram", frequency: "Daily", time: "12:00 PM" },
  { platform: "Facebook", frequency: "Daily", time: "12:00 PM" },
  { platform: "TikTok", frequency: "3x/week", time: "3:00 PM" },
  { platform: "YouTube", frequency: "2x/week", time: "10:00 AM" },
  { platform: "Reddit", frequency: "3x/week", time: "10:00 AM" },
  { platform: "WordPress", frequency: "2x/week", time: "8:00 AM" },
];

export default function AISettings() {
  const { data: business, isLoading } = trpc.business.get.useQuery();
  const utils = trpc.useUtils();

  const [description, setDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [toneOfVoice, setToneOfVoice] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [autoApprove, setAutoApprove] = useState(false);
  const [contentTypes, setContentTypes] = useState(DEFAULT_CONTENT_TYPES);
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);

  // Load from business data
  useEffect(() => {
    if (business) {
      setDescription(business.description || "");
      setTargetAudience(business.targetAudience || "");
      setToneOfVoice(business.toneOfVoice || "");
      setAutoApprove(business.autoApprove || false);
      if (business.topicClusters && Array.isArray(business.topicClusters)) {
        setTopics(business.topicClusters as string[]);
      }
      if (business.contentTypes && Array.isArray(business.contentTypes)) {
        setContentTypes(business.contentTypes as typeof DEFAULT_CONTENT_TYPES);
      }
      if (business.postingSchedule && Array.isArray(business.postingSchedule)) {
        setSchedule(business.postingSchedule as typeof DEFAULT_SCHEDULE);
      }
    }
  }, [business]);

  const updateMutation = trpc.business.update.useMutation({
    onSuccess: () => {
      toast.success("AI settings saved to database");
      utils.business.get.invalidate();
    },
    onError: (err) => toast.error(`Save failed: ${err.message}`),
  });

  const handleSave = () => {
    if (!business) {
      toast.error("No business found. Complete onboarding first.");
      return;
    }
    updateMutation.mutate({
      id: business.id,
      description,
      targetAudience,
      toneOfVoice,
      topicClusters: topics,
      contentTypes,
      postingSchedule: schedule,
      autoApprove,
    });
  };

  const addTopic = () => {
    if (newTopic.trim()) {
      setTopics([...topics, newTopic.trim()]);
      setNewTopic("");
    }
  };

  const removeTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const toggleContentType = (id: string) => {
    setContentTypes(contentTypes.map(ct => ct.id === id ? { ...ct, enabled: !ct.enabled } : ct));
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!business) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Bot className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">No business configured</p>
          <p className="text-sm mt-1">Complete the onboarding wizard to configure AI settings</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Content Settings</h1>
            <p className="text-muted-foreground text-sm mt-1">Configure your AI content generation pipeline</p>
          </div>
          <Button
            className="gradient-orange text-black font-semibold hover:opacity-90"
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
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
              <Sparkles className="w-4 h-4 mr-2" /> Content Types
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Calendar className="w-4 h-4 mr-2" /> Schedule
            </TabsTrigger>
          </TabsList>

          {/* Brand Voice */}
          <TabsContent value="voice" className="space-y-4">
            <Card className="bg-card border-border">
              <CardContent className="p-5 space-y-4">
                <div>
                  <Label>Business Description</Label>
                  <Textarea className="mt-1.5" placeholder="Describe your business, products, and services..."
                    value={description} onChange={e => setDescription(e.target.value)} rows={3} />
                </div>
                <div>
                  <Label>Target Audience</Label>
                  <Input className="mt-1.5" placeholder="e.g., Small business owners aged 30-55 in the US"
                    value={targetAudience} onChange={e => setTargetAudience(e.target.value)} />
                </div>
                <div>
                  <Label>Tone of Voice</Label>
                  <Select value={toneOfVoice} onValueChange={setToneOfVoice}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select tone..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional & Authoritative</SelectItem>
                      <SelectItem value="friendly">Friendly & Conversational</SelectItem>
                      <SelectItem value="witty">Witty & Playful</SelectItem>
                      <SelectItem value="educational">Educational & Informative</SelectItem>
                      <SelectItem value="bold">Bold & Provocative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <Label>Auto-Approve Content</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Skip manual review and publish AI content automatically</p>
                  </div>
                  <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Topics */}
          <TabsContent value="topics" className="space-y-4">
            <Card className="bg-card border-border">
              <CardContent className="p-5 space-y-4">
                <div>
                  <Label>Topic Clusters</Label>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-3">AI will generate content around these topics</p>
                  <div className="flex gap-2 mb-3">
                    <Input placeholder="Add a topic..." value={newTopic} onChange={e => setNewTopic(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addTopic()} />
                    <Button onClick={addTopic} variant="outline"><Plus className="w-4 h-4" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {topics.map((topic, i) => (
                      <Badge key={i} variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                        {topic}
                        <button onClick={() => removeTopic(i)} className="ml-2 hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {topics.length === 0 && (
                      <p className="text-sm text-muted-foreground">No topics added yet. Add topics to guide AI content generation.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Types */}
          <TabsContent value="types" className="space-y-4">
            <Card className="bg-card border-border">
              <CardContent className="p-5 space-y-3">
                {contentTypes.map(ct => (
                  <div key={ct.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-sm">{ct.name}</p>
                      <p className="text-xs text-muted-foreground">{ct.desc}</p>
                    </div>
                    <Switch checked={ct.enabled} onCheckedChange={() => toggleContentType(ct.id)} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule */}
          <TabsContent value="schedule" className="space-y-4">
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="space-y-3">
                  {schedule.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <p className="font-medium text-sm">{s.platform}</p>
                      <div className="flex items-center gap-3">
                        <Select value={s.frequency} onValueChange={v => setSchedule(schedule.map((item, idx) => idx === i ? { ...item, frequency: v } : item))}>
                          <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Daily">Daily</SelectItem>
                            <SelectItem value="3x/week">3x/week</SelectItem>
                            <SelectItem value="2x/week">2x/week</SelectItem>
                            <SelectItem value="Weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input className="w-[100px] h-8 text-xs" value={s.time}
                          onChange={e => setSchedule(schedule.map((item, idx) => idx === i ? { ...item, time: e.target.value } : item))} />
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
