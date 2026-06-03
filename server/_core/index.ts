import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import Stripe from "stripe";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startPublishingWorker } from "../services/publishingWorker";
import {
  getSubscriptionByStripeCustomerId,
  getSubscriptionByStripeSubId,
  getUserById,
  updateSubscriptionByStripeSubId,
  upsertSubscription,
} from "../db";
import { sendBillingReceiptEmail, sendPaymentFailedEmail } from "../services/email";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

function getPlanFromPriceId(priceId: string): "starter" | "pro" | "agency" | "free" {
  if (priceId === process.env.STRIPE_PRICE_ID_STARTER) return "starter";
  if (priceId === process.env.STRIPE_PRICE_ID_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_ID_AGENCY) return "agency";
  return "free";
}

async function registerStripeWebhook(app: express.Express): Promise<void> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!webhookSecret || !stripeKey) {
    console.warn("[Stripe] Webhook not registered — STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not set");
    return;
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2026-05-27.dahlia" });

  // Raw body needed for Stripe signature verification
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"];
      if (!sig) {
        res.status(400).send("Missing stripe-signature header");
        return;
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
      } catch (err) {
        console.error("[Stripe] Webhook signature verification failed:", err);
        res.status(400).send("Webhook signature verification failed");
        return;
      }

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = parseInt(session.metadata?.userId ?? "0");
            const plan = (session.metadata?.plan ?? "free") as "starter" | "pro" | "agency";
            if (userId) {
              await upsertSubscription({
                userId,
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                stripePriceId: process.env[`STRIPE_PRICE_ID_${plan.toUpperCase()}`] ?? "",
                plan,
                status: "active",
              });
            }
            break;
          }

          case "customer.subscription.created":
          case "customer.subscription.updated": {
            const sub = event.data.object as Stripe.Subscription;
            const priceId = sub.items.data[0]?.price.id ?? "";
            const plan = getPlanFromPriceId(priceId);
            const existingSub = await getSubscriptionByStripeSubId(sub.id);
            if (existingSub) {
              await updateSubscriptionByStripeSubId(sub.id, {
                plan,
                status: sub.status as "active" | "trialing" | "past_due" | "canceled" | "unpaid",
                stripePriceId: priceId,
                cancelAtPeriodEnd: sub.cancel_at_period_end,
              });
            } else {
              // New subscription — find user by customer ID
              const existingByCust = await getSubscriptionByStripeCustomerId(sub.customer as string);
              if (existingByCust) {
                await updateSubscriptionByStripeSubId(sub.id, {
                  stripeSubscriptionId: sub.id,
                  plan,
                  status: sub.status as "active" | "trialing" | "past_due" | "canceled" | "unpaid",
                  stripePriceId: priceId,
                });
              }
            }
            break;
          }

          case "customer.subscription.deleted": {
            const sub = event.data.object as Stripe.Subscription;
            await updateSubscriptionByStripeSubId(sub.id, { plan: "free", status: "canceled" });
            break;
          }

          case "invoice.payment_succeeded": {
            const invoice = event.data.object as Stripe.Invoice;
            const custSub = await getSubscriptionByStripeCustomerId(invoice.customer as string);
            if (custSub) {
              const user = await getUserById(custSub.userId);
              if (user?.email) {
                await sendBillingReceiptEmail(
                  user.email,
                  user.name ?? "there",
                  custSub.plan,
                  invoice.amount_paid,
                  invoice.hosted_invoice_url ?? undefined
                );
              }
            }
            break;
          }

          case "invoice.payment_failed": {
            const invoice = event.data.object as Stripe.Invoice;
            const custSub = await getSubscriptionByStripeCustomerId(invoice.customer as string);
            if (custSub) {
              const user = await getUserById(custSub.userId);
              if (user?.email) {
                await sendPaymentFailedEmail(user.email, user.name ?? "there", custSub.plan);
              }
              await updateSubscriptionByStripeSubId(custSub.stripeSubscriptionId ?? "", { status: "past_due" });
            }
            break;
          }

          default:
            console.log(`[Stripe] Unhandled event type: ${event.type}`);
        }
      } catch (err) {
        console.error("[Stripe] Webhook handler error:", err);
      }

      res.json({ received: true });
    }
  );

  console.log("[Stripe] Webhook registered at /api/stripe/webhook");
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Register Stripe webhook BEFORE json body parser (needs raw body)
  await registerStripeWebhook(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Development uses Vite, production uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT ?? "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Start the publishing worker after server is ready
    startPublishingWorker();
  });
}

startServer().catch(console.error);
