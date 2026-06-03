import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Copy, Calendar, Loader2, ChevronDown } from "lucide-react";
import { Streamdown } from "streamdown";

const PLATFORMS = [
  { value: "google_youtube", label: "YouTube" },
  { value: "google_business", label: "Google Business" },
  { value: "meta_facebook", label: "Facebook" },
  { value: "meta_instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "reddit", label: "Reddit" },
] as const;

const CONTENT_TYPES = [
  { value: "blog_post", label: "Blog Post" },
  { value: "social_post", label: "Social Post" },
  { value: "video_script", label: "Video Script" },
  { value: "community_post", label: "Community Post" },
  { value: "ad_copy", label: "Ad Copy" },
  { value: "email_newsletter", label: "Email Newsletter" },
] as const;

type Platform = typeof PLATFORMS[number]["value"];
type ContentType = typeof CONTENT_TYPES[number]["value"];

export default function ContentGenerator() {
  const [platform, setPlatform] = useState<Platform>("meta_instagram");
  const [contentType, setContentType] = useState<ContentType>("social_post");
  const [topic, setTopic] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");

  const utils = trpc.useUtils();
  const { data: usage } = trpc.content.getUsage.useQuery();

  const generate = trpc.content.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      utils.content.getUsage.invalidate();
      toast.success("Content generated successfully!");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const queuePost = trpc.content.queuePost.useMutation({
    onSuccess: () => {
      toast.success("Post added to queue!");
      setShowSchedule(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    generate.mutate({ platform, contentType, topic, additionalContext: additionalContext || undefined });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success("Copied to clipboard!");
  };

  const handleSchedule = () => {
    if (!scheduledAt) {
      toast.error("Please select a date and time");
      return;
    }
    queuePost.mutate({
      platform,
      contentType: "post",
      body: generatedContent,
      scheduledAt: new Date(scheduledAt).toISOString(),
    });
  };

  const atLimit = usage?.limit !== null && usage?.used !== undefined && usage?.limit !== undefined && usage.used >= usage.limit;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">AI Content Generator</h1>
        <p className="text-muted-foreground mt-1">Generate platform-optimized content with AI.</p>
      </div>

      {/* Usage */}
      {usage && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-lg border mb-6 text-sm ${atLimit ? "border-destructive/50 bg-destructive/10" : "border-border bg-card"}`}>
          <span className="text-muted-foreground">
            Generations this month: <span className="font-semibold text-foreground">{usage.used}</span>
            {usage.limit !== null ? ` / ${usage.limit}` : " (unlimited)"}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
            usage.plan === "agency" ? "bg-purple-500/20 text-purple-400" :
            usage.plan === "pro" ? "bg-blue-500/20 text-blue-400" :
            usage.plan === "starter" ? "bg-primary/20 text-primary" :
            "bg-secondary text-muted-foreground"
          }`}>{usage.plan}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-border bg-card space-y-4">
            <h2 className="font-semibold text-foreground text-sm">Configuration</h2>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Platform</label>
              <div className="relative">
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as Platform)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm appearance-none pr-8 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Content Type</label>
              <div className="relative">
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as ContentType)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm appearance-none pr-8 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {CONTENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Topic / Prompt *</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. 5 tips for growing your Instagram following in 2026"
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Additional Context (optional)</label>
              <textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="Any specific details, keywords, or tone instructions..."
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={generate.isPending || atLimit}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generate.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate Content</>
              )}
            </button>
            {atLimit && (
              <p className="text-xs text-destructive text-center">Generation limit reached. <a href="/billing" className="underline">Upgrade your plan</a></p>
            )}
          </div>
        </div>

        {/* Output panel */}
        <div className="p-5 rounded-xl border border-border bg-card flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground text-sm">Generated Content</h2>
            {generatedContent && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
                <button
                  onClick={() => setShowSchedule(!showSchedule)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs font-medium hover:bg-primary/25 transition-all"
                >
                  <Calendar className="w-3.5 h-3.5" /> Schedule
                </button>
              </div>
            )}
          </div>

          {showSchedule && generatedContent && (
            <div className="mb-4 p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
              <label className="text-xs font-medium text-muted-foreground block">Schedule for</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-secondary text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={handleSchedule}
                disabled={queuePost.isPending}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {queuePost.isPending ? "Adding..." : "Add to Queue"}
              </button>
            </div>
          )}

          <div className="flex-1 min-h-48 overflow-y-auto">
            {generate.isPending ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm">Generating your content...</p>
              </div>
            ) : generatedContent ? (
              <div className="prose prose-invert prose-sm max-w-none text-foreground">
                <Streamdown>{generatedContent}</Streamdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <Sparkles className="w-10 h-10 opacity-30" />
                <p className="text-sm text-center">Your generated content will appear here.<br />Fill in the form and click Generate.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
