import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { z } from "zod";
import {
  getSubscriptionByUserId,
  getUserById,
  updateSubscriptionByStripeSubId,
  upsertSubscription,
} from "../db";
import { sendBillingReceiptEmail, sendPaymentFailedEmail } from "../services/email";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn("[Billing] STRIPE_SECRET_KEY not set");
    return null;
  }
  return new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
}

const PLAN_PRICE_MAP: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_ID_STARTER ?? "",
  pro: process.env.STRIPE_PRICE_ID_PRO ?? "",
  agency: process.env.STRIPE_PRICE_ID_AGENCY ?? "",
};

function getPlanFromPriceId(priceId: string): "starter" | "pro" | "agency" | "free" {
  if (priceId === process.env.STRIPE_PRICE_ID_STARTER) return "starter";
  if (priceId === process.env.STRIPE_PRICE_ID_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_ID_AGENCY) return "agency";
  return "free";
}

export const billingRouter = router({
  // Get current subscription for the user
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const sub = await getSubscriptionByUserId(ctx.user.id);
    return sub ?? { plan: "free" as const, status: "active" as const };
  }),

  // Create a Stripe Checkout session
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        plan: z.enum(["starter", "pro", "agency"]),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      if (!stripe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Billing not configured" });

      const priceId = PLAN_PRICE_MAP[input.plan];
      if (!priceId) throw new TRPCError({ code: "BAD_REQUEST", message: `Price ID for plan "${input.plan}" not configured` });

      const existingSub = await getSubscriptionByUserId(ctx.user.id);
      let customerId = existingSub?.stripeCustomerId ?? undefined;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: ctx.user.email ?? undefined,
          name: ctx.user.name ?? undefined,
          metadata: { userId: String(ctx.user.id) },
        });
        customerId = customer.id;
        await upsertSubscription({
          userId: ctx.user.id,
          stripeCustomerId: customerId,
          plan: "free",
          status: "active",
        });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        metadata: { userId: String(ctx.user.id), plan: input.plan },
      });

      return { sessionId: session.id, url: session.url };
    }),

  // Create a Stripe Customer Portal session
  createPortalSession: protectedProcedure
    .input(z.object({ returnUrl: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      if (!stripe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Billing not configured" });

      const sub = await getSubscriptionByUserId(ctx.user.id);
      if (!sub?.stripeCustomerId) throw new TRPCError({ code: "NOT_FOUND", message: "No billing account found" });

      const session = await stripe.billingPortal.sessions.create({
        customer: sub.stripeCustomerId,
        return_url: input.returnUrl,
      });
      return { url: session.url };
    }),

  // Webhook handler — called by the raw Express route (not tRPC)
  // This procedure is for internal use by the webhook route
  processWebhookEvent: publicProcedure
    .input(z.object({ eventType: z.string(), eventData: z.unknown() }))
    .mutation(async ({ input }) => {
      const event = input.eventData as Stripe.Event;
      try {
        switch (input.eventType) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = parseInt(session.metadata?.userId ?? "0");
            const plan = session.metadata?.plan as "starter" | "pro" | "agency";
            if (!userId || !plan) break;
            await upsertSubscription({
              userId,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              stripePriceId: PLAN_PRICE_MAP[plan],
              plan,
              status: "active",
            });
            break;
          }
          case "customer.subscription.updated": {
            const sub = event.data.object as Stripe.Subscription;
            const priceId = sub.items.data[0]?.price.id ?? "";
            const plan = getPlanFromPriceId(priceId);
            await updateSubscriptionByStripeSubId(sub.id, {
              plan,
              status: sub.status as "active" | "trialing" | "past_due" | "canceled" | "unpaid",
              stripePriceId: priceId,
              currentPeriodStart: sub.items.data[0]?.current_period_start ? new Date(sub.items.data[0].current_period_start * 1000) : undefined,
              currentPeriodEnd: sub.items.data[0]?.current_period_end ? new Date(sub.items.data[0].current_period_end * 1000) : undefined,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            });
            break;
          }
          case "customer.subscription.deleted": {
            const sub = event.data.object as Stripe.Subscription;
            await updateSubscriptionByStripeSubId(sub.id, { plan: "free", status: "canceled" });
            break;
          }
          case "invoice.payment_succeeded": {
            const invoice = event.data.object as Stripe.Invoice;
            if (!invoice.customer_email) break;
            const stripe = getStripe();
            if (!stripe) break;
            const customer = await stripe.customers.retrieve(invoice.customer as string);
            const userId = parseInt((customer as Stripe.Customer).metadata?.userId ?? "0");
            if (!userId) break;
            const user = await getUserById(userId);
            if (!user?.email) break;
            await sendBillingReceiptEmail(
              user.email,
              user.name ?? "there",
              invoice.lines.data[0]?.description ?? "Subscription",
              invoice.amount_paid,
              invoice.hosted_invoice_url ?? undefined
            );
            break;
          }
          case "invoice.payment_failed": {
            const invoice = event.data.object as Stripe.Invoice;
            const stripe = getStripe();
            if (!stripe) break;
            const customer = await stripe.customers.retrieve(invoice.customer as string);
            const userId = parseInt((customer as Stripe.Customer).metadata?.userId ?? "0");
            if (!userId) break;
            const user = await getUserById(userId);
            if (!user?.email) break;
            const sub = await getSubscriptionByUserId(userId);
            await sendPaymentFailedEmail(user.email, user.name ?? "there", sub?.plan ?? "your");
            break;
          }
        }
      } catch (err) {
        console.error("[Billing] Webhook processing error:", err);
      }
      return { received: true };
    }),
});
