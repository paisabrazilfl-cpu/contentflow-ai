import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Helpers ──────────────────────────────────────────────────────────────────
type AuthUser = NonNullable<TrpcContext["user"]>;

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 1,
    openId: "test-user-openid",
    email: "test@contentflow.ai",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function makeCtx(user: AuthUser | null = makeUser()): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
describe("auth.logout", () => {
  it("clears the session cookie and returns success", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(ctx.res.clearCookie as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      COOKIE_NAME,
      expect.objectContaining({ maxAge: -1 })
    );
  });
});

describe("auth.me", () => {
  it("returns the current user when authenticated", async () => {
    const ctx = makeCtx(makeUser({ name: "Alice" }));
    const result = await appRouter.createCaller(ctx).auth.me();
    expect(result?.name).toBe("Alice");
  });

  it("returns null when not authenticated", async () => {
    const result = await appRouter.createCaller(makeCtx(null)).auth.me();
    expect(result).toBeNull();
  });
});

// ─── Plan config correctness ───────────────────────────────────────────────────
describe("Plan limits — single source of truth", () => {
  it("Free: 5 generations, 1 platform, 5 posts, 3-day analytics, no API", async () => {
    const { PLANS } = await import("../shared/plans");
    expect(PLANS.free.generationsPerMonth).toBe(5);
    expect(PLANS.free.platformConnections).toBe(1);
    expect(PLANS.free.scheduledPostsPerMonth).toBe(5);
    expect(PLANS.free.analyticsLookbackDays).toBe(3);
    expect(PLANS.free.apiAccess).toBe(false);
    expect(PLANS.free.teamMembers).toBe(1);
  });

  it("Starter: 50 generations, 3 platforms, 30 posts, 7-day analytics, no API", async () => {
    const { PLANS } = await import("../shared/plans");
    expect(PLANS.starter.generationsPerMonth).toBe(50);
    expect(PLANS.starter.platformConnections).toBe(3);
    expect(PLANS.starter.scheduledPostsPerMonth).toBe(30);
    expect(PLANS.starter.analyticsLookbackDays).toBe(7);
    expect(PLANS.starter.apiAccess).toBe(false);
    expect(PLANS.starter.teamMembers).toBe(1);
    expect(PLANS.starter.price).toBe(97);
  });

  it("Pro: 200 generations, 6 platforms, 150 posts, 90-day analytics, no API", async () => {
    const { PLANS } = await import("../shared/plans");
    expect(PLANS.pro.generationsPerMonth).toBe(200);
    expect(PLANS.pro.platformConnections).toBe(6);
    expect(PLANS.pro.scheduledPostsPerMonth).toBe(150);
    expect(PLANS.pro.analyticsLookbackDays).toBe(90);
    expect(PLANS.pro.apiAccess).toBe(false);
    expect(PLANS.pro.teamMembers).toBe(3);
    expect(PLANS.pro.price).toBe(197);
  });

  it("Agency: unlimited everything, API access, white-label", async () => {
    const { PLANS, isUnlimited } = await import("../shared/plans");
    expect(isUnlimited("agency")).toBe(true);
    expect(PLANS.agency.platformConnections).toBe(Infinity);
    expect(PLANS.agency.scheduledPostsPerMonth).toBe(Infinity);
    expect(PLANS.agency.teamMembers).toBe(Infinity);
    expect(PLANS.agency.analyticsLookbackDays).toBe(Infinity);
    expect(PLANS.agency.apiAccess).toBe(true);
    expect(PLANS.agency.whiteLabelEnabled).toBe(true);
    expect(PLANS.agency.price).toBe(497);
  });
});

// ─── Tier helper functions ────────────────────────────────────────────────────
describe("Tier helper functions", () => {
  it("formatLimit returns 'Unlimited' for Infinity", async () => {
    const { formatLimit } = await import("../shared/plans");
    expect(formatLimit(Infinity)).toBe("Unlimited");
    expect(formatLimit(50)).toBe("50");
  });

  it("overLimitMessage includes plan name and counts", async () => {
    const { overLimitMessage } = await import("../shared/plans");
    const msg = overLimitMessage("AI generations", 50, 50, "starter");
    expect(msg).toContain("50/50");
    expect(msg).toContain("Starter");
    expect(msg).toContain("Upgrade");
  });

  it("hasApiAccess returns false for free/starter/pro, true for agency", async () => {
    const { hasApiAccess } = await import("../shared/plans");
    expect(hasApiAccess("free")).toBe(false);
    expect(hasApiAccess("starter")).toBe(false);
    expect(hasApiAccess("pro")).toBe(false);
    expect(hasApiAccess("agency")).toBe(true);
  });

  it("canExportAnalytics returns false for free/starter, true for pro/agency", async () => {
    const { canExportAnalytics } = await import("../shared/plans");
    expect(canExportAnalytics("free")).toBe(false);
    expect(canExportAnalytics("starter")).toBe(false);
    expect(canExportAnalytics("pro")).toBe(true);
    expect(canExportAnalytics("agency")).toBe(true);
  });
});

// ─── Protected procedure guards ───────────────────────────────────────────────
describe("Protected procedure guards", () => {
  const unauthCtx = makeCtx(null);

  it("oauth.list requires auth", async () => {
    await expect(appRouter.createCaller(unauthCtx).oauth.list()).rejects.toThrow();
  });

  it("billing.getSubscription requires auth", async () => {
    await expect(appRouter.createCaller(unauthCtx).billing.getSubscription()).rejects.toThrow();
  });

  it("content.getUsage requires auth", async () => {
    await expect(appRouter.createCaller(unauthCtx).content.getUsage()).rejects.toThrow();
  });

  it("content.getTierSummary requires auth", async () => {
    await expect(appRouter.createCaller(unauthCtx).content.getTierSummary()).rejects.toThrow();
  });

  it("analytics.getTierSummary requires auth", async () => {
    await expect(appRouter.createCaller(unauthCtx).analytics.getTierSummary()).rejects.toThrow();
  });

  it("settings.getBrandVoice requires auth", async () => {
    await expect(appRouter.createCaller(unauthCtx).settings.getBrandVoice()).rejects.toThrow();
  });
});
