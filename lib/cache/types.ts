export interface CacheDriver {
  kind: "noop" | "redis";
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  del(key: string | string[]): Promise<void>;
  remember<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
  ): Promise<T>;
  withLock<T>(
    key: string,
    ttlSeconds: number,
    work: () => Promise<T>,
  ): Promise<T>;
}
