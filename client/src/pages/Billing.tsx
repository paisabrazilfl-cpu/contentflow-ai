import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CreditCard, CheckCircle, ArrowUpRight, Download, ExternalLink, Zap, Crown
} from "lucide-react";
import { toast } from "sonner";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$97",
    period: "/mo",
    features: ["3 connected platforms", "30 posts/month", "Basic analytics", "Email support", "1 team member"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$197",
    period: "/mo",
    features: ["All 6 platforms", "Unlimited posts", "Advanced analytics", "Priority support", "5 team members", "AI citation tracking", "Video generation"],
    current: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$497",
    period: "/mo",
    features: ["Unlimited everything", "White-label options", "API access", "Dedicated support", "Unlimited team members", "Custom integrations"],
  },
];

const invoices = [
  { id: "INV-2026-006", date: "Jun 1, 2026", amount: "$197.00", status: "paid" },
  { id: "INV-2026-005", date: "May 1, 2026", amount: "$197.00", status: "paid" },
  { id: "INV-2026-004", date: "Apr 1, 2026", amount: "$197.00", status: "paid" },
  { id: "INV-2026-003", date: "Mar 1, 2026", amount: "$97.00", status: "paid" },
  { id: "INV-2026-002", date: "Feb 1, 2026", amount: "$97.00", status: "paid" },
  { id: "INV-2026-001", date: "Jan 1, 2026", amount: "$97.00", status: "paid" },
];

const usage = [
  { label: "Posts Published", current: 127, limit: "Unlimited", percentage: 0 },
  { label: "Platforms Connected", current: 5, limit: "6", percentage: 83 },
  { label: "Team Members", current: 3, limit: "5", percentage: 60 },
  { label: "AI Credits Used", current: 2400, limit: "5000", percentage: 48 },
];

export default function Billing() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Billing & Subscription</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your plan, usage, and payment methods</p>
          </div>
          <Button variant="outline" onClick={() => toast.info("Stripe Customer Portal coming soon")}>
            <ExternalLink className="w-4 h-4 mr-2" /> Manage in Stripe
          </Button>
        </div>

        {/* Current Plan */}
        <Card className="bg-card border-primary/30 ring-1 ring-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-orange flex items-center justify-center">
                  <Crown className="w-6 h-6 text-black" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold">Pro Plan</h3>
                    <Badge className="gradient-orange text-black">Active</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm mt-0.5">$197/month • Renews Jun 1, 2026</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">$197</p>
                <p className="text-sm text-muted-foreground">/month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Usage This Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {usage.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="text-muted-foreground">{item.current.toLocaleString()} / {item.limit}</span>
                </div>
                {item.percentage > 0 && (
                  <Progress value={item.percentage} className="h-2" />
                )}
                {item.percentage === 0 && (
                  <div className="flex items-center gap-1 text-xs text-green-400">
                    <CheckCircle className="w-3 h-3" /> Unlimited on your plan
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Plan Comparison */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Available Plans</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className={`bg-card border-border ${plan.current ? "border-primary ring-1 ring-primary/30" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{plan.name}</h4>
                    {plan.current && <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Current</Badge>}
                  </div>
                  <div className="mb-4">
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.current ? (
                    <Button variant="outline" className="w-full" disabled>Current Plan</Button>
                  ) : (
                    <Button
                      variant={plan.id === "enterprise" ? "default" : "outline"}
                      className={`w-full ${plan.id === "enterprise" ? "gradient-orange text-black font-semibold hover:opacity-90" : ""}`}
                      onClick={() => toast.info("Plan change coming soon - Stripe Checkout")}
                    >
                      {plan.id === "starter" ? "Downgrade" : "Upgrade"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Visa ending in 4242</p>
                  <p className="text-xs text-muted-foreground">Expires 12/2027</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.info("Stripe payment method update coming soon")}>
                Update
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Invoice History */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Invoice History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-mono text-muted-foreground">{inv.id}</span>
                    <span className="text-sm">{inv.date}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{inv.amount}</span>
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">{inv.status}</Badge>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
