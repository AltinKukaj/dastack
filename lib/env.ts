import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Build-time environment validation.
 *
 * If a required variable is missing, the build (or dev server) will fail
 * immediately with a clear error instead of crashing at runtime.
 *
 * Import `env` instead of using `process.env` directly for any validated var.
 *
 * @see https://env.t3.gg/docs/nextjs
 */
export const env = createEnv({
  // ── Server-side variables (never exposed to the browser) ───────────
  server: {
    // Auth core - optional. When all three are set, auth is enabled.
    DATABASE_URL: z
      .string()
      .url("DATABASE_URL must be a valid PostgreSQL connection string")
      .optional(),
    BETTER_AUTH_SECRET: z
      .string()
      .min(1, "BETTER_AUTH_SECRET is required")
      .optional(),
    BETTER_AUTH_URL: z
      .string()
      .url("BETTER_AUTH_URL must be a valid URL")
      .optional(),

    // Email (Resend)
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().optional(),

    // OAuth – optional, but validated when provided
    DISCORD_CLIENT_ID: z.string().optional(),
    DISCORD_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),

    // Captcha (Cloudflare Turnstile)
    CAPTCHA_SECRET_KEY: z.string().optional(),

    // Stripe
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
  },

  // ── Client-side variables (prefixed with NEXT_PUBLIC_) ─────────────
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_CAPTCHA_SITE_KEY: z.string().optional(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  },

  // ── Runtime values (maps process.env -> the schema above) ───────────
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    CAPTCHA_SECRET_KEY: process.env.CAPTCHA_SECRET_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },

  /**
   * Skip validation in CI / edge cases where env isn't available.
   * Set SKIP_ENV_VALIDATION=1 to skip.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Treat empty strings as undefined so a missing value
   * like `BETTER_AUTH_SECRET=""` is correctly caught.
   */
  emptyStringAsUndefined: true,
});
