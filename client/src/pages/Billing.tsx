import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckCircle2, CreditCard, ExternalLink, Loader2, XCircle, Zap } from "lucide-react";
import { PLANS } from "../../../shared/plans";

const PLAN_FEATURES: Record<string, string[]> = {
  free: [
    "1 platform connection",
    "5 AI generations/month",
    "5 scheduled posts/month",
    "Solo only (1 user)",
    "3-day analytics",
    "No API access",
  ],
  starter: [
    "3 platform connections",
    "50 AI generations/month",
    "30 scheduled posts/month",
    "Solo only (1 user)",
    "7-day analytics",
    "Email support",
    "No API access",
  ],
  pro: [
    "All 6 platform connections",
    "200 AI generations/month",
    "150 scheduled posts/month",
    "Up to 3 team members",
    "90-day analytics + export",
    "Priority support",
    "No API access",
  ],
  agency: [
    "All 6 platform connections",
    "Unlimited AI generations",
    "Unlimited scheduled posts",
    "Unlimited team members",
    "Full analytics (all time) + export",
    "Dedicated support",
    "API access enabled",
    "White-label (remove branding)",
  ],
};

const PAID_PLANS = [
  { key: "starter" as const, popular: false },
  { key: "pro" as const, popular: true },
  { key: "agency" as const, popular: false },
];

function UsageBar({ label, used, limit, unlimited }: { label: string; used: number; limit: number | null; unlimited: boolean }) {
  const pct = unlimited || !limit ? 0 : Math.min(100, (used / limit) * 100);
  const atLimit = !unlimited && limit !== null && used >= limit;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className={atLimit ? "text-destructive font-medium" : "text-foreground font-medium"}>
          {used} / {unlimited ? "∞" : (limit ?? "—")}
          {atLimit && " — limit reached"}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${atLimit ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function Billing() {
  const { data: subscription, isLoading: subLoading } = trpc.billing.getSubscription.useQuery();
  const { data: tierSummary, isLoading: tierLoading } = trpc.content.getTierSummary.useQuery();

  const createCheckout = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => { if (data.url) window.location.href = data.url; },
    onError: (err) => toast.error(err.message),
  });

  const createPortal = trpc.billing.createPortalSession.useMutation({
    onSuccess: (data) => { window.location.href = data.url; },
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

  const currentPlan = (subscription?.plan ?? "free") as keyof typeof PLANS;
  const isActive = subscription?.status === "active" || subscription?.status === "trialing" || currentPlan === "free";
  const isLoading = subLoading || tierLoading;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-1">Manage your plan and track your usage.</p>
      </div>

      {/* Current plan card */}
      {!isLoading && (
        <div className="p-5 rounded-xl border border-border bg-card mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Current Plan</p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground capitalize">{PLANS[currentPlan].name}</span>
                {isActive && currentPlan !== "free" && (
                  <span className="px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 text-xs font-medium">Active</span>
                )}
                {subscription?.status === "past_due" && (
                  <span className="px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-xs font-medium flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Past Due
                  </span>
                )}
                {'cancelAtPeriodEnd' in (subscription ?? {}) && (subscription as {cancelAtPeriodEnd?: boolean})?.cancelAtPeriodEnd && (
                  <span className="px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 text-xs font-medium">Cancels at period end</span>
                )}
              </div>
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

          {/* Live usage bars */}
          {tierSummary && (
            <div className="space-y-3">
              <UsageBar
                label="AI Generations this month"
                used={tierSummary.generations.used}
                limit={tierSummary.generations.limit}
                unlimited={tierSummary.generations.unlimited}
              />
              <UsageBar
                label="Platform Connections"
                used={tierSummary.platformConnections.used}
                limit={tierSummary.platformConnections.limit}
                unlimited={tierSummary.platformConnections.unlimited}
              />
              <UsageBar
                label="Scheduled Posts this month"
                used={tierSummary.scheduledPosts.used}
                limit={tierSummary.scheduledPosts.limit}
                unlimited={tierSummary.scheduledPosts.unlimited}
              />
              <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
                <span className={tierSummary.apiAccess ? "text-green-400" : ""}>
                  API Access: {tierSummary.apiAccess ? "✓ Enabled" : "✗ Not available"}
                </span>
                <span>
                  Analytics: {tierSummary.analyticsLookbackDays === null ? "All time" : `Last ${tierSummary.analyticsLookbackDays} days`}
                </span>
                {tierSummary.analyticsExport && <span className="text-green-400">Export: ✓</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upgrade plans */}
      <h2 className="font-semibold text-foreground mb-4">
        {currentPlan === "free" ? "Choose a Plan" : "Change Plan"}
      </h2>
      <div className="grid md:grid-cols-3 gap-5">
        {PAID_PLANS.map(({ key, popular }) => {
          const plan = PLANS[key];
          const isCurrent = currentPlan === key;
          const features = PLAN_FEATURES[key] ?? [];

          return (
            <div
              key={key}
              className={`relative p-5 rounded-xl border flex flex-col ${
                popular ? "border-primary bg-card" : "border-border bg-card"
              }`}
            >
              {popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  Most Popular
                </div>
              )}
              <div className="mb-4">
                <h3 className="font-bold text-foreground">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-extrabold text-foreground">${plan.price}</span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                </div>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
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
                  onClick={() => handleSubscribe(key)}
                  disabled={createCheckout.isPending}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 ${
                    popular
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
        Payments processed securely by Stripe. Cancel anytime from the billing portal.
      </p>
    </div>
  );
}
