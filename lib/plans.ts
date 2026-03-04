/**
 * ─── Plans Config ────────────────────────────────────────────────────────────
 *
 * This is the SINGLE SOURCE OF TRUTH for your subscription plans.
 *
 * Edit this file to change plan names, prices, features, limits, or trial days.
 * Then run:
 *
 *   bun stripe:sync
 *
 * The script will create the products on Stripe and generate
 * lib/stripe-plans.generated.ts with the real Price IDs automatically.
 * No manual copy-pasting needed.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface Plan {
  /** Internal key - must match the plan `name` in generated Stripe auth plans */
  key: string;
  /** Display name shown to users */
  name: string;
  /** Monthly price in USD (whole dollars) */
  monthlyPrice: number;
  /** Annual price in USD (whole dollars) */
  annualPrice: number;
  /** Short description shown on the pricing card */
  description: string;
  /** Feature list shown on the pricing card */
  features: string[];
  /** CTA button text */
  cta: string;
  /** Highlight this card visually (e.g. "Most popular") */
  highlighted?: boolean;
  /** Optional badge shown above the card */
  badge?: string;
  /** Free trial days (applies to this plan only) */
  trialDays?: number;
  /** Resource limits - used by Better Auth Stripe plugin */
  limits?: {
    projects?: number; // -1 = unlimited
    storage?: number; // GB, -1 = unlimited
    members?: number; // -1 = unlimited
  };
}

export const plans: Plan[] = [
  {
    key: "starter",
    name: "Starter",
    monthlyPrice: 10,
    annualPrice: 100,
    description: "For individuals and small side projects.",
    features: [
      "3 projects",
      "5 GB storage",
      "1 team member",
      "Community support",
      "Basic analytics",
    ],
    cta: "Get started",
    highlighted: false,
    limits: {
      projects: 3,
      storage: 5,
      members: 1,
    },
  },
  {
    key: "pro",
    name: "Pro",
    monthlyPrice: 29,
    annualPrice: 290,
    description: "For growing teams that need more power.",
    badge: "Most popular",
    trialDays: 14,
    features: [
      "20 projects",
      "50 GB storage",
      "5 team members",
      "Priority support",
      "Advanced analytics",
      "Custom integrations",
      "14-day free trial",
    ],
    cta: "Start free trial",
    highlighted: true,
    limits: {
      projects: 20,
      storage: 50,
      members: 5,
    },
  },
  {
    key: "enterprise",
    name: "Enterprise",
    monthlyPrice: 99,
    annualPrice: 990,
    description: "For organizations that need unlimited scale.",
    features: [
      "Unlimited projects",
      "Unlimited storage",
      "Unlimited members",
      "Dedicated support",
      "Advanced analytics",
      "SSO & audit logs",
      "Custom contracts",
    ],
    cta: "Contact sales",
    highlighted: false,
    limits: {
      projects: -1,
      storage: -1,
      members: -1,
    },
  },
];
