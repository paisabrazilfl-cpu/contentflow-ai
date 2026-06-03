/**
 * Stripe Routes — Checkout session creation and customer portal
 * 
 * These endpoints handle:
 * - /api/stripe/checkout — Creates a Stripe Checkout session for plan upgrades
 * - /api/stripe/portal — Redirects to Stripe Customer Portal for billing management
 * 
 * Requires STRIPE_SECRET_KEY environment variable.
 */

import type { Express, Request, Response } from "express";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";

// Plan price mapping (in cents)
const PLAN_PRICES: Record<string, { amount: number; name: string }> = {
  starter: { amount: 9700, name: "ContentFlow Starter" },
  pro: { amount: 19700, name: "ContentFlow Pro" },
  enterprise: { amount: 49700, name: "ContentFlow Enterprise" },
};

async function stripeRequest(endpoint: string, body: Record<string, any>) {
  const res = await fetch(`https://api.stripe.com/v1${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(flattenObject(body)).toString(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `Stripe API error: ${res.status}`);
  }
  return data;
}

// Flatten nested objects for URL-encoded Stripe API
function flattenObject(obj: Record<string, any>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, fullKey));
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === "object") {
          Object.assign(result, flattenObject(item, `${fullKey}[${i}]`));
        } else {
          result[`${fullKey}[${i}]`] = String(item);
        }
      });
    } else if (value !== undefined && value !== null) {
      result[fullKey] = String(value);
    }
  }
  return result;
}

export function registerStripeRoutes(app: Express) {
  // Create Checkout Session
  app.get("/api/stripe/checkout", async (req: Request, res: Response) => {
    const plan = (req.query.plan as string) || "pro";
    const planConfig = PLAN_PRICES[plan];

    if (!STRIPE_SECRET_KEY) {
      res.status(500).json({ error: "Stripe is not configured. Add STRIPE_SECRET_KEY in Settings." });
      return;
    }

    if (!planConfig) {
      res.status(400).json({ error: `Invalid plan: ${plan}` });
      return;
    }

    try {
      const origin = `${req.protocol}://${req.get("host")}`;
      const session = await stripeRequest("/checkout/sessions", {
        mode: "subscription",
        success_url: `${origin}/billing?success=true`,
        cancel_url: `${origin}/billing?canceled=true`,
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][product_data][name]": planConfig.name,
        "line_items[0][price_data][unit_amount]": planConfig.amount.toString(),
        "line_items[0][price_data][recurring][interval]": "month",
        "line_items[0][quantity]": "1",
      });

      res.redirect(303, session.url);
    } catch (err: any) {
      console.error("[Stripe] Checkout error:", err.message);
      res.redirect(302, `/billing?error=${encodeURIComponent(err.message)}`);
    }
  });

  // Customer Portal
  app.get("/api/stripe/portal", async (req: Request, res: Response) => {
    if (!STRIPE_SECRET_KEY) {
      res.status(500).json({ error: "Stripe is not configured. Add STRIPE_SECRET_KEY in Settings." });
      return;
    }

    try {
      // In production, you'd look up the customer ID from the user's record
      // For now, redirect to billing page with a message
      const origin = `${req.protocol}://${req.get("host")}`;
      res.redirect(302, `/billing?info=Configure+STRIPE_SECRET_KEY+to+enable+customer+portal`);
    } catch (err: any) {
      console.error("[Stripe] Portal error:", err.message);
      res.redirect(302, `/billing?error=${encodeURIComponent(err.message)}`);
    }
  });
}
