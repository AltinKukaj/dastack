import { afterEach, describe, expect, test } from "bun:test";
import { getFeatureFlags } from "../lib/features";

const FEATURE_ENV_KEYS = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "DISABLE_PASSKEY",
  "RESEND_API_KEY",
  "DISCORD_CLIENT_ID",
  "DISCORD_CLIENT_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "CAPTCHA_SECRET_KEY",
  "NEXT_PUBLIC_CAPTCHA_SITE_KEY",
] as const;

const ORIGINAL_FEATURE_ENV = FEATURE_ENV_KEYS.map(
  (key) => [key, process.env[key]] as const,
);

function applyEnv(
  overrides: Partial<Record<(typeof FEATURE_ENV_KEYS)[number], string>>,
) {
  for (const key of FEATURE_ENV_KEYS) {
    delete process.env[key];
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value) process.env[key] = value;
  }
}

afterEach(() => {
  for (const key of FEATURE_ENV_KEYS) {
    delete process.env[key];
  }

  for (const [key, value] of ORIGINAL_FEATURE_ENV) {
    if (value) process.env[key] = value;
  }
});

describe("getFeatureFlags", () => {
  test("returns all false when no relevant env vars are set", () => {
    applyEnv({});

    expect(getFeatureFlags()).toEqual({
      auth: false,
      email: false,
      passkey: false,
      discord: false,
      google: false,
      github: false,
      stripe: false,
      captcha: false,
    });
  });

  test("enables only auth when only core auth env is set", () => {
    applyEnv({
      DATABASE_URL: "postgresql://user:pass@localhost:5432/db?schema=public",
      BETTER_AUTH_SECRET: "test-secret",
      BETTER_AUTH_URL: "http://localhost:3000",
    });

    expect(getFeatureFlags()).toEqual({
      auth: true,
      email: false,
      passkey: true,
      discord: false,
      google: false,
      github: false,
      stripe: false,
      captcha: false,
    });
  });

  test("disables passkey when DISABLE_PASSKEY=true and auth is on", () => {
    applyEnv({
      DATABASE_URL: "postgresql://user:pass@localhost:5432/db?schema=public",
      BETTER_AUTH_SECRET: "test-secret",
      BETTER_AUTH_URL: "http://localhost:3000",
      DISABLE_PASSKEY: "true",
    });

    expect(getFeatureFlags()).toEqual({
      auth: true,
      email: false,
      passkey: false,
      discord: false,
      google: false,
      github: false,
      stripe: false,
      captcha: false,
    });
  });

  test("enables stripe when auth + stripe env vars are set", () => {
    applyEnv({
      DATABASE_URL: "postgresql://user:pass@localhost:5432/db?schema=public",
      BETTER_AUTH_SECRET: "test-secret",
      BETTER_AUTH_URL: "http://localhost:3000",
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_WEBHOOK_SECRET: "whsec_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_123",
    });

    expect(getFeatureFlags()).toEqual({
      auth: true,
      email: false,
      passkey: true,
      discord: false,
      google: false,
      github: false,
      stripe: true,
      captcha: false,
    });
  });
});
