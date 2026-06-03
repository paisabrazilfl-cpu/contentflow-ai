import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowRight,
  BarChart3,
  Bolt,
  Calendar,
  CheckCircle2,
  Link2,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { useLocation } from "wouter";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Content Generation",
    desc: "Generate SEO-optimized content for 6+ platforms using Claude & GPT-4o with brand voice customization.",
  },
  {
    icon: Link2,
    title: "Multi-Platform Publishing",
    desc: "Publish to YouTube, Google Business, Facebook, Instagram, TikTok, and Reddit from one dashboard.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    desc: "Queue posts and let the automated worker publish at your scheduled times — every 5 minutes.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Tracking",
    desc: "Track generation usage, publish counts, and platform performance across all connected accounts.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    desc: "OAuth token encryption, Stripe webhook verification, and per-tenant data isolation.",
  },
  {
    icon: Zap,
    title: "AEO Optimization",
    desc: "Content optimized for AI citation engines — get referenced by ChatGPT, Claude, and Gemini.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "$97",
    desc: "Perfect for small businesses getting started with AI content.",
    features: ["3 connected platforms", "50 AI generations/month", "Basic analytics", "Email support", "1 team member"],
    cta: "Get Started",
    plan: "starter" as const,
  },
  {
    name: "Pro",
    price: "$197",
    desc: "For growing businesses that need full automation power.",
    features: ["All 6 platforms", "200 AI generations/month", "Advanced analytics", "Priority support", "5 team members", "AEO optimization"],
    cta: "Get Started",
    plan: "pro" as const,
    popular: true,
  },
  {
    name: "Agency",
    price: "$497",
    desc: "For agencies and large businesses with multiple brands.",
    features: ["Unlimited platforms", "Unlimited generations", "Custom analytics", "Dedicated support", "Unlimited team members", "White-label options"],
    cta: "Get Started",
    plan: "agency" as const,
  },
];

const TESTIMONIALS = [
  {
    quote: "ContentFlow replaced our entire content team's manual workflow. We went from 5 posts/week to 30+ across all platforms.",
    name: "Sarah Chen",
    role: "Marketing Director, TechFlow",
  },
  {
    quote: "The AI citation tracking is incredible. We can actually see when ChatGPT recommends our restaurant.",
    name: "Marcus Johnson",
    role: "Founder, LocalEats",
  },
  {
    quote: "Managing 12 client accounts used to take 40 hours/week. Now it takes 4. The ROI is insane.",
    name: "Emily Rodriguez",
    role: "Agency Owner, BrightMedia",
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Bolt className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">ContentFlow</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={handleGetStarted}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={handleGetStarted}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.65_0.18_40/0.08),transparent_60%)]" />
        <div className="container relative text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-6">
            <Sparkles className="w-3 h-3" />
            AI-Powered Content Automation
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Automate Your Content.{" "}
            <span className="text-gradient">Dominate Every Platform.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Generate, schedule, and publish AI-optimized content across YouTube, Google Business, Instagram, Facebook, TikTok, and Reddit — all on autopilot.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleGetStarted}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all glow-orange-sm"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              className="px-6 py-3 rounded-xl border border-border text-muted-foreground font-semibold text-base hover:text-foreground hover:border-foreground/30 transition-all"
            >
              See Features
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">No credit card required · 14-day free trial · Cancel anytime</p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto">
            {[
              { value: "6+", label: "Platforms" },
              { value: "50K+", label: "Posts Published" },
              { value: "97%", label: "Gross Margin" },
              { value: "2,500+", label: "Active Businesses" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 border-t border-border">
        <div className="container">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-secondary text-muted-foreground text-xs font-medium mb-4">
              Features
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Dominate</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              One platform to generate, optimize, schedule, and track AI-powered content across every channel.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/25 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 border-t border-border">
        <div className="container">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-secondary text-muted-foreground text-xs font-medium mb-4">
              Pricing
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground">Choose the plan that fits your business. Upgrade or downgrade anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-6 rounded-xl border ${
                  plan.popular
                    ? "border-primary bg-card glow-orange-sm"
                    : "border-border bg-card"
                } flex flex-col`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    Most Popular
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleGetStarted}
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border text-foreground hover:border-primary/50 hover:text-primary"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 border-t border-border">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by Businesses Worldwide</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="p-6 rounded-xl border border-border bg-card">
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Automate Your Content?</h2>
          <p className="text-muted-foreground mb-8">Join 2,500+ businesses using ContentFlow to dominate every platform.</p>
          <button
            onClick={handleGetStarted}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all glow-orange mx-auto"
          >
            Start Your Free Trial <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Bolt className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">ContentFlow AI</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
            <a href="mailto:support@contentflow.ai" className="hover:text-foreground transition-colors">Support</a>
          </div>
          <p>© 2026 ContentFlow AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
