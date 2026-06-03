import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CreditCard, CheckCircle, Zap, Crown, Rocket, Inbox, Lock, AlertTriangle
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { toast } from "sonner";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$97",
    period: "/month",
    features: ["3 platforms", "30 posts/month", "1 team member", "Blog + Social content", "Basic analytics", "Email support"],
    lockedFeatures: ["AI citation tracking", "Video generation", "White-label", "API access"],
    icon: Zap,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$197",
    period: "/month",
    features: ["6 platforms", "Unlimited posts", "5 team members", "All content types", "Advanced analytics", "AI citation tracking", "Video generation", "Priority support"],
    lockedFeatures: ["White-label", "API access", "Custom integrations"],
    icon: Crown,
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$497",
    period: "/month",
    features: ["Unlimited platforms", "Unlimited posts", "Unlimited team members", "All content types", "Custom analytics", "White-label options", "API access", "Custom integrations", "Dedicated support"],
    lockedFeatures: [],
    icon: Rocket,
  },
];

export default function Billing() {
  const { user } = useAuth();
  const { data: invoices, isLoading: invoicesLoading } = trpc.billing.invoices.useQuery();
  const { data: usageData } = trpc.usage.get.useQuery();
  const { data: planData } = trpc.usage.plan.useQuery();

  const currentPlan = planData?.tier || user?.planTier || "free";
  const limits = planData?.limits;
  const subscriptionStatus = user?.subscriptionStatus || "trialing";

  // Handle URL params from Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) {
      toast.success("Subscription activated! Welcome to your new plan.");
      window.history.replaceState({}, document.title, "/billing");
    } else if (params.get("canceled")) {
      toast.info("Checkout canceled. No changes made.");
      window.history.replaceState({}, document.title, "/billing");
    } else if (params.get("error")) {
      toast.error(params.get("error"));
      window.history.replaceState({}, document.title, "/billing");
    }
  }, []);

  const handleUpgrade = (planId: string) => {
    window.location.href = `/api/stripe/checkout?plan=${planId}`;
  };

  const handleManageBilling = () => {
    window.location.href = "/api/stripe/portal";
  };

  // Usage calculations
  const postsUsed = usageData?.postsPublished || 0;
  const postsLimit = limits?.maxPostsPerMonth || 0;
  const postsPercentage = postsLimit > 0 ? Math.min((postsUsed / postsLimit) * 100, 100) : 0;
  const isUnlimitedPosts = postsLimit === -1;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Billing & Subscription</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your plan, usage, and payment methods</p>
          </div>
          {currentPlan !== "free" && (
            <Button variant="outline" onClick={handleManageBilling}>
              <CreditCard className="w-4 h-4 mr-2" /> Manage in Stripe
            </Button>
          )}
        </div>

        {/* Current Plan & Status */}
        <Card className="bg-card border-border border-primary/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg gradient-orange flex items-center justify-center">
                  <Crown className="w-6 h-6 text-black" />
                </div>
                <div>
                  <p className="font-semibold text-lg capitalize">{currentPlan} Plan</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={
                      subscriptionStatus === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                      subscriptionStatus === "trialing" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      subscriptionStatus === "past_due" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      "bg-muted text-muted-foreground"
                    }>
                      {subscriptionStatus === "active" ? "Active" :
                       subscriptionStatus === "trialing" ? "Free Trial" :
                       subscriptionStatus === "past_due" ? "Payment Due" :
                       subscriptionStatus}
                    </Badge>
                  </div>
                </div>
              </div>
              {subscriptionStatus === "past_due" && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm font-medium">Payment failed — update your card</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage This Month */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Usage This Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Posts Created</span>
                <span className="font-medium">
                  {postsUsed}{isUnlimitedPosts ? "" : ` / ${postsLimit}`}
                  {isUnlimitedPosts && <span className="text-green-400 ml-1">(Unlimited)</span>}
                </span>
              </div>
              {!isUnlimitedPosts && (
                <Progress value={postsPercentage} className="h-2" />
              )}
              {!isUnlimitedPosts && postsPercentage >= 80 && (
                <p className="text-xs text-yellow-400 mt-1">Approaching limit — upgrade for more posts</p>
              )}
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>AI Generations</span>
                <span className="font-medium">{usageData?.aiGenerations || 0}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Platforms Connected</span>
                <span className="font-medium">
                  {usageData?.platformsConnected || 0}
                  {limits && limits.maxPlatforms > 0 && ` / ${limits.maxPlatforms}`}
                  {limits?.maxPlatforms === -1 && <span className="text-green-400 ml-1">(Unlimited)</span>}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plans */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Available Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isCurrent = currentPlan === plan.id;
              const isDowngrade = plans.findIndex(p => p.id === currentPlan) > plans.findIndex(p => p.id === plan.id);
              return (
                <Card key={plan.id} className={`bg-card border-border ${plan.popular ? "ring-1 ring-primary" : ""} ${isCurrent ? "border-green-500/30" : ""}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold">{plan.name}</h3>
                      {plan.popular && <Badge className="gradient-orange text-black text-[10px]">Popular</Badge>}
                      {isCurrent && <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">Current</Badge>}
                    </div>
                    <p className="text-3xl font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground">{plan.period}</span></p>
                    <ul className="mt-4 space-y-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                          {f}
                        </li>
                      ))}
                      {plan.lockedFeatures.map((f, i) => (
                        <li key={`locked-${i}`} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Lock className="w-4 h-4 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full mt-4 ${!isCurrent && !isDowngrade ? "gradient-orange text-black font-semibold hover:opacity-90" : ""}`}
                      variant={isCurrent || isDowngrade ? "outline" : "default"}
                      disabled={isCurrent}
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      {isCurrent ? "Current Plan" : isDowngrade ? "Downgrade" : "Upgrade"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Invoice History */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Invoice History</CardTitle>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : invoices && invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-3 px-2">Date</th>
                      <th className="text-left py-3 px-2">Description</th>
                      <th className="text-left py-3 px-2">Amount</th>
                      <th className="text-left py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv: any) => (
                      <tr key={inv.id} className="border-b border-border last:border-0">
                        <td className="py-3 px-2">{new Date(inv.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-2">{inv.description || "Subscription payment"}</td>
                        <td className="py-3 px-2 font-medium">${((inv.amount || 0) / 100).toFixed(2)}</td>
                        <td className="py-3 px-2">
                          <Badge variant="outline" className={
                            inv.status === "paid" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                            inv.status === "failed" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                          }>
                            {inv.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Inbox className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No invoices yet</p>
                <p className="text-xs mt-1">Invoices will appear here after your first payment</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
