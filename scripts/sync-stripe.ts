/**
 * stripe:sync - Push plans from lib/plans.ts -> Stripe, then generate
 * lib/stripe-plans.generated.ts
 *
 * Usage:
 *   bun stripe:sync
 *
 * Workflow:
 *   1. Edit lib/plans.ts - change names, prices, features, limits.
 *   2. Run `bun stripe:sync`.
 *   3. Restart the dev server. Done.
 *
 * The script will:
 *   - Create a Stripe Product + Monthly/Annual Price for each plan
 *   - Auto-generate lib/stripe-plans.generated.ts with real price IDs
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";
import Stripe from "stripe";
import { plans } from "../lib/plans";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error("❌ STRIPE_SECRET_KEY not found in .env");
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);

async function sync() {
  console.log("🚀 Syncing plans from lib/plans.ts -> Stripe...\n");

  const results: Record<string, { monthly: string; yearly: string }> = {};

  for (const plan of plans) {
    console.log(`📦 Plan: ${plan.name}`);

    // Stripe product name = plan display name (e.g. "Pro")
    // Prepend your app name here if you like: `My App ${plan.name}`
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
    });

    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.monthlyPrice * 100,
      currency: "usd",
      recurring: { interval: "month" },
      nickname: `${plan.key}_monthly`,
    });

    const yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.annualPrice * 100,
      currency: "usd",
      recurring: { interval: "year" },
      nickname: `${plan.key}_yearly`,
    });

    results[plan.key] = {
      monthly: monthlyPrice.id,
      yearly: yearlyPrice.id,
    };

    console.log(`   ✅ Product: ${product.id}`);
    console.log(`   ✅ Monthly: ${monthlyPrice.id}`);
    console.log(`   ✅ Yearly:  ${yearlyPrice.id}\n`);
  }

  // ── Build generated file contents ─────────────────────────────────────────
  const plansCode = plans
    .map((plan) => {
      const ids = results[plan.key];
      const limitsEntries = plan.limits
        ? Object.entries(plan.limits)
            .map(([k, v]) => `                  ${k}: ${v},`)
            .join("\n")
        : "";

      return `  {
    name: "${plan.key}",
    priceId: "${ids.monthly}",
    annualDiscountPriceId: "${ids.yearly}",${
      plan.limits
        ? `
    limits: {
${limitsEntries.replaceAll("                  ", "      ")}
    },`
        : ""
    }${
      plan.trialDays
        ? `
    freeTrial: {
      days: ${plan.trialDays},
    },`
        : ""
    }
  }`;
    })
    .join(",\n");

  const generatedPath = path.join(
    process.cwd(),
    "lib",
    "stripe-plans.generated.ts",
  );
  const generatedFile = `/**
 * Auto-generated Stripe plan IDs used by Better Auth Stripe plugin.
 *
 * Source of truth for plan display/prices is \`lib/plans.ts\`.
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

export const stripePlans: StripeAuthPlan[] = [
${plansCode},
];
`;

  fs.writeFileSync(generatedPath, generatedFile);
  console.log(
    "✅ lib/stripe-plans.generated.ts updated with real Stripe Price IDs.",
  );

  console.log(
    "\n✨ Done! Restart your dev server to pick up the new generated Stripe plan IDs.",
  );
}

sync().catch((err) => {
  console.error("❌ Sync failed:", err);
  process.exit(1);
});
