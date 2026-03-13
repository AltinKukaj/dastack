/**
 * Rate limiting for DaStack.
 *
 * Uses Redis when available, falls back to an in-process Map.
 * This protects auth-sensitive flows without requiring Redis.
 */

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

/**
 * Predefined rate limit scopes for auth flows.
 */
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  "auth:signin": { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  "auth:signup": { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  "auth:password-reset": { windowMs: 15 * 60 * 1000, maxRequests: 3 },
  "auth:otp": { windowMs: 5 * 60 * 1000, maxRequests: 5 },
  "auth:magic-link": { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  "api:general": { windowMs: 60 * 1000, maxRequests: 60 },
};

/**
 * In-process rate limiter (fallback when Redis is not available).
 *
 * Uses a simple sliding window approach. Not suitable for multi-instance
 * deployments — use Redis for that.
 */
const store = new Map<string, { count: number; resetAt: number }>();

// Periodic cleanup to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 60_000);
}

export async function checkRateLimit(
  scope: string,
  key: string,
  config?: RateLimitConfig,
): Promise<RateLimitResult> {
  const cfg = config ?? RATE_LIMITS[scope] ?? RATE_LIMITS["api:general"]!;
  const storeKey = `${scope}:${key}`;

  // Try Redis first if available
  try {
    const { getCache, cacheKeys } = await import("@/lib/cache");
    const cache = await getCache();
    if (cache.kind === "redis") {
      const redisKey = cacheKeys.rateLimit(scope, key);
      const ttlSeconds = Math.max(1, Math.ceil(cfg.windowMs / 1000));

      return cache.withLock(
        `ratelimit:${scope}:${key}`,
        ttlSeconds,
        async () => {
          const raw = await cache.get<{ count: number; resetAt: number }>(redisKey);
          const now = Date.now();

          if (!raw || raw.resetAt < now) {
            const resetAt = now + cfg.windowMs;
            await cache.set(redisKey, { count: 1, resetAt }, ttlSeconds);
            return {
              allowed: true,
              remaining: cfg.maxRequests - 1,
              resetAt: new Date(resetAt),
            };
          }

          if (raw.count >= cfg.maxRequests) {
            return {
              allowed: false,
              remaining: 0,
              resetAt: new Date(raw.resetAt),
            };
          }

          const newCount = raw.count + 1;
          await cache.set(
            redisKey,
            { count: newCount, resetAt: raw.resetAt },
            Math.max(1, Math.ceil((raw.resetAt - now) / 1000)),
          );

          return {
            allowed: true,
            remaining: cfg.maxRequests - newCount,
            resetAt: new Date(raw.resetAt),
          };
        },
      );
    }
  } catch {
    // Fallback to in-process limiter
  }

  // In-process fallback
  const now = Date.now();
  const entry = store.get(storeKey);

  if (!entry || entry.resetAt < now) {
    const resetAt = now + cfg.windowMs;
    store.set(storeKey, { count: 1, resetAt });
    return { allowed: true, remaining: cfg.maxRequests - 1, resetAt: new Date(resetAt) };
  }

  if (entry.count >= cfg.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: new Date(entry.resetAt) };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: cfg.maxRequests - entry.count,
    resetAt: new Date(entry.resetAt),
  };
}
