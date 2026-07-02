import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStripeRoutes } from "../stripe-routes";
import { registerCronRoutes } from "../scheduling-engine";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { startCronScheduler } from "../cron-router";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

// Cache-bust: build 2026-07-02-00-08
const BUILD_TAG = "cf-2026-07-02-00-08";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

// Boot diagnostic — print actual secret for debugging
import { ENV as BOOT_ENV } from "./env";
console.log(`[BOOT] ENV.cookieSecret length: ${BOOT_ENV.cookieSecret.length}, prefix: "${BOOT_ENV.cookieSecret.substring(0, 10)}..."`);
console.log(`[BOOT] DATABASE_URL set: ${BOOT_ENV.databaseUrl ? "yes" : "no"}`);
console.log(`[BOOT] OPENAI_API_KEY set: ${BOOT_ENV.openAiKey ? "yes" : "no"}`);

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Aggressive no-cache for everything to ensure users always see the latest build
  app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    res.setHeader("X-Build-Tag", BUILD_TAG);
    next();
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerStripeRoutes(app);
  registerCronRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Start the cron scheduler (runs every 30s, executes due user-defined jobs)
  startCronScheduler();

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
