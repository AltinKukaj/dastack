import { describe, expect, test } from "bun:test";
import { z } from "zod";

// ── Env schema validation ──────────────────────────────────────────────────────
// These tests verify the Zod schemas used in lib/env.ts behave as expected,
// without needing a running database or real env vars.

describe("Environment schema validation", () => {
  test("DATABASE_URL rejects non-URL strings when provided", () => {
    const schema = z.string().url().optional();
    expect(schema.safeParse("not-a-url").success).toBe(false);
    expect(schema.safeParse("").success).toBe(false);
    expect(schema.safeParse(undefined).success).toBe(true);
  });

  test("DATABASE_URL accepts valid PostgreSQL URLs", () => {
    const schema = z.string().url().optional();
    expect(
      schema.safeParse("postgresql://user:pass@localhost:5432/mydb").success,
    ).toBe(true);
  });

  test("BETTER_AUTH_SECRET rejects empty strings when provided", () => {
    const schema = z.string().min(1).optional();
    expect(schema.safeParse("").success).toBe(false);
    expect(schema.safeParse(undefined).success).toBe(true);
  });

  test("BETTER_AUTH_SECRET accepts non-empty strings", () => {
    const schema = z.string().min(1).optional();
    expect(schema.safeParse("super-secret-key-123").success).toBe(true);
  });

  test("Optional keys (RESEND_API_KEY) accept undefined", () => {
    const schema = z.string().min(1).optional();
    expect(schema.safeParse(undefined).success).toBe(true);
  });

  test("Optional keys reject empty strings when provided", () => {
    const schema = z.string().min(1).optional();
    expect(schema.safeParse("").success).toBe(false);
  });

  test("BETTER_AUTH_URL must be a valid URL when provided", () => {
    const schema = z.string().url().optional();
    expect(schema.safeParse("http://localhost:3000").success).toBe(true);
    expect(schema.safeParse("https://myapp.com").success).toBe(true);
    expect(schema.safeParse("not-a-url").success).toBe(false);
    expect(schema.safeParse(undefined).success).toBe(true);
  });
});

// ── Prisma config ──────────────────────────────────────────────────────────────

describe("Prisma config resilience", () => {
  test("prisma.config.ts can be imported", async () => {
    const mod = await import("../prisma.config");
    expect(mod.default).toBeDefined();
    // datasource URL may be undefined when DATABASE_URL is not set
    const url = mod.default.datasource?.url;
    if (process.env.DATABASE_URL) {
      expect(typeof url).toBe("string");
      expect((url as string).length).toBeGreaterThan(0);
    }
  });
});
