/**
 * stripe:poll — Local dev replacement for `stripe listen`
 *
 * Polls Stripe every 5 seconds for completed checkout sessions and
 * updates local subscription records from "incomplete" to "active".
 *
 * Usage:
 *   pnpm stripe:poll
 *
 * Keep this running in a separate terminal alongside `pnpm dev`.
 * Only needed for local development — production uses real webhooks.
 */

import * as path from "node:path";
import * as dotenv from "dotenv";
import Stripe from "stripe";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import pg from "pg";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const stripeKey = process.env.STRIPE_SECRET_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!stripeKey) {
  console.error("❌ STRIPE_SECRET_KEY not set in .env");
  process.exit(1);
}

if (!databaseUrl) {
  console.error("❌ DATABASE_URL not set in .env");
  process.exit(1);
}

const stripe = new Stripe(stripeKey);
const pool = new pg.Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

const POLL_INTERVAL = 5000;
const seen = new Set<string>();

async function poll() {
  try {
    const sessions = await stripe.checkout.sessions.list({ limit: 10 });

    for (const session of sessions.data) {
      if (seen.has(session.id)) continue;
      if (session.payment_status !== "paid") continue;
      seen.add(session.id);

      const subId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;
      if (!subId) continue;

      const sub = await stripe.subscriptions.retrieve(subId);

      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;
      if (!customerId) continue;

      const raw = JSON.parse(JSON.stringify(sub));
      const now = new Date();
      const periodStart = raw.current_period_start
        ? new Date(raw.current_period_start * 1000)
        : now;
      const periodEnd = raw.current_period_end
        ? new Date(raw.current_period_end * 1000)
        : new Date(now.getTime() + 30 * 86400000);

      const user = await db.user.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (!user) {
        console.log(`⚠️  No user found for customer ${customerId}, skipping.`);
        continue;
      }

      const updated = await db.subscription.updateMany({
        where: {
          status: "incomplete",
          referenceId: user.id,
        },
        data: {
          status: sub.status === "trialing" ? "trialing" : "active",
          stripeSubscriptionId: sub.id,
          stripeCustomerId: customerId,
          periodStart,
          periodEnd,
        },
      });

      if (updated.count > 0) {
        console.log(
          `✅ [${now.toLocaleTimeString()}] Activated ${updated.count} sub(s) → ${sub.status} (${sub.id})`,
        );
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`⚠️  Poll error: ${message}`);
  }
}

console.log("🔄 Polling Stripe for completed checkouts every 5s...");
console.log("   (Press Ctrl+C to stop)\n");

poll();
setInterval(poll, POLL_INTERVAL);
