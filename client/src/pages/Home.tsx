import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import {
  Zap, Globe, BarChart3, Bot, Calendar, Shield,
  CheckCircle, ArrowRight, Star, TrendingUp, Users, Sparkles
} from "lucide-react";

const features = [
  { icon: Bot, title: "AI Content Generation", desc: "Generate SEO-optimized content adapted for 9+ platforms automatically using Claude & GPT-4o." },
  { icon: Globe, title: "Multi-Platform Publishing", desc: "Publish to Google, Meta, TikTok, YouTube, Reddit, and WordPress from one dashboard." },
  { icon: Calendar, title: "Smart Scheduling", desc: "AI-powered scheduling that posts at optimal times for maximum engagement." },
  { icon: BarChart3, title: "AI Citation Tracking", desc: "Track when AI engines like ChatGPT, Claude, and Gemini cite your business." },
  { icon: Shield, title: "Enterprise Security", desc: "OAuth token encryption, CORS enforcement, and Stripe webhook verification." },
  { icon: TrendingUp, title: "SEO & AEO Optimization", desc: "Schema markup, FAQ generation, and citation flooding for AI engine visibility." },
];

const plans = [
  {
    name: "Starter",
    price: "$97",
    period: "/mo",
    desc: "Perfect for small businesses getting started with AI content.",
    features: ["3 connected platforms", "30 posts/month", "Basic analytics", "Email support", "1 team member", "Blog + Social content"],
    popular: false,
  },
  {
    name: "Pro",
    price: "$197",
    period: "/mo",
    desc: "For growing businesses that need full automation power.",
    features: ["All 6 platforms", "Unlimited posts", "Advanced analytics", "Priority support", "5 team members", "All content types", "AI citation tracking", "Video generation"],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$497",
    period: "/mo",
    desc: "For agencies and large businesses with multiple brands.",
    features: ["Unlimited platforms", "Unlimited posts", "Custom analytics", "Dedicated support", "Unlimited team members", "All content types", "White-label options", "API access", "Custom integrations"],
    popular: false,
  },
];

const testimonials = [
  { name: "Sarah Chen", role: "Marketing Director, TechFlow", quote: "ContentFlow replaced our entire content team's manual workflow. We went from 5 posts/week to 30+ across all platforms.", rating: 5 },
  { name: "Marcus Johnson", role: "Founder, LocalEats", quote: "The AI citation tracking is incredible. We can actually see when ChatGPT recommends our restaurant.", rating: 5 },
  { name: "Emily Rodriguez", role: "Agency Owner, BrightMedia", quote: "Managing 12 client accounts used to take 40 hours/week. Now it takes 4. The ROI is insane.", rating: 5 },
];

const comparisonData = [
  { feature: "AI Content Generation", us: true, competitor1: true, competitor2: false },
  { feature: "Multi-Platform Publishing (6+)", us: true, competitor1: false, competitor2: true },
  { feature: "AI Citation Tracking", us: true, competitor1: false, competitor2: false },
  { feature: "Video Generation", us: true, competitor1: false, competitor2: false },
  { feature: "Schema Markup (JSON-LD)", us: true, competitor1: false, competitor2: false },
  { feature: "Multi-Tenant / Agency Mode", us: true, competitor1: true, competitor2: false },
  { feature: "Answer Engine Optimization", us: true, competitor1: false, competitor2: false },
  { feature: "Custom Brand Voice", us: true, competitor1: true, competitor2: true },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-orange flex items-center justify-center">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold">ContentFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button onClick={() => navigate("/dashboard")} className="gradient-orange text-black font-semibold hover:opacity-90">
                Dashboard <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => window.location.href = getLoginUrl("/dashboard")} className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
                <Button onClick={() => window.location.href = getLoginUrl("/onboarding")} className="gradient-orange text-black font-semibold hover:opacity-90">
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.72_0.17_50/0.1),transparent_60%)]" />
        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 px-4 py-1.5">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> AI-Powered Content Automation
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Automate Your Content.
              <br />
              <span className="text-gradient">Dominate Every Platform.</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Generate, schedule, and publish AI-optimized content across Google, TikTok, YouTube, Instagram, Facebook, Reddit, and WordPress — all on autopilot.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => window.location.href = getLoginUrl("/onboarding")}
                className="gradient-orange text-black font-semibold text-lg px-8 py-6 hover:opacity-90 glow-orange"
              >
                Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-border hover:bg-secondary">
                Watch Demo
              </Button>
            </div>
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-primary" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-primary" /> 14-day free trial</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-primary" /> Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 border-y border-border bg-card/50">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div><div className="text-3xl font-bold text-gradient">9+</div><div className="text-sm text-muted-foreground mt-1">Platforms Supported</div></div>
            <div><div className="text-3xl font-bold text-gradient">50K+</div><div className="text-sm text-muted-foreground mt-1">Posts Published</div></div>
            <div><div className="text-3xl font-bold text-gradient">97%</div><div className="text-sm text-muted-foreground mt-1">Gross Margin</div></div>
            <div><div className="text-3xl font-bold text-gradient">2,500+</div><div className="text-sm text-muted-foreground mt-1">Active Businesses</div></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Features</Badge>
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Dominate</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">One platform to generate, optimize, schedule, and track AI-powered content across every channel.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="bg-card border-border hover:border-primary/50 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <f.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-card/30">
        <div className="container">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Pricing</Badge>
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground text-lg">Choose the plan that fits your business. Upgrade or downgrade anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card key={plan.name} className={`relative bg-card border-border ${plan.popular ? "border-primary ring-1 ring-primary/50 scale-105" : ""} transition-all`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gradient-orange text-black font-semibold">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{plan.desc}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <Button
                    className={`w-full mb-6 ${plan.popular ? "gradient-orange text-black font-semibold hover:opacity-90" : ""}`}
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => window.location.href = getLoginUrl("/onboarding")}
                  >
                    Get Started
                  </Button>
                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Testimonials</Badge>
            <h2 className="text-4xl font-bold mb-4">Loved by Businesses Worldwide</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <Card key={t.name} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">"{t.quote}"</p>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 bg-card/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why ContentFlow Wins</h2>
            <p className="text-muted-foreground text-lg">See how we compare to traditional marketing tools.</p>
          </div>
          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-sm font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-primary">ContentFlow</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">Hootsuite</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">Buffer</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row) => (
                  <tr key={row.feature} className="border-b border-border/50">
                    <td className="py-3 px-4 text-sm">{row.feature}</td>
                    <td className="text-center py-3 px-4">
                      {row.us ? <CheckCircle className="w-5 h-5 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="text-center py-3 px-4">
                      {row.competitor1 ? <CheckCircle className="w-5 h-5 text-muted-foreground mx-auto" /> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="text-center py-3 px-4">
                      {row.competitor2 ? <CheckCircle className="w-5 h-5 text-muted-foreground mx-auto" /> : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Automate Your Content?</h2>
            <p className="text-muted-foreground text-lg mb-8">Join 2,500+ businesses using ContentFlow to dominate every platform with AI-powered content.</p>
            <Button
              size="lg"
              onClick={() => window.location.href = getLoginUrl("/onboarding")}
              className="gradient-orange text-black font-semibold text-lg px-8 py-6 hover:opacity-90 glow-orange"
            >
              Start Your Free Trial <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded gradient-orange flex items-center justify-center">
                <Zap className="w-4 h-4 text-black" />
              </div>
              <span className="font-semibold">ContentFlow</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
              <a href="mailto:support@contentflow.ai" className="hover:text-foreground transition-colors">Support</a>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 ContentFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
