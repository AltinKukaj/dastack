/**
 * stripe:sync - Push plans from lib/plans.ts to Stripe, then generate
 * lib/stripe-plans.generated.ts with account-specific price IDs.
 *
 * Usage:
 *   pnpm stripe:sync
 *
 * Workflow:
 *   1. Edit lib/plans.ts - change names, prices, features, limits.
 *   2. Run `pnpm stripe:sync`.
 *   3. Restart the dev server. Done.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";
import Stripe from "stripe";
import { plans } from "../lib/plans";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error("STRIPE_SECRET_KEY not found in .env");
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);

function buildGeneratedPlanBlock(plan: (typeof plans)[number], ids: {
  monthlyPriceId: string;
  annualPriceId?: string;
}) {
  const lines = [
    "  {",
    `    name: "${plan.slug}",`,
    `    priceId: "${ids.monthlyPriceId}",`,
  ];

  if (ids.annualPriceId) {
    lines.push(`    annualDiscountPriceId: "${ids.annualPriceId}",`);
  }

  lines.push("    limits: {");
  lines.push(`      projects: ${plan.limits.projects},`);
  lines.push(`      storage: ${plan.limits.storage},`);
  lines.push("    },");

  if (plan.trialDays) {
    lines.push("    freeTrial: {");
    lines.push(`      days: ${plan.trialDays},`);
    lines.push("    },");
  }

  lines.push("  }");

  return lines.join("\n");
}

async function sync() {
  console.log("Syncing plans from lib/plans.ts -> Stripe...\n");

  const paidPlans = plans.filter((plan) => plan.monthlyPrice > 0);

  if (paidPlans.length === 0) {
    console.log("No paid plans found in lib/plans.ts. Nothing to sync.");
    return;
  }

  const results = new Map<
    string,
    { monthlyPriceId: string; annualPriceId?: string }
  >();

  for (const plan of paidPlans) {
    console.log(
      `Plan: ${plan.name} ($${plan.monthlyPrice}/mo, $${plan.annualPrice}/yr)`,
    );

    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
    });

    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.monthlyPrice * 100,
      currency: "usd",
      recurring: { interval: "month" },
      nickname: `${plan.slug}_monthly`,
    });

    let annualPriceId: string | undefined;

    if (plan.annualPrice > 0) {
      const annualPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.annualPrice * 12 * 100,
        currency: "usd",
        recurring: { interval: "year" },
        nickname: `${plan.slug}_annual`,
      });

      annualPriceId = annualPrice.id;
      console.log(`  Annual price: ${annualPrice.id}`);
    }

    results.set(plan.slug, {
      monthlyPriceId: monthlyPrice.id,
      annualPriceId,
    });

    console.log(`  Product: ${product.id}`);
    console.log(`  Monthly price: ${monthlyPrice.id}\n`);
  }

  const generatedPath = path.join(
    process.cwd(),
    "lib",
    "stripe-plans.generated.ts",
  );

  const generatedPlans = paidPlans
    .map((plan) => buildGeneratedPlanBlock(plan, results.get(plan.slug)!))
    .join(",\n");

  const generatedFile = `/**
 * Auto-generated Stripe plan IDs used by the Better Auth Stripe plugin.
 *
 * Source of truth for plan names, pricing, and limits is \`lib/plans.ts\`.
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
${generatedPlans},
];
`;

  fs.writeFileSync(generatedPath, generatedFile);

  console.log(`Updated ${path.relative(process.cwd(), generatedPath)}.`);
  console.log(
    "Restart the dev server so Better Auth picks up the generated Stripe price IDs.",
  );
}

sync().catch((error) => {
  console.error("Stripe sync failed:", error);
  process.exit(1);
});
