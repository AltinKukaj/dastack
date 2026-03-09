# Environment Variables

---

## TL;DR

- Copy **`.env.example`** -> **`.env`** in the project root.
- **Core (auth on):** `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`.
- **Optional:** Add Resend, OAuth, or Stripe keys when you want those features.
- Keep `.env` local only. Never commit it.

---

The app validates environment variables in `lib/env.ts` using `@t3-oss/env-nextjs` and Zod.

- **Required** keys cause the app to fail at startup if missing.
- **Optional** keys default to `undefined` when absent.
- **Boolean feature flags** are only considered “on” for explicit truthy values: `true`, `1`, `yes`, or `on`.

Empty strings are treated as missing.

## Required

| Key | Used by | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Client redirects, public URLs | e.g. `http://localhost:3000` in development |
| `DATABASE_URL` | Prisma | PostgreSQL connection URL |
| `BETTER_AUTH_URL` | Better Auth, passkeys | Usually same as `NEXT_PUBLIC_APP_URL`; used as passkey origin and RP host |
| `BETTER_AUTH_SECRET` | Better Auth | Use a strong random secret in every environment |

## OAuth (optional)

| Key | Used by | Notes |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | Google OAuth | Provider only enabled when both ID and secret are set |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | |
| `GITHUB_CLIENT_ID` | GitHub OAuth | Same rule as Google |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth | |
| `DISCORD_CLIENT_ID` | Discord OAuth | Same rule as Google |
| `DISCORD_CLIENT_SECRET` | Discord OAuth | |

## Email (optional)

| Key | Used by | Notes |
| --- | --- | --- |
| `RESEND_API_KEY` | `lib/email.ts` | Without it, emails are logged to the console |
| `EMAIL_FROM` | `lib/email.ts` | Defaults to `APP_NAME <noreply@example.com>` when unset |

## Billing – Stripe (optional)

| Key | Used by | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client | Needed for checkout on the frontend |
| `STRIPE_SECRET_KEY` | Better Auth Stripe plugin, scripts | Billing UI is hidden without it |
| `STRIPE_WEBHOOK_SECRET` | Better Auth Stripe plugin | Required with `STRIPE_SECRET_KEY` for full billing |

Billing is “ready” in two steps:

1. **Stripe configured** — when `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are set.
2. **Checkout enabled** — when `lib/stripe-plans.generated.ts` has valid Stripe price IDs (after `pnpm stripe:sync`).

## Uploads – UploadThing (optional)

| Key | Used by | Notes |
| --- | --- | --- |
| `UPLOADTHING_TOKEN` | UploadThing API + UI | Files-related pages return 404 when this is missing |

## Redis and cache (optional)

| Key | Used by | Notes |
| --- | --- | --- |
| `ENABLE_REDIS_CACHE` | Feature flag | Enables Redis for cache and rate limiting |
| `REDIS_URL` | Redis client | Overrides host/port/password/db when set |
| `REDIS_HOST` | Redis client | Defaults to `localhost` |
| `REDIS_PORT` | Redis client | Defaults to `6379` |
| `REDIS_PASSWORD` | Redis client | Optional |
| `REDIS_DB` | Redis client | Defaults to `0` |
| `REDIS_KEY_PREFIX` | Redis client | Namespace for keys; default in code is `dastack` (customize for your app) |
| `REDIS_STRICT_MODE` | Cache bootstrap | If truthy, Redis connection failure throws instead of falling back to no-op |

If Redis is enabled but unreachable and `REDIS_STRICT_MODE` is not set, the app falls back to in-memory/no-op behavior. That is fine for local dev but not for multi-instance production.

## Feature flags (optional)

| Key | Used by | Notes |
| --- | --- | --- |
| `ENABLE_ORGANIZATIONS` | Better Auth org plugin, org UI | Off when unset |
| `ENABLE_ADMIN_PANEL` | Admin tRPC and `/admin` | Off when unset |

## Unused / reserved keys

`lib/env.ts` still defines these; they are **not** used by the current app (billing is Stripe-only):

- `POLAR_ACCESS_TOKEN`
- `POLAR_ENVIRONMENT`
- `POLAR_WEBHOOK_SECRET`

You can remove these from `lib/env.ts` and `.env.example` if you do not plan to add Polar.

## Switching email providers

The app is structured so only `lib/email.ts` talks to the provider:

1. Replace the provider logic inside `lib/email.ts`.
2. Keep the exported `sendEmail` signature the same.
3. Keep or replace the HTML template helpers in that file.
4. Update `lib/env.ts` and `.env.example` with your provider’s env keys.

Auth only calls `sendEmail(...)`; it does not depend on Resend.

---

## "Why is my app crashing on startup?"

This project validates env vars at **build/dev time** (`lib/env.ts`). Invalid or missing required vars can make the dev server fail early.

**Bypass in CI/Docker** (when `.env` isn’t available):

```bash
SKIP_ENV_VALIDATION=1 pnpm build
```
