/**
 * poll-stripe - Local dev replacement for `stripe listen`
 *
 * Polls Stripe every 5 seconds for completed checkout sessions and
 * updates the local database subscription status accordingly.
 *
 * Usage:
 *   bun stripe:poll
 *
 * Keep this running in a separate terminal alongside `bun dev`.
 * Only needed for local development - production uses real webhooks.
 */

import * as path from "node:path";
import * as dotenv from "dotenv";
import Stripe from "stripe";
import { prisma } from "../lib/db";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error("❌ STRIPE_SECRET_KEY not set");
  process.exit(1);
}

const stripe = new Stripe(stripeKey);
const POLL_INTERVAL = 5000;
const seen = new Set<string>();

async function poll() {
  try {
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
    });

    for (const session of sessions.data) {
      if (seen.has(session.id)) continue;
      if (session.payment_status !== "paid") continue;
      seen.add(session.id);

      // Get subscription ID from the session
      const subId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;
      if (!subId) continue;

      // Fetch the full subscription separately
      const sub = await stripe.subscriptions.retrieve(subId);

      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;
      if (!customerId) continue;

      // Safely get period dates from the raw JSON
      const raw = JSON.parse(JSON.stringify(sub));
      const now = new Date();
      const periodStart = raw.current_period_start
        ? new Date(raw.current_period_start * 1000)
        : now;
      const periodEnd = raw.current_period_end
        ? new Date(raw.current_period_end * 1000)
        : new Date(now.getTime() + 30 * 86400000);

      // Look up the user by their Stripe customer ID
      const db = prisma;
      if (!db) {
        console.error("❌ Prisma client not available (DATABASE_URL not set).");
        continue;
      }
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
          `✅ [${now.toLocaleTimeString()}] Activated ${updated.count} sub(s) -> ${sub.status} (${sub.id})`,
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
