import "server-only";

/**
 * Cache invalidation service.
 *
 * Provides targeted cache-busting helpers so that services can
 * invalidate only the keys they affect. All functions are
 * idempotent — deleting a non-existent key is a no-op.
 */

import { cacheKeys, getCache } from "@/lib/cache";

/**
 * Invalidate user-scoped caches (dashboard stats, sessions, entitlements).
 *
 * By default all three are invalidated; pass `false` to skip specific ones.
 */
export async function invalidateUserCaches(
  userId: string,
  opts: {
    dashboard?: boolean;
    recentSessions?: boolean;
    entitlements?: boolean;
  } = {},
) {
  const keys: string[] = [];

  if (opts.dashboard ?? true) {
    keys.push(cacheKeys.userDashboard(userId));
  }

  if (opts.recentSessions ?? true) {
    keys.push(cacheKeys.userRecentSessions(userId));
  }

  if (opts.entitlements ?? true) {
    keys.push(cacheKeys.userEntitlements(userId));
  }

  if (keys.length === 0) return;

  const cache = await getCache();
  await cache.del(keys);
}

/**
 * Invalidate organization-scoped caches (membership, entitlements).
 */
export async function invalidateOrganizationCaches(
  organizationId: string,
  opts: {
    membership?: boolean;
    entitlements?: boolean;
  } = {},
) {
  const keys: string[] = [];

  if (opts.membership ?? true) {
    keys.push(cacheKeys.orgMembership(organizationId));
  }

  if (opts.entitlements ?? true) {
    keys.push(cacheKeys.orgEntitlements(organizationId));
  }

  if (keys.length === 0) return;

  const cache = await getCache();
  await cache.del(keys);
}

/**
 * Invalidate all caches for a subject, dispatching to the correct
 * user or organization invalidation helper.
 */
export async function invalidateSubjectCaches(
  subjectId: string,
  subjectType: "user" | "organization",
) {
  if (subjectType === "organization") {
    await invalidateOrganizationCaches(subjectId);
    return;
  }

  await invalidateUserCaches(subjectId);
}

/**
 * Invalidate global system-level caches (e.g. the analytics report).
 */
export async function invalidateSystemCaches() {
  const cache = await getCache();
  await cache.del(cacheKeys.systemReport());
}
