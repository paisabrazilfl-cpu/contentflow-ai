/**
 * Stripe Routes — Complete billing integration
 * 
 * Endpoints:
 * - GET  /api/stripe/checkout?plan=starter|pro|enterprise — Creates Checkout Session
 * - POST /api/stripe/webhook — Handles Stripe webhook events
 * - GET  /api/stripe/portal — Redirects to Stripe Customer Portal
 */

import type { Express, Request, Response } from "express";
import { getDb } from "./db";
import { users, invoices } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME } from "../shared/const";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

// Plan configuration
const PLANS: Record<string, { priceAmount: number; name: string; tier: string }> = {
  starter: { priceAmount: 9700, name: "ContentFlow Starter ($97/mo)", tier: "starter" },
  pro: { priceAmount: 19700, name: "ContentFlow Pro ($197/mo)", tier: "pro" },
  enterprise: { priceAmount: 49700, name: "ContentFlow Enterprise ($497/mo)", tier: "enterprise" },
};

/**
 * Make a request to the Stripe API
 */
async function stripeAPI(endpoint: string, method: "GET" | "POST" = "POST", body?: Record<string, string>): Promise<any> {
  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };
  if (body && method === "POST") {
    options.body = new URLSearchParams(body).toString();
  }
  const res = await fetch(`https://api.stripe.com/v1${endpoint}`, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `Stripe API error: ${res.status}`);
  }
  return data;
}

/**
 * Get or create a Stripe customer for the user
 */
async function getOrCreateStripeCustomer(userId: number, email: string | null, name: string | null): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // Check if user already has a Stripe customer ID
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user?.stripeCustomerId) return user.stripeCustomerId;

  // Create new Stripe customer
  const customerParams: Record<string, string> = {};
  if (email) customerParams.email = email;
  if (name) customerParams.name = name;
  customerParams.metadata_user_id = userId.toString();

  // Flatten metadata for Stripe's URL-encoded format
  const body: Record<string, string> = {};
  if (email) body.email = email;
  if (name) body.name = name;
  body["metadata[user_id]"] = userId.toString();

  const customer = await stripeAPI("/customers", "POST", body);

  // Store the customer ID
  await db.update(users).set({ stripeCustomerId: customer.id }).where(eq(users.id, userId));

  return customer.id;
}

/**
 * Authenticate the current user from the session cookie on Express routes
 */
async function getUserFromRequest(req: Request): Promise<{ id: number; email: string | null; name: string | null; planTier: string | null } | null> {
  try {
    const user = await sdk.authenticateRequest(req);
    return user ? { id: user.id, email: user.email || null, name: user.name || null, planTier: user.planTier || null } : null;
  } catch {
    return null;
  }
}

export function registerStripeRoutes(app: Express) {
  /**
   * GET /api/stripe/checkout?plan=starter|pro|enterprise
   * Creates a Stripe Checkout Session and redirects the user
   */
  app.get("/api/stripe/checkout", async (req: Request, res: Response) => {
    if (!STRIPE_SECRET_KEY) {
      res.status(500).json({ error: "Stripe not configured — contact admin. Add STRIPE_SECRET_KEY as an environment variable." });
      return;
    }

    const planId = (req.query.plan as string) || "pro";
    const plan = PLANS[planId];
    if (!plan) {
      res.status(400).json({ error: `Invalid plan: ${planId}. Valid plans: starter, pro, enterprise` });
      return;
    }

    // Get current user
    const user = await getUserFromRequest(req);
    if (!user) {
      res.redirect(302, "/?error=Please+sign+in+first");
      return;
    }

    try {
      // Get or create Stripe customer
      const customerId = await getOrCreateStripeCustomer(user.id, user.email, user.name);
      const origin = `${req.protocol}://${req.get("host")}`;

      // Create Checkout Session
      const session = await stripeAPI("/checkout/sessions", "POST", {
        mode: "subscription",
        customer: customerId,
        "success_url": `${origin}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        "cancel_url": `${origin}/billing?canceled=true`,
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][product_data][name]": plan.name,
        "line_items[0][price_data][unit_amount]": plan.priceAmount.toString(),
        "line_items[0][price_data][recurring][interval]": "month",
        "line_items[0][quantity]": "1",
        "metadata[user_id]": user.id.toString(),
        "metadata[plan_tier]": plan.tier,
        "subscription_data[metadata][user_id]": user.id.toString(),
        "subscription_data[metadata][plan_tier]": plan.tier,
      });

      res.redirect(303, session.url);
    } catch (err: any) {
      console.error("[Stripe] Checkout error:", err.message);
      res.redirect(302, `/billing?error=${encodeURIComponent(err.message)}`);
    }
  });

  /**
   * GET /api/stripe/portal
   * Redirects to Stripe Customer Portal for subscription management
   */
  app.get("/api/stripe/portal", async (req: Request, res: Response) => {
    if (!STRIPE_SECRET_KEY) {
      res.status(500).json({ error: "Stripe not configured — contact admin." });
      return;
    }

    const user = await getUserFromRequest(req);
    if (!user) {
      res.redirect(302, "/?error=Please+sign+in+first");
      return;
    }

    try {
      const customerId = await getOrCreateStripeCustomer(user.id, user.email, user.name);
      const origin = `${req.protocol}://${req.get("host")}`;

      const portalSession = await stripeAPI("/billing_portal/sessions", "POST", {
        customer: customerId,
        return_url: `${origin}/billing`,
      });

      res.redirect(303, portalSession.url);
    } catch (err: any) {
      console.error("[Stripe] Portal error:", err.message);
      res.redirect(302, `/billing?error=${encodeURIComponent(err.message)}`);
    }
  });

  /**
   * POST /api/stripe/webhook
   * Handles Stripe webhook events
   */
  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    // Note: In production, verify the webhook signature using STRIPE_WEBHOOK_SECRET
    // For now, we process the event directly (signature verification requires raw body)
    const event = req.body;

    if (!event || !event.type) {
      res.status(400).json({ error: "Invalid event" });
      return;
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    const db = await getDb();
    if (!db) {
      res.status(500).json({ error: "Database unavailable" });
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const userId = parseInt(session.metadata?.user_id || "0");
          const planTier = session.metadata?.plan_tier || "pro";

          if (userId) {
            // Update user's plan and subscription status
            await db.update(users).set({
              planTier,
              subscriptionStatus: "active",
              stripeCustomerId: session.customer,
            }).where(eq(users.id, userId));

            // Record the invoice
            await db.insert(invoices).values({
              userId,
              stripeInvoiceId: session.invoice || session.id,
              amount: session.amount_total || PLANS[planTier]?.priceAmount || 0,
              currency: "usd",
              status: "paid",
              description: `Subscription: ${PLANS[planTier]?.name || planTier}`,
            });

            console.log(`[Stripe] User ${userId} subscribed to ${planTier}`);
          }
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object;
          const userId = parseInt(subscription.metadata?.user_id || "0");
          const planTier = subscription.metadata?.plan_tier;

          if (userId) {
            const status = subscription.status === "active" ? "active"
              : subscription.status === "past_due" ? "past_due"
              : subscription.status === "canceled" ? "canceled"
              : subscription.status;

            const updateData: any = { subscriptionStatus: status };
            if (planTier) updateData.planTier = planTier;

            await db.update(users).set(updateData).where(eq(users.id, userId));
            console.log(`[Stripe] User ${userId} subscription updated: ${status}`);
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          const userId = parseInt(subscription.metadata?.user_id || "0");

          if (userId) {
            await db.update(users).set({
              subscriptionStatus: "canceled",
              planTier: "free",
            }).where(eq(users.id, userId));
            console.log(`[Stripe] User ${userId} subscription canceled`);
          }
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object;
          const customerId = invoice.customer;

          // Find user by Stripe customer ID
          const [user] = await db.select().from(users)
            .where(eq(users.stripeCustomerId, customerId))
            .limit(1);

          if (user) {
            await db.update(users).set({ subscriptionStatus: "past_due" }).where(eq(users.id, user.id));

            // Record the failed invoice
            await db.insert(invoices).values({
              userId: user.id,
              stripeInvoiceId: invoice.id,
              amount: invoice.amount_due || 0,
              currency: invoice.currency || "usd",
              status: "failed",
              description: "Payment failed",
            });

            console.log(`[Stripe] Payment failed for user ${user.id}`);
          }
          break;
        }

        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error("[Stripe Webhook] Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });
}
