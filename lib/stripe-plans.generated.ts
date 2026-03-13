/**
 * Auto-generated Stripe plan IDs used by the Better Auth Stripe plugin.
 *
 * Source of truth for plan names, pricing, and limits is `lib/plans.ts`.
 * Regenerate this file with:
 *
 *   pnpm stripe:sync
 */
export interface StripeAuthPlan {
  name: string;
  priceId: string;
  annualDiscountPriceId?: string;
  limits?: {
    projects?: number;
    storage?: number;
  };
  freeTrial?: {
    days: number;
  };
}

export const stripePlans: StripeAuthPlan[] = [
  {
    name: "pro",
    priceId: "price_1T86NAECNK57chOdEX5Icihw",
    annualDiscountPriceId: "price_1T86NAECNK57chOdxWhVmaTM",
    limits: {
      projects: 20,
      storage: 50,
    },
    freeTrial: {
      days: 14,
    },
  },
  {
    name: "team",
    priceId: "price_1T86NBECNK57chOd5AUVA7ny",
    annualDiscountPriceId: "price_1T86NBECNK57chOdxK81Ud32",
    limits: {
      projects: 100,
      storage: 500,
    },
  },
];
