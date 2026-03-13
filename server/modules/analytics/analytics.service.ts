import "server-only";

/**
 * Analytics service module.
 *
 * Aggregates system-wide metrics into a single report used by the
 * admin dashboard. Results are cached for 60 seconds to avoid
 * expensive full-table scans on every request.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { cacheKeys, getCache } from "@/lib/cache";
import { AuditActions } from "@/server/modules/audit/audit.service";

/** A single row in the subscription breakdown table. */
export interface SubscriptionBreakdownItem {
  plan: string;
  status: string;
  count: number;
}

/** Aggregated system report returned to the admin dashboard. */
export interface SystemReport {
  auditEvents24h: number;
  loginFailures24h: number;
  activeSubscriptions: number;
  pendingWebhooks: number;
  deadWebhooks: number;
  assetCount: number;
  subscriptionBreakdown: SubscriptionBreakdownItem[];
}

/**
 * Build a system-wide analytics report.
 *
 * Counts audit events, login failures, subscriptions, webhook
 * statuses, and assets over the last 24 hours. Results are cached
 * for 60 seconds via `cache.remember`.
 */
export async function getSystemReport(
  db: PrismaClient,
): Promise<SystemReport> {
  const cache = await getCache();

  return cache.remember(cacheKeys.systemReport(), 60, async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [
      auditEvents24h,
      loginFailures24h,
      activeSubscriptions,
      pendingWebhooks,
      deadWebhooks,
      assetCount,
      subscriptions,
    ] = await Promise.all([
      db.auditEvent.count({
        where: {
          createdAt: { gte: since },
        },
      }),
      db.auditEvent.count({
        where: {
          action: AuditActions.LOGIN_FAILED,
          createdAt: { gte: since },
        },
      }),
      db.subscription.count({
        where: {
          status: {
            in: ["active", "trialing"],
          },
        },
      }),
      db.webhookEvent.count({
        where: { status: "pending" },
      }),
      db.webhookEvent.count({
        where: { status: "dead" },
      }),
      db.asset.count({
        where: { deletedAt: null },
      }),
      db.subscription.findMany({
        select: {
          plan: true,
          status: true,
        },
      }),
    ]);

    const buckets = new Map<string, SubscriptionBreakdownItem>();

    for (const subscription of subscriptions) {
      const plan = subscription.plan;
      const status = subscription.status ?? "incomplete";
      const bucketKey = `${plan}:${status}`;
      const bucket = buckets.get(bucketKey) ?? { plan, status, count: 0 };
      bucket.count += 1;
      buckets.set(bucketKey, bucket);
    }

    return {
      auditEvents24h,
      loginFailures24h,
      activeSubscriptions,
      pendingWebhooks,
      deadWebhooks,
      assetCount,
      subscriptionBreakdown: Array.from(buckets.values()).sort((a, b) =>
        b.count - a.count,
      ),
    };
  });
}
