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
  Globe, Palette, CreditCard, Rocket
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const steps = [
  { id: 1, title: "Business Info", icon: Building2 },
  { id: 2, title: "Connect Platforms", icon: Globe },
  { id: 3, title: "Content Preferences", icon: Palette },
  { id: 4, title: "Select Plan", icon: CreditCard },
  { id: 5, title: "Launch", icon: Rocket },
];

const platforms = [
  { id: "google", name: "Google Business", color: "bg-blue-500/10 text-blue-400" },
  { id: "meta", name: "Meta (Instagram/Facebook)", color: "bg-indigo-500/10 text-indigo-400" },
  { id: "tiktok", name: "TikTok", color: "bg-pink-500/10 text-pink-400" },
  { id: "youtube", name: "YouTube", color: "bg-red-500/10 text-red-400" },
  { id: "reddit", name: "Reddit", color: "bg-orange-500/10 text-orange-400" },
  { id: "wordpress", name: "WordPress", color: "bg-cyan-500/10 text-cyan-400" },
];

const industries = [
  "Restaurant / Food Service", "Healthcare / Medical", "Real Estate",
  "E-commerce / Retail", "Professional Services", "Technology / SaaS",
  "Fitness / Wellness", "Education", "Home Services", "Other"
];

const tones = ["Professional", "Casual", "Friendly", "Authoritative", "Humorous", "Inspirational"];

const plans = [
  { id: "starter", name: "Starter", price: "$97", period: "/mo", features: ["3 platforms", "30 posts/mo", "Basic analytics"] },
  { id: "pro", name: "Pro", price: "$197", period: "/mo", features: ["All 6 platforms", "Unlimited posts", "AI citations", "Video gen"], popular: true },
  { id: "enterprise", name: "Enterprise", price: "$497", period: "/mo", features: ["Unlimited everything", "White-label", "API access", "Priority support"] },
];

export default function Onboarding() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [tone, setTone] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [autoApprove, setAutoApprove] = useState(false);

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
    setConnectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const createBusiness = trpc.business.create.useMutation({
    onSuccess: () => {
      toast.success("Setup complete! Welcome to ContentFlow.");
      navigate("/dashboard");
    },
  });

  const handleComplete = () => {
    createBusiness.mutate({
      name: businessName || "My Business",
      industry: industry || undefined,
      websiteUrl: websiteUrl || undefined,
      toneOfVoice: tone || undefined,
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
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Tell us about your business</h2>
              <p className="text-muted-foreground mt-2">This helps our AI create perfectly tailored content.</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Business Name</Label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g., Acme Marketing" className="mt-1.5 bg-secondary border-border" />
              </div>
              <div>
                <Label>Industry</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger className="mt-1.5 bg-secondary border-border"><SelectValue placeholder="Select your industry" /></SelectTrigger>
                  <SelectContent>
                    {industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Website URL</Label>
                <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://yourbusiness.com" className="mt-1.5 bg-secondary border-border" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Connect Platforms */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Connect your platforms</h2>
              <p className="text-muted-foreground mt-2">Select the platforms where you want to publish content.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {platforms.map((p) => (
                <Card
                  key={p.id}
                  className={`cursor-pointer transition-all border-border hover:border-primary/50 ${connectedPlatforms.includes(p.id) ? "border-primary ring-1 ring-primary/30" : ""}`}
                  onClick={() => togglePlatform(p.id)}
                >
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
            <p className="text-xs text-muted-foreground text-center">You'll connect OAuth credentials in Settings after setup.</p>
          </div>
        )}

        {/* Step 3: Content Preferences */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Content preferences</h2>
              <p className="text-muted-foreground mt-2">Define your brand voice and content strategy.</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Brand Tone of Voice</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="mt-1.5 bg-secondary border-border"><SelectValue placeholder="Select tone" /></SelectTrigger>
                  <SelectContent>
                    {tones.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Content Types</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Blog Posts", "Social Media", "Video Scripts", "Schema Markup"].map(type => (
                    <Badge key={type} variant="outline" className="px-3 py-1.5 cursor-pointer hover:bg-primary/10 hover:border-primary/50">{type}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                <div>
                  <p className="font-medium text-sm">Auto-approve content</p>
                  <p className="text-xs text-muted-foreground">Publish without manual review</p>
                </div>
                <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Plan Selection */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Choose your plan</h2>
              <p className="text-muted-foreground mt-2">Start with a 14-day free trial. Cancel anytime.</p>
            </div>
            <div className="grid gap-4">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`cursor-pointer transition-all border-border hover:border-primary/50 ${selectedPlan === plan.id ? "border-primary ring-1 ring-primary/30" : ""}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full border-2 ${selectedPlan === plan.id ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{plan.name}</span>
                          {plan.popular && <Badge className="gradient-orange text-black text-[10px]">Popular</Badge>}
                        </div>
                        <div className="flex gap-2 mt-1">
                          {plan.features.map(f => (
                            <span key={f} className="text-xs text-muted-foreground">{f}</span>
                          ))}
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
            <div className="w-20 h-20 rounded-2xl gradient-orange flex items-center justify-center mx-auto animate-pulse-glow">
              <Rocket className="w-10 h-10 text-black" />
            </div>
            <h2 className="text-2xl font-bold">You're all set!</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your AI content automation is ready to go. ContentFlow will start generating and publishing content based on your preferences.
            </p>
            <div className="bg-card border border-border rounded-lg p-4 max-w-sm mx-auto text-left space-y-2">
              <div className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-primary" /> Business: {businessName || "Your Business"}</div>
              <div className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-primary" /> Platforms: {connectedPlatforms.length} selected</div>
              <div className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-primary" /> Plan: {plans.find(p => p.id === selectedPlan)?.name}</div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-10">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          {currentStep < 5 ? (
            <Button
              onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
              className="gradient-orange text-black font-semibold hover:opacity-90"
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} className="gradient-orange text-black font-semibold hover:opacity-90">
              Launch Dashboard <Rocket className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
