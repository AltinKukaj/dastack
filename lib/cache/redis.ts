import { randomUUID } from "crypto";
import { createClient, type RedisClientType } from "redis";
import type { CacheDriver } from "./types";

import { createLogger } from "@/lib/logger";

const log = createLogger("redis");

/**
 * Redis-backed cache driver.
 *
 * Connects using REDIS_URL or individual REDIS_* env vars.
 * All keys are prefixed with REDIS_KEY_PREFIX.
 */
export class RedisCache implements CacheDriver {
  kind = "redis" as const;
  private client: RedisClientType;
  private prefix: string;

  constructor() {
    const url =
      process.env.REDIS_URL ??
      `redis://${process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : ""}${process.env.REDIS_HOST ?? "localhost"}:${process.env.REDIS_PORT ?? 6379}/${process.env.REDIS_DB ?? 0}`;

    this.client = createClient({ url }) as RedisClientType;
    this.prefix = process.env.REDIS_KEY_PREFIX ?? "dastack";

    this.client.on("error", (err) => {
      log.warn({ err }, "Redis error: %s", err.message);
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  private key(k: string): string {
    return `${this.prefix}:${k}`;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const raw = await this.client.get(this.key(key));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set(
    key: string,
    value: unknown,
    ttlSeconds?: number,
  ): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.setEx(this.key(key), ttlSeconds, serialized);
    } else {
      await this.client.set(this.key(key), serialized);
    }
  }

  async del(key: string | string[]): Promise<void> {
    const keys = Array.isArray(key) ? key.map((k) => this.key(k)) : [this.key(key)];
    await this.client.del(keys);
  }

  async remember<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    return this.withLock(
      `remember:${key}`,
      Math.max(1, Math.min(ttlSeconds, 10)),
      async () => {
        const cachedValue = await this.get<T>(key);
        if (cachedValue !== null) return cachedValue;

        const value = await loader();
        await this.set(key, value, ttlSeconds);
        return value;
      },
    );
  }

  async withLock<T>(
    key: string,
    ttlSeconds: number,
    work: () => Promise<T>,
  ): Promise<T> {
    const lockKey = this.key(`lock:${key}`);
    const token = randomUUID();
    const timeoutMs = ttlSeconds * 1000;
    const startedAt = Date.now();

    while (true) {
      const acquired = await this.client.set(lockKey, token, {
        NX: true,
        EX: Math.max(1, ttlSeconds),
      });

      if (acquired === "OK") break;

      if (Date.now() - startedAt >= timeoutMs) {
        return work();
      }

      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    try {
      return await work();
    } finally {
      const currentToken = await this.client.get(lockKey);
      if (currentToken === token) {
        await this.client.del(lockKey);
      }
    }
  }
}
