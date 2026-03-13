import "server-only";

/**
 * Billing service module.
 *
 * Exposes billing capabilities (which providers are configured) and
 * user subscription summaries. This is a read-only service — write
 * operations happen through provider webhooks or checkout flows.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import {
  getFeatureFlags,
  getStripeBillingReadiness,
  type StripeBillingReadiness,
} from "@/lib/features";

/** Describes which billing providers are available in this deployment. */
export interface BillingCapabilities {
  enabled: boolean;
  providers: {
    stripe: boolean;
  };
  defaultProvider: "stripe" | null;
  readiness: StripeBillingReadiness;
}

/**
 * Return the current billing capabilities based on configured env vars.
 */
export function getBillingCapabilities(): BillingCapabilities {
  const features = getFeatureFlags();
  const readiness = getStripeBillingReadiness();
  const defaultProvider = features.stripe ? "stripe" : null;

  return {
    enabled: features.stripe,
    providers: {
      stripe: features.stripe,
    },
    defaultProvider,
    readiness,
  };
}

/** Serialised subscription summary returned to the client. */
export interface BillingSubscriptionSummary {
  id: string;
  plan: string;
  status: string;
  provider: "stripe" | null;
  stripeSubscriptionId: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  referenceId: string;
}

/**
 * Get all subscriptions for a user, sorted by status then recency.
 */
export async function getUserSubscriptions(
  db: PrismaClient,
  userId: string,
): Promise<BillingSubscriptionSummary[]> {
  const capabilities = getBillingCapabilities();
  const subscriptions = await db.subscription.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      plan: true,
      status: true,
      periodStart: true,
      periodEnd: true,
      cancelAtPeriodEnd: true,
      referenceId: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });

  return subscriptions.map((subscription) => ({
    id: subscription.id,
    plan: subscription.plan,
    status: subscription.status ?? "incomplete",
    provider:
      subscription.stripeSubscriptionId || subscription.stripeCustomerId
        ? "stripe"
        : capabilities.defaultProvider,
    stripeSubscriptionId: subscription.stripeSubscriptionId ?? null,
    periodStart: subscription.periodStart?.toISOString() ?? null,
    periodEnd: subscription.periodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? false,
    referenceId: subscription.referenceId,
  }));
}
