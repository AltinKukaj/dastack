/**
 * Auto-generated Stripe plan IDs used by Better Auth Stripe plugin.
 *
 * Source of truth for plan display/prices is `lib/plans.ts`.
 * Regenerate this file with:
 *
 *   bun stripe:sync
 */
export interface StripeAuthPlan {
  name: string;
  priceId: string;
  annualDiscountPriceId: string;
  limits?: {
    projects?: number;
    storage?: number;
    members?: number;
  };
  freeTrial?: {
    days: number;
  };
}

/**
 * Template defaults only.
 * These `price_...` IDs are account-specific and should be replaced by running
 * `bun stripe:sync` after connecting your own Stripe account.
 */
export const stripePlans: StripeAuthPlan[] = [
  {
    name: "starter",
    priceId: "price_1T73i4ECNK57chOdvrgwXXjm",
    annualDiscountPriceId: "price_1T73i4ECNK57chOd7R4Ecboq",
    limits: {
      projects: 3,
      storage: 5,
      members: 1,
    },
  },
  {
    name: "pro",
    priceId: "price_1T73i5ECNK57chOdYAP2ZRlw",
    annualDiscountPriceId: "price_1T73i5ECNK57chOdKIR8Hngi",
    limits: {
      projects: 20,
      storage: 50,
      members: 5,
    },
    freeTrial: {
      days: 14,
    },
  },
  {
    name: "enterprise",
    priceId: "price_1T73i6ECNK57chOd4vfrfqbB",
    annualDiscountPriceId: "price_1T73i6ECNK57chOdIyYC4uJA",
    limits: {
      projects: -1,
      storage: -1,
      members: -1,
    },
  },
];
