import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckCircle2, CreditCard, ExternalLink, Loader2, Zap } from "lucide-react";

const PLANS = [
  {
    key: "starter" as const,
    name: "Starter",
    price: "$97",
    period: "/mo",
    features: ["3 connected platforms", "50 AI generations/month", "Basic analytics", "Email support", "1 team member"],
  },
  {
    key: "pro" as const,
    name: "Pro",
    price: "$197",
    period: "/mo",
    popular: true,
    features: ["All 6 platforms", "200 AI generations/month", "Advanced analytics", "Priority support", "5 team members", "AEO optimization"],
  },
  {
    key: "agency" as const,
    name: "Agency",
    price: "$497",
    period: "/mo",
    features: ["Unlimited platforms", "Unlimited generations", "Custom analytics", "Dedicated support", "Unlimited team members", "White-label options"],
  },
];

export default function Billing() {
  const { data: subscription, isLoading } = trpc.billing.getSubscription.useQuery();
  const { data: usage } = trpc.content.getUsage.useQuery();

  const createCheckout = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (err) => toast.error(err.message),
  });

  const createPortal = trpc.billing.createPortalSession.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubscribe = (plan: "starter" | "pro" | "agency") => {
    createCheckout.mutate({
      plan,
      successUrl: `${window.location.origin}/billing?success=1`,
      cancelUrl: `${window.location.origin}/billing`,
    });
  };

  const handleManage = () => {
    createPortal.mutate({ returnUrl: `${window.location.origin}/billing` });
  };

  const currentPlan = subscription?.plan ?? "free";
  const isActive = subscription?.status === "active" || subscription?.status === "trialing";

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-1">Manage your plan and billing information.</p>
      </div>

      {/* Current plan */}
      {!isLoading && (
        <div className="p-5 rounded-xl border border-border bg-card mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold text-foreground capitalize">{currentPlan}</span>
                {isActive && currentPlan !== "free" && (
                  <span className="px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 text-xs font-medium">Active</span>
                )}
                {subscription?.status === "past_due" && (
                  <span className="px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-xs font-medium">Past Due</span>
                )}
              </div>
              {usage && (
                <p className="text-xs text-muted-foreground mt-1">
                  {usage.used} / {usage.limit ?? "∞"} generations used this month
                </p>
              )}
            </div>
            {currentPlan !== "free" && (
              <button
                onClick={handleManage}
                disabled={createPortal.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all disabled:opacity-50"
              >
                {createPortal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                Manage Billing
              </button>
            )}
          </div>

          {usage?.limit && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>Generation usage</span>
                <span>{usage.used} / {usage.limit}</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Plans */}
      <h2 className="font-semibold text-foreground mb-4">Available Plans</h2>
      <div className="grid md:grid-cols-3 gap-5">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          return (
            <div
              key={plan.key}
              className={`relative p-5 rounded-xl border flex flex-col ${
                plan.popular ? "border-primary bg-card" : "border-border bg-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  Most Popular
                </div>
              )}
              <div className="mb-4">
                <h3 className="font-bold text-foreground">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary/15 text-primary text-sm font-medium">
                  <Zap className="w-4 h-4" /> Current Plan
                </div>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={createCheckout.isPending}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border text-foreground hover:border-primary/50 hover:text-primary"
                  }`}
                >
                  {createCheckout.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  {currentPlan === "free" ? "Subscribe" : "Switch Plan"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        Payments are processed securely by Stripe. Cancel anytime from the billing portal.
      </p>
    </div>
  );
}
