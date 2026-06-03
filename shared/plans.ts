// Subscription plan definitions — single source of truth
export const PLANS = {
  free: {
    name: "Free",
    generationsPerMonth: 5,
    price: 0,
    platforms: 1,
  },
  starter: {
    name: "Starter",
    generationsPerMonth: 50,
    price: 97,
    platforms: 3,
  },
  pro: {
    name: "Pro",
    generationsPerMonth: 200,
    price: 197,
    platforms: 6,
  },
  agency: {
    name: "Agency",
    generationsPerMonth: Infinity,
    price: 497,
    platforms: Infinity,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getGenerationLimit(plan: PlanKey): number {
  return PLANS[plan].generationsPerMonth;
}

export function isUnlimited(plan: PlanKey): boolean {
  return PLANS[plan].generationsPerMonth === Infinity;
}
