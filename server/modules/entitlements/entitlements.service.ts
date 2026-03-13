import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { cacheKeys, getCache } from "@/lib/cache";
import { invalidateSubjectCaches } from "@/server/modules/cache/cache-invalidation.service";
import { plans } from "@/lib/plans";

export interface EntitlementSnapshot {
  subjectId: string;
  subjectType: "user" | "organization";
  features: Record<string, boolean>;
  limits: Record<string, { limit: number; used: number; remaining: number }>;
  plan: string;
}

function entitlementCacheKey(
  subjectId: string,
  subjectType: "user" | "organization",
): string {
  return subjectType === "organization"
    ? cacheKeys.orgEntitlements(subjectId)
    : cacheKeys.userEntitlements(subjectId);
}

/**
 * Determine the active plan for a user based on their subscription.
 */
export async function getUserPlan(
  db: PrismaClient,
  userId: string,
): Promise<string> {
  const subscription = await db.subscription.findFirst({
    where: { userId, status: "active" },
    orderBy: { createdAt: "desc" },
  });
  return subscription?.plan ?? "free";
}

/**
 * Resolve the full entitlement snapshot for a subject.
 */
async function buildEntitlements(
  db: PrismaClient,
  subjectId: string,
  subjectType: "user" | "organization" = "user",
): Promise<EntitlementSnapshot> {
  const planSlug =
    subjectType === "user"
      ? await getUserPlan(db, subjectId)
      : "free";

  const plan = plans.find((p) => p.slug === planSlug) ?? plans[0]!;

  // Get stored entitlement overrides
  const storedEntitlements = await db.entitlement.findMany({
    where: { subjectId },
  });

  const features: Record<string, boolean> = {};
  const limits: Record<string, { limit: number; used: number; remaining: number }> = {};

  // Derive from plan limits
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

  for (const [key, value] of Object.entries(plan.limits)) {
    if (typeof value === "number") {
      const usage = await db.usageRecord.findFirst({
        where: { subjectId, meterKey: key, periodStart },
      });
      const used = usage?.quantity ?? 0;
      const isUnlimited = value === -1;
      limits[key] = {
        limit: value,
        used,
        remaining: isUnlimited ? Infinity : Math.max(0, value - used),
      };
      features[key] = isUnlimited || used < value;
    }
  }

  // Apply stored overrides
  for (const ent of storedEntitlements) {
    features[ent.featureKey] = ent.value;
  }

  return { subjectId, subjectType, features, limits, plan: plan.slug };
}

export async function getEntitlements(
  db: PrismaClient,
  subjectId: string,
  subjectType: "user" | "organization" = "user",
): Promise<EntitlementSnapshot> {
  const cache = await getCache();

  return cache.remember(
    entitlementCacheKey(subjectId, subjectType),
    90,
    () => buildEntitlements(db, subjectId, subjectType),
  );
}

export async function invalidateEntitlementCache(
  subjectId: string,
  subjectType: "user" | "organization" = "user",
) {
  const cache = await getCache();
  await cache.del(entitlementCacheKey(subjectId, subjectType));
}

/**
 * Check if a subject has a specific feature.
 */
export async function hasFeature(
  db: PrismaClient,
  subjectId: string,
  featureKey: string,
): Promise<boolean> {
  const snapshot = await getEntitlements(db, subjectId);
  return snapshot.features[featureKey] ?? false;
}

/**
 * Get remaining usage for a specific meter.
 */
export async function getRemainingUsage(
  db: PrismaClient,
  subjectId: string,
  meterKey: string,
): Promise<number> {
  const snapshot = await getEntitlements(db, subjectId);
  return snapshot.limits[meterKey]?.remaining ?? 0;
}

/**
 * Assert that a subject can consume a given amount.
 * Throws if the usage limit would be exceeded.
 */
export async function assertCanConsume(
  db: PrismaClient,
  subjectId: string,
  meterKey: string,
  amount: number = 1,
): Promise<void> {
  const remaining = await getRemainingUsage(db, subjectId, meterKey);
  if (remaining < amount) {
    throw new Error(
      `Usage limit exceeded for ${meterKey}. Remaining: ${remaining}, requested: ${amount}`,
    );
  }
}

/**
 * Record usage consumption for a meter.
 */
export async function recordUsage(
  db: PrismaClient,
  subjectId: string,
  subjectType: "user" | "organization",
  meterKey: string,
  amount: number = 1,
): Promise<void> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
  );

  await db.usageRecord.upsert({
    where: {
      subjectId_meterKey_periodStart: { subjectId, meterKey, periodStart },
    },
    create: {
      subjectId,
      subjectType,
      meterKey,
      quantity: amount,
      periodStart,
      periodEnd,
    },
    update: { quantity: { increment: amount } },
  });

  await invalidateEntitlementCache(subjectId, subjectType);
}

/**
 * Refresh entitlement snapshot from plan data.
 * Called after billing webhook updates subscription state.
 */
export async function refreshEntitlements(
  db: PrismaClient,
  subjectId: string,
  subjectType: "user" | "organization" = "user",
): Promise<EntitlementSnapshot> {
  const planSlug =
    subjectType === "user"
      ? await getUserPlan(db, subjectId)
      : "free";

  const plan = plans.find((p) => p.slug === planSlug) ?? plans[0]!;

  // Clear old entitlements and rebuild from plan
  await db.entitlement.deleteMany({ where: { subjectId } });

  const entitlements = Object.entries(plan.limits).map(([key, value]) => ({
    subjectId,
    subjectType,
    featureKey: key,
    value: typeof value === "number" ? value === -1 || value > 0 : !!value,
  }));

  if (entitlements.length > 0) {
    await db.entitlement.createMany({ data: entitlements });
  }

  await invalidateSubjectCaches(subjectId, subjectType);
  return buildEntitlements(db, subjectId, subjectType);
}
