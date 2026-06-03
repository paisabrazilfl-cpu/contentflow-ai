import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Shared test helpers ──────────────────────────────────────────────────────
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
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Auth logout ──────────────────────────────────────────────────────────────
describe("auth.logout", () => {
  it("clears the session cookie and returns success", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect((ctx.res.clearCookie as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      COOKIE_NAME,
      expect.objectContaining({ maxAge: -1 })
    );
  });
});

// ─── Auth me ──────────────────────────────────────────────────────────────────
describe("auth.me", () => {
  it("returns the current user when authenticated", async () => {
    const user = makeUser({ name: "Alice" });
    const ctx = makeCtx(user);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result?.name).toBe("Alice");
  });

  it("returns null when not authenticated", async () => {
    const ctx = makeCtx(null);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

// ─── Rate limiting logic ──────────────────────────────────────────────────────
describe("Rate limit thresholds", () => {
  it("Starter plan allows 50 generations/month", async () => {
    const { getGenerationLimit, isUnlimited } = await import("../shared/plans");
    expect(getGenerationLimit("starter")).toBe(50);
    expect(isUnlimited("starter")).toBe(false);
  });

  it("Pro plan allows 200 generations/month", async () => {
    const { getGenerationLimit, isUnlimited } = await import("../shared/plans");
    expect(getGenerationLimit("pro")).toBe(200);
    expect(isUnlimited("pro")).toBe(false);
  });

  it("Agency plan is unlimited", async () => {
    const { isUnlimited } = await import("../shared/plans");
    expect(isUnlimited("agency")).toBe(true);
  });

  it("Free plan allows 5 generations/month", async () => {
    const { getGenerationLimit } = await import("../shared/plans");
    expect(getGenerationLimit("free")).toBe(5);
  });
});

// ─── Plan pricing ─────────────────────────────────────────────────────────────
describe("Plan pricing", () => {
  it("Starter costs $97/month", async () => {
    const { PLANS } = await import("../shared/plans");
    expect(PLANS.starter.price).toBe(97);
  });

  it("Pro costs $197/month", async () => {
    const { PLANS } = await import("../shared/plans");
    expect(PLANS.pro.price).toBe(197);
  });

  it("Agency costs $497/month", async () => {
    const { PLANS } = await import("../shared/plans");
    expect(PLANS.agency.price).toBe(497);
  });
});

// ─── OAuth platform list ──────────────────────────────────────────────────────
describe("oauth.list", () => {
  it("requires authentication", async () => {
    const ctx = makeCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.oauth.list()).rejects.toThrow();
  });
});

// ─── Billing subscription ─────────────────────────────────────────────────────
describe("billing.getSubscription", () => {
  it("requires authentication", async () => {
    const ctx = makeCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.billing.getSubscription()).rejects.toThrow();
  });
});

// ─── Content getUsage ─────────────────────────────────────────────────────────
describe("content.getUsage", () => {
  it("requires authentication", async () => {
    const ctx = makeCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.content.getUsage()).rejects.toThrow();
  });
});
