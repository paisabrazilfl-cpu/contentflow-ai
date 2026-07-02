import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Zap, ArrowRight, ArrowLeft, CheckCircle, Building2,
  Globe, Palette, CreditCard, Rocket, Brain, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const steps = [
  { id: 1, title: "Business Info", icon: Building2 },
  { id: 2, title: "AI Analysis", icon: Brain },
  { id: 3, title: "Platforms", icon: Globe },
  { id: 4, title: "Plan", icon: CreditCard },
  { id: 5, title: "Launch", icon: Rocket },
];

const platforms = [
  { id: "google", name: "Google Business / YouTube", color: "bg-blue-500/10 text-blue-400" },
  { id: "instagram", name: "Instagram", color: "bg-pink-500/10 text-pink-400" },
  { id: "facebook", name: "Facebook", color: "bg-indigo-500/10 text-indigo-400" },
  { id: "tiktok", name: "TikTok", color: "bg-violet-500/10 text-violet-400" },
  { id: "reddit", name: "Reddit", color: "bg-orange-500/10 text-orange-400" },
  { id: "wordpress", name: "WordPress", color: "bg-cyan-500/10 text-cyan-400" },
];

const plans = [
  { id: "starter", name: "Starter", price: "$97", period: "/mo", features: ["3 platforms", "50 posts/mo", "Basic analytics"] },
  { id: "pro", name: "Pro", price: "$197", period: "/mo", features: ["All 6 platforms", "Unlimited posts", "AI visibility score", "Video gen"], popular: true },
  { id: "enterprise", name: "Enterprise", price: "$497", period: "/mo", features: ["Unlimited everything", "White-label", "API access", "Priority support"] },
];

export default function Onboarding() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [autoApprove, setAutoApprove] = useState(false);

  // AI Analysis results
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeMutation = trpc.business.analyze.useMutation({
    onSuccess: (data) => {
      setAnalysis(data);
      setAnalyzing(false);
      toast.success("Business analysis complete!");
    },
    onError: (err) => {
      setAnalyzing(false);
      toast.error(`Analysis failed: ${err.message}`);
    },
  });

  const createBusiness = trpc.business.create.useMutation({
    onSuccess: () => {
      toast.success("Setup complete! Welcome to ContentFlow.");
      navigate("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full bg-card border-border">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl gradient-orange flex items-center justify-center mx-auto mb-4">
              <Zap className="w-7 h-7 text-black" />
            </div>
            <h2 className="text-xl font-bold mb-2">Sign in to get started</h2>
            <p className="text-muted-foreground text-sm mb-6">Create your account to set up your AI content automation.</p>
            <Button onClick={() => { window.location.href = getLoginUrl("/onboarding"); }} className="gradient-orange text-black font-semibold w-full hover:opacity-90">
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const togglePlatform = (id: string) => {
    setConnectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleAnalyze = () => {
    if (!businessName || !websiteUrl) {
      toast.error("Enter your business name and website URL first");
      return;
    }
    setAnalyzing(true);
    analyzeMutation.mutate({ websiteUrl, businessName });
  };

  const handleComplete = () => {
    createBusiness.mutate({
      name: businessName || "My Business",
      industry: analysis?.industry || undefined,
      websiteUrl: websiteUrl || undefined,
      toneOfVoice: analysis?.toneOfVoice || undefined,
      targetAudience: analysis?.targetAudience || undefined,
      description: analysis?.contentStrategy || undefined,
      topicClusters: analysis?.topicClusters || [],
      postingSchedule: analysis?.postingSchedule || [],
      contentTypes: [
        { id: "blog", name: "Blog Posts", enabled: true },
        { id: "social", name: "Social Media", enabled: true },
        { id: "video", name: "Video Scripts", enabled: true },
        { id: "schema", name: "Schema Markup", enabled: true },
      ],
      autoApprove,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-orange flex items-center justify-center">
                <Zap className="w-4 h-4 text-black" />
              </div>
              <span className="font-bold">ContentFlow Setup</span>
            </div>
            <span className="text-sm text-muted-foreground">Step {currentStep} of 5</span>
          </div>
          <div className="flex gap-2">
            {steps.map((step) => (
              <div key={step.id} className={`h-1.5 flex-1 rounded-full transition-all ${step.id <= currentStep ? "gradient-orange" : "bg-secondary"}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="container pt-28 pb-12 max-w-2xl mx-auto">
        {/* Step 1: Business Info */}
        {currentStep === 1 && (
          <div className="space-y-4 md:space-y-6 px-2 md:px-0">
            <div className="text-center mb-8">
              <h2 className="text-xl md:text-2xl font-bold">Tell us about your business</h2>
              <p className="text-muted-foreground mt-2">We'll use AI to analyze your business and create a custom content strategy.</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Business Name *</Label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g., Acme Marketing" className="mt-1.5 bg-secondary border-border" />
              </div>
              <div>
                <Label>Website URL *</Label>
                <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://yourbusiness.com" className="mt-1.5 bg-secondary border-border" />
                <p className="text-xs text-muted-foreground mt-1">Our AI will analyze your website to build your content strategy</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: AI Business Analysis */}
        {currentStep === 2 && (
          <div className="space-y-4 md:space-y-6 px-2 md:px-0">
            <div className="text-center mb-8">
              <h2 className="text-xl md:text-2xl font-bold">AI Business Analysis</h2>
              <p className="text-muted-foreground mt-2">Our AI analyzes your business to create a tailored content strategy.</p>
            </div>

            {!analysis && !analyzing && (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Ready to Analyze</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Our AI will analyze "{businessName}" and generate topic clusters, posting schedules, competitor insights, and a full content strategy.
                  </p>
                  <Button onClick={handleAnalyze} className="gradient-orange text-black font-semibold hover:opacity-90">
                    <Brain className="w-4 h-4 mr-2" /> Analyze My Business
                  </Button>
                </CardContent>
              </Card>
            )}

            {analyzing && (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                  <h3 className="font-semibold text-lg mb-2">Analyzing your business...</h3>
                  <p className="text-sm text-muted-foreground">This takes 10-20 seconds. We're identifying your niche, competitors, and optimal content strategy.</p>
                </CardContent>
              </Card>
            )}

            {analysis && (
              <div className="space-y-4">
                <Card className="bg-card border-border border-green-500/30">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <h3 className="font-semibold">Analysis Complete</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Industry</p>
                        <p className="font-medium">{analysis.industry}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Tone</p>
                        <p className="font-medium">{analysis.toneOfVoice}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground text-xs">Target Audience</p>
                        <p className="font-medium">{analysis.targetAudience}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardContent className="p-5">
                    <h4 className="font-semibold text-sm mb-2">Topic Clusters ({analysis.topicClusters?.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.topicClusters?.map((t: string, i: number) => (
                        <Badge key={i} variant="outline" className="bg-primary/10 text-primary border-primary/20">{t}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardContent className="p-5">
                    <h4 className="font-semibold text-sm mb-2">Competitors Identified</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.competitors?.map((c: string, i: number) => (
                        <Badge key={i} variant="outline">{c}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardContent className="p-5">
                    <h4 className="font-semibold text-sm mb-2">Content Strategy</h4>
                    <p className="text-sm text-muted-foreground">{analysis.contentStrategy}</p>
                  </CardContent>
                </Card>

                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                  <div>
                    <p className="font-medium text-sm">Auto-approve AI content</p>
                    <p className="text-xs text-muted-foreground">Publish without manual review</p>
                  </div>
                  <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Platforms */}
        {currentStep === 3 && (
          <div className="space-y-4 md:space-y-6 px-2 md:px-0">
            <div className="text-center mb-8">
              <h2 className="text-xl md:text-2xl font-bold">Select publishing platforms</h2>
              <p className="text-muted-foreground mt-2">Choose where you want to publish content.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {platforms.map((p) => (
                <Card key={p.id} className={`cursor-pointer transition-all border-border hover:border-primary/50 ${connectedPlatforms.includes(p.id) ? "border-primary ring-1 ring-primary/30" : ""}`} onClick={() => togglePlatform(p.id)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${p.color}`}>
                        <Globe className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-sm">{p.name}</span>
                    </div>
                    {connectedPlatforms.includes(p.id) && <CheckCircle className="w-5 h-5 text-primary" />}
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">You'll connect OAuth credentials in the Platforms page after setup.</p>
          </div>
        )}

        {/* Step 4: Plan */}
        {currentStep === 4 && (
          <div className="space-y-4 md:space-y-6 px-2 md:px-0">
            <div className="text-center mb-8">
              <h2 className="text-xl md:text-2xl font-bold">Choose your plan</h2>
              <p className="text-muted-foreground mt-2">Start with a 14-day free trial. Cancel anytime.</p>
            </div>
            <div className="grid gap-4">
              {plans.map((plan) => (
                <Card key={plan.id} className={`cursor-pointer transition-all border-border hover:border-primary/50 ${selectedPlan === plan.id ? "border-primary ring-1 ring-primary/30" : ""}`} onClick={() => setSelectedPlan(plan.id)}>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full border-2 ${selectedPlan === plan.id ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{plan.name}</span>
                          {plan.popular && <Badge className="gradient-orange text-black text-[10px]">Popular</Badge>}
                        </div>
                        <div className="flex gap-2 mt-1">
                          {plan.features.map(f => <span key={f} className="text-xs text-muted-foreground">{f}</span>)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Launch */}
        {currentStep === 5 && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl gradient-orange flex items-center justify-center mx-auto">
              <Rocket className="w-10 h-10 text-black" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold">You're all set!</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your AI content automation is ready. ContentFlow will start generating and publishing content based on your AI-analyzed strategy.
            </p>
            <div className="bg-card border border-border rounded-lg p-4 max-w-sm mx-auto text-left space-y-2">
              <div className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-primary" /> Business: {businessName || "Your Business"}</div>
              {analysis && <div className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-primary" /> Industry: {analysis.industry}</div>}
              {analysis && <div className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-primary" /> Topics: {analysis.topicClusters?.length} clusters</div>}
              <div className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-primary" /> Platforms: {connectedPlatforms.length} selected</div>
              <div className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-primary" /> Plan: {plans.find(p => p.id === selectedPlan)?.name}</div>
              <div className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-primary" /> Auto-approve: {autoApprove ? "Yes" : "No"}</div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          <Button variant="outline" onClick={() => setCurrentStep(Math.max(1, currentStep - 1))} disabled={currentStep === 1}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          {currentStep < 5 ? (
            <Button onClick={() => setCurrentStep(Math.min(5, currentStep + 1))} className="gradient-orange text-black font-semibold hover:opacity-90"
              disabled={currentStep === 1 && (!businessName || !websiteUrl)}>
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} className="gradient-orange text-black font-semibold hover:opacity-90" disabled={createBusiness.isPending}>
              {createBusiness.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
              Launch Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
