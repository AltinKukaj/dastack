import {
  stripePlans as generatedStripePlans,
  type StripeAuthPlan,
} from "@/lib/stripe-plans.generated";

// ---------------------------------------------------------------------------
// Plan & billing configuration
//
// This is the single source of truth for plan metadata, pricing UI, and
// entitlement limits. Account-specific Stripe price IDs are generated into
// `lib/stripe-plans.generated.ts` by `pnpm stripe:sync`.
// ---------------------------------------------------------------------------

export type Plan = {
  name: string;
  slug: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
  badge?: string;
  limits: { projects: number; storage: number };
  trialDays?: number;
};

function isStripePriceIdConfigured(priceId?: string): priceId is string {
  return typeof priceId === "string" && /^price_[A-Za-z0-9]+$/.test(priceId);
}

function isStripePlanConfigured(
  generatedPlan: StripeAuthPlan | undefined,
  plan: Plan,
): generatedPlan is StripeAuthPlan {
  if (!generatedPlan || !isStripePriceIdConfigured(generatedPlan.priceId)) {
    return false;
  }

  if (
    plan.annualPrice > 0 &&
    !isStripePriceIdConfigured(generatedPlan.annualDiscountPriceId)
  ) {
    return false;
  }

  return true;
}

export const plans: Plan[] = [
  {
    name: "Free",
    slug: "free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "For side projects and experiments.",
    features: [
      "1 project",
      "1 GB storage",
      "Community support",
      "Basic analytics",
    ],
    cta: "Get started",
    highlighted: false,
    limits: { projects: 1, storage: 1 },
  },
  {
    name: "Pro",
    slug: "pro",
    monthlyPrice: 12,
    annualPrice: 10,
    description: "For developers shipping real products.",
    features: [
      "20 projects",
      "50 GB storage",
      "Priority support",
      "Advanced analytics",
      "Custom domains",
      "14-day free trial",
    ],
    cta: "Start free trial",
    highlighted: true,
    badge: "Most popular",
    limits: { projects: 20, storage: 50 },
    trialDays: 14,
  },
  {
    name: "Team",
    slug: "team",
    monthlyPrice: 49,
    annualPrice: 40,
    description: "For teams building at scale.",
    features: [
      "100 projects",
      "500 GB storage",
      "Dedicated support",
      "Full analytics suite",
      "Custom domains",
      "Team management",
      "SSO & audit logs",
    ],
    cta: "Contact us",
    highlighted: false,
    limits: { projects: 100, storage: 500 },
  },
];

function getPaidPlans() {
  return plans.filter((plan) => plan.monthlyPrice > 0);
}

function getGeneratedStripePlan(slug: string) {
  return generatedStripePlans.find((plan) => plan.name === slug);
}

export function getPlanBySlug(slug: string): Plan | undefined {
  return plans.find((plan) => plan.slug === slug);
}

export function hasConfiguredStripePlans() {
  return getPaidPlans().every((plan) =>
    isStripePlanConfigured(getGeneratedStripePlan(plan.slug), plan),
  );
}

export function getStripePlans() {
  return getPaidPlans().flatMap((plan) => {
    const generatedPlan = getGeneratedStripePlan(plan.slug);

    if (!isStripePlanConfigured(generatedPlan, plan)) {
      return [];
    }

    return [
      {
        name: plan.slug,
        priceId: generatedPlan.priceId,
        annualDiscountPriceId: generatedPlan.annualDiscountPriceId,
        limits: plan.limits,
        ...(plan.trialDays ? { freeTrial: { days: plan.trialDays } } : {}),
      },
    ];
  });
}
