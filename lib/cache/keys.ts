/**
 * Cache key builders for consistent key naming.
 */
export const cacheKeys = {
  userDashboard: (userId: string) => `user:${userId}:dashboard`,
  userRecentSessions: (userId: string) => `user:${userId}:recent-sessions`,
  userEntitlements: (userId: string) => `user:${userId}:entitlements`,
  orgEntitlements: (orgId: string) => `org:${orgId}:entitlements`,
  orgMembership: (orgId: string) => `org:${orgId}:membership`,
  publicPlans: () => `public:plans`,
  systemReport: () => `system:report`,
  rateLimit: (scope: string, key: string) => `ratelimit:${scope}:${key}`,
  webhookIdempotency: (eventId: string) => `webhook:idem:${eventId}`,
};
