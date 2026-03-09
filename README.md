# Next.js Starter

A production-ready Next.js 16 starter with authentication, billing, file uploads, and optional organizations, admin, and Redis. Use this repo as a **GitHub template** to spin up a new project (click **Use this template** on GitHub; repo owners can enable **Settings → General → Template repository** so the button appears), or clone and customize it for your product.

> **Before publishing your own version:** The codebase includes placeholder branding (e.g. "DaStack") in a few files and assets. See [Customization guide](DOCS/customization.md) for the exact locations to rename and the [pre-publish checklist](DOCS/customization.md#clean-publish-checklist).

## What's included

- **Auth** — [Better Auth](https://www.better-auth.com/) with email/password, magic links, email OTP, passkeys, social login (Google, GitHub, Discord), guest sessions, and 2FA
- **Database** — Prisma + PostgreSQL for auth, subscriptions, assets, audit events, usage, and webhooks
- **Billing** — Stripe via Better Auth's subscription plugin (plans, checkout, portal, webhooks)
- **Uploads** — [UploadThing](https://uploadthing.com/) with asset metadata in the database and auth-gated downloads
- **Optional** — Organizations, admin dashboard, Redis cache/rate limiting (all feature-flagged)
- **UI** — App Router, tRPC, TanStack Query, Tailwind CSS v4, Radix UI, shadcn-style components

## Quick start

1. **Use this template** — Click "Use this template" on GitHub, or clone the repo.
2. Install dependencies: `pnpm install`
3. Copy `.env.example` to `.env` and set:
   - `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000`)
   - `DATABASE_URL`
   - `BETTER_AUTH_URL` (same as app URL unless you use a separate auth host)
   - `BETTER_AUTH_SECRET`
4. Generate Prisma client: `pnpm exec prisma generate`
5. Apply schema: `pnpm exec prisma db push`
6. Start the app: `pnpm dev`

To enable Stripe billing, add your Stripe keys, then run `pnpm stripe:sync` before testing paid plans.

## Documentation

| Doc | Description |
| --- | --- |
| [Setup](DOCS/setup.md) | Prerequisites, first run, optional integrations |
| [Environment variables](DOCS/environment.md) | Every env key, required vs optional |
| [Auth](DOCS/auth.md) | Better Auth setup, flows, and customization |
| [Billing](DOCS/billing.md) | Stripe setup, plans, webhooks, entitlements |
| [Uploads and storage](DOCS/uploads.md) | UploadThing, asset records, download auth |
| [Architecture](DOCS/architecture.md) | Stack, folder layout, request flow |
| [Customization](DOCS/customization.md) | Rebranding, email, plans, feature trimming, publish checklist |

**Suggested order for new users:** Setup → Environment variables → Auth → Billing (if using Stripe) → Customization.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Next.js dev server |
| `pnpm build` | Build for production |
| `pnpm start` | Run the production build |
| `pnpm lint` | Run ESLint |
| `pnpm exec prisma generate` | Generate Prisma client |
| `pnpm exec prisma db push` | Push schema to the database (no migrations) |
| `pnpm stripe:sync` | Create Stripe products/prices from `lib/plans.ts` and regenerate `lib/stripe-plans.generated.ts` |
| `pnpm stripe:poll` | Poll Stripe locally when not forwarding real webhooks |

## Deployment

- **Docker** — A multi-stage `Dockerfile` and [GitHub Actions workflow](.github/workflows/docker-build.yml) build and push images to GitHub Container Registry. The image is built with placeholder env vars; **provide real env at runtime**. Run `prisma db push` or your migrations before or at container start if needed.
- **Vercel / other hosts** — Set env vars, run Prisma generate in build, and run migrations or `db push` in a release step or separate job.

## Notes for template users

- **Legal pages** — `/terms` and `/privacy` are placeholders. Replace their content before launch.
- **Billing** — The app uses Stripe only. Unused `POLAR_*` env definitions remain in `lib/env.ts`; you can remove them if you do not plan to add Polar.
- **Email** — Default transport is Resend; the integration is isolated in `lib/email.ts` so you can swap providers easily.
- **Stripe plans** — `lib/stripe-plans.generated.ts` is generated for a specific Stripe account. Run `pnpm stripe:sync` for your own account.
- **Optional features** — Billing, uploads, organizations, admin, and Redis are gated by env; leave keys unset to ship a smaller footprint.
- **Dependabot** — `.github/dependabot.yml` is included for npm, GitHub Actions, and Docker; template users get dependency update PRs by default.
- **Security** — See [SECURITY.md](SECURITY.md) for reporting vulnerabilities and best practices when using this template.

## License

MIT
