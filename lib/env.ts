/**
 * Type-safe environment variables.
 *
 * Uses `@t3-oss/env-nextjs` + Zod for build-time and runtime validation.
 * Required variables cause a hard startup failure; optional ones
 * gracefully default to `undefined`.
 *
 * @module
 */

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url(),

    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).optional(),

    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    GITHUB_CLIENT_ID: z.string().min(1).optional(),
    GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
    DISCORD_CLIENT_ID: z.string().min(1).optional(),
    DISCORD_CLIENT_SECRET: z.string().min(1).optional(),

    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),

    POLAR_ACCESS_TOKEN: z.string().min(1).optional(),
    POLAR_ENVIRONMENT: z.enum(["sandbox", "production"]).optional(),
    POLAR_WEBHOOK_SECRET: z.string().min(1).optional(),

    ENABLE_ORGANIZATIONS: z.string().min(1).optional(),

    // Redis cache (optional)
    ENABLE_REDIS_CACHE: z.string().min(1).optional(),
    REDIS_URL: z.string().min(1).optional(),
    REDIS_HOST: z.string().min(1).optional().default("localhost"),
    REDIS_PORT: z.coerce.number().optional().default(6379),
    REDIS_PASSWORD: z.string().min(1).optional(),
    REDIS_DB: z.coerce.number().optional().default(0),
    REDIS_KEY_PREFIX: z.string().min(1).optional().default("dastack"),
    REDIS_STRICT_MODE: z.string().min(1).optional(),

    // UploadThing (optional)
    UPLOADTHING_TOKEN: z.string().min(1).optional(),

    // Admin panel
    ENABLE_ADMIN_PANEL: z.string().min(1).optional(),
  },

  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  },

  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },

  emptyStringAsUndefined: true,
});
