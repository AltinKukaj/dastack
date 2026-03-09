# Setup

---

## TL;DR

| Goal | Do this |
|------|--------|
| **Install** | `pnpm install` |
| **Set env vars** | Copy `.env.example` to `.env` |
| **Database** | `pnpm exec prisma generate` -> `pnpm exec prisma db push` |
| **Run app** | `pnpm dev` |

---

## Prerequisites

- **Node.js** 20 or newer (the repo’s Dockerfile uses Node 22)
- **pnpm**
- **PostgreSQL**

Redis, Stripe, UploadThing, and OAuth apps are optional. The app boots and runs with only the required env vars; optional features are hidden when their keys or flags are unset.

## First run

1. Install dependencies: `pnpm install`
2. Copy `.env.example` to `.env`
3. Set the **required** keys:
   - `NEXT_PUBLIC_APP_URL`
   - `DATABASE_URL`
   - `BETTER_AUTH_URL`
   - `BETTER_AUTH_SECRET`
4. Generate the Prisma client: `pnpm exec prisma generate`
5. Apply the database schema: `pnpm exec prisma db push`
6. Start the app: `pnpm dev`

Typical local values:

- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- `BETTER_AUTH_URL=http://localhost:3000`
- `DATABASE_URL=postgresql://user:password@localhost:5432/your_db`

Keep `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` in sync unless you intentionally use a different auth host.

## What works with only the required keys

With just the required four keys you get:

- Email/password auth
- Email verification
- Passkeys
- 2FA (TOTP, email OTP, backup codes)
- Guest sessions
- Account and security settings
- Prisma-backed auth and session storage

Email is logged to the console until you set `RESEND_API_KEY`.

## Optional integrations

Add these when needed:

- **OAuth** — Google, GitHub, Discord (set the matching client ID/secret pairs)
- **Stripe** — Billing; then run `pnpm stripe:sync` and optionally `pnpm stripe:poll` for local webhook testing
- **UploadThing** — File uploads; set `UPLOADTHING_TOKEN`
- **Redis** — Cache and distributed rate limiting; set `ENABLE_REDIS_CACHE` and Redis connection vars
- **Organizations** — Set `ENABLE_ORGANIZATIONS`
- **Admin panel** — Set `ENABLE_ADMIN_PANEL`

The UI is feature-gated: missing config hides or disables the related screens.

## Deployment

- **Docker** — The repo includes a multi-stage `Dockerfile` and a GitHub Actions workflow (`.github/workflows/docker-build.yml`) that builds and pushes to GitHub Container Registry. Supply real environment variables at runtime. Ensure the database schema is applied (e.g. run `prisma db push` or `prisma migrate deploy` in an init job or entrypoint) before the app serves traffic.
- **Vercel / other platforms** — Configure env vars in the dashboard, run `prisma generate` as part of the build, and run migrations or `prisma db push` in a release step or post-deploy script if you use migrations.

## Recommended first-day cleanup

Before publishing this as a template or launching your own product:

1. Set your app name in `lib/config.ts` and update any remaining placeholder branding (see [Customization guide](customization.md)).
2. Replace the legal placeholder pages: `app/terms/page.tsx` and `app/privacy/page.tsx`.
3. Replace default icons and remove leftover placeholder branding from metadata and `public/`.
4. If using Stripe, review and edit `lib/plans.ts` before running `pnpm stripe:sync`.
5. Remove or disable features you do not need via env and, if desired, by deleting the related code (see [Customization guide](customization.md#trim-features)).

## Common commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run the app locally |
| `pnpm build` | Production build |
| `pnpm start` | Run production build |
| `pnpm lint` | Run ESLint |
| `pnpm exec prisma generate` | Generate Prisma client |
| `pnpm exec prisma db push` | Push schema to the database |
| `pnpm stripe:sync` | Create Stripe products/prices and regenerate `lib/stripe-plans.generated.ts` |
| `pnpm stripe:poll` | Local Stripe polling when webhooks are not forwarded |

---

## Common first-run issues (Troubleshooting)

- **Auth appears disabled:** one of the core auth env vars (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`) is missing.
- **Provider OAuth mismatch:** callback URL in provider dashboard does not exactly match `{BETTER_AUTH_URL}/api/auth/callback/{provider}`.
- **Stripe incomplete state:** payments stuck; webhook not connected (use `pnpm stripe:poll` locally).
- **App crashes on startup:** missing or invalid required `NEXT_PUBLIC_APP_URL` or DB URL (check terminal for validation error).
