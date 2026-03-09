import type { CacheDriver } from "./types";
import { NoopCache } from "./noop";
import { isRedisEnabled } from "@/lib/features";
import { createLogger } from "@/lib/logger";

const log = createLogger("cache");

let _cache: CacheDriver | null = null;

/** Check the REDIS_STRICT_MODE env flag. */
function isStrictMode(): boolean {
  const raw = process.env.REDIS_STRICT_MODE?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes" || raw === "on";
}

/**
 * Get the cache driver singleton.
 *
 * Returns Redis when ENABLE_REDIS_CACHE=true and connection succeeds.
 * Falls back to no-op otherwise (unless REDIS_STRICT_MODE=true).
 */
export async function getCache(): Promise<CacheDriver> {
  if (_cache) return _cache;

  const enabled = isRedisEnabled();

  if (!enabled) {
    _cache = new NoopCache();
    return _cache;
  }

  try {
    const { RedisCache } = await import("./redis");
    const redis = new RedisCache();
    await redis.connect();
    _cache = redis;
    log.info("Redis connected");
    return _cache;
  } catch (err) {
    const strict = isStrictMode();
    if (strict) throw err;
    log.warn({ err }, "Redis connection failed, falling back to noop");
    _cache = new NoopCache();
    return _cache;
  }
}

export type { CacheDriver } from "./types";
export { cacheKeys } from "./keys";
