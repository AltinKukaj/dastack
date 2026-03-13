import type { CacheDriver } from "./types";

/**
 * No-op cache driver. Always misses and delegates to loaders.
 * Used when Redis is not enabled or unavailable.
 */
export class NoopCache implements CacheDriver {
  kind = "noop" as const;

  async get<T>(): Promise<T | null> {
    return null;
  }

  async set(): Promise<void> {
    // no-op
  }

  async del(): Promise<void> {
    // no-op
  }

  async remember<T>(
    _key: string,
    _ttl: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    return loader();
  }

  async withLock<T>(
    _key: string,
    _ttlSeconds: number,
    work: () => Promise<T>,
  ): Promise<T> {
    return work();
  }
}
