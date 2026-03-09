# Architecture and Libraries

## Stack

| Layer | Library | Role in this repo |
| --- | --- | --- |
| Framework | Next.js 16 | App Router, route handlers, Server Components |
| UI | React 19 | Client and server rendering |
| Language | TypeScript | Typed application code |
| Styling | Tailwind CSS v4 | Utility styling |
| UI primitives | Radix UI + shadcn-style components | Inputs, dropdowns, buttons, separators |
| Auth | Better Auth | Sessions, providers, passkeys, 2FA, orgs, subscriptions |
| Database | Prisma + PostgreSQL | App and auth data |
| API layer | tRPC + TanStack Query + superjson | Typed client/server data fetching |
| Validation | Zod + `@t3-oss/env-nextjs` | Env validation and input schemas |
| Billing | Stripe | Subscriptions and billing portal |
| Uploads | UploadThing | File transfer and storage |
| Email | Resend | Default email transport (swappable in `lib/email.ts`) |
| Cache | Redis (optional) | Cache and distributed rate limiting; no-op when disabled |
| Logging | Pino | Structured logging |
| Charts | Recharts | Dashboard and admin reporting |

Exact versions are in `package.json`; the table above reflects the intended roles.

## Project layout

```text
app/
  api/
    auth/[...all]/          Better Auth route handler
    trpc/[trpc]/            tRPC HTTP endpoint
    uploadthing/            UploadThing routes
    storage/assets/[id]/    Auth-gated asset download redirect
    health/                 Health check
  login/                    Auth UI
  signup/                   Sign-up UI
  pricing/                  Public pricing page
  dashboard/                Authenticated app area
  admin/                    Optional admin dashboard
  terms/  privacy/          Legal placeholder pages

lib/
  auth.ts                   Better Auth server config
  auth-client.ts            Better Auth client SDK
  auth-server.ts            Session helpers for Server Components (getSession, requireAuth, requireAdmin)
  config.ts                 App name and shared constants
  env.ts                    Env validation
  features.ts               Runtime feature gating (Stripe, uploads, orgs, admin, Redis)
  plans.ts                  Billing plan source of truth
  stripe-plans.generated.ts Generated Stripe price IDs (run pnpm stripe:sync)
  email.ts                  Email transport and templates
  prisma.ts                 Prisma singleton
  cache/                    Redis and no-op cache layer
  trpc/                     Query client and provider setup
  uploadthing.ts            UploadThing client helper

server/
  api/routers/              tRPC routers
  context/                  Request context (session, DB, request ID, etc.)
  modules/                  Domain business logic
  jobs/                     Webhook ingestion helpers

prisma/
  schema.prisma             Full database schema
```

## Request flow

Most app data flows like this:

1. A page or client component calls a tRPC query or mutation.
2. `/api/trpc/[trpc]` builds a request context (session, DB, request ID, IP, user agent).
3. The router calls a domain module under `server/modules`.
4. The module reads/writes via Prisma.
5. Optional cache invalidation is handled in the module layer.

Auth is the main exception: it goes through Better Auth at `/api/auth/...`.

## Domain modules

Business logic lives in `server/modules`:

| Module | Responsibility |
| --- | --- |
| `auth` | Dashboard auth stats, recent sessions |
| `billing` | Subscription summaries, webhook handling |
| `entitlements` | Plan resolution, usage snapshots, limits |
| `storage` | Asset metadata and download authorization |
| `organizations` | Org reads beyond Better Auth defaults |
| `admin` | User management, admin summaries |
| `analytics` | Admin report aggregation |
| `audit` | Audit event storage and queries |
| `cache` | Cache invalidation helpers |

Routers stay thin; product behavior is extended in these modules.

## Database scope

`prisma/schema.prisma` includes:

- Better Auth core models
- Passkeys and 2FA
- Organizations and invitations
- Subscriptions
- Entitlements and usage records
- Audit events
- Webhook events
- Uploaded assets (Asset)

For a minimal template, the schema is one of the first places to trim.

## Cache and rate limiting

Redis is optional.

- **With Redis** — Cache uses Redis; rate limiting works across instances; webhook idempotency can persist across restarts.
- **Without Redis** — Cache is no-op; rate limiting uses an in-process store. Fine for local dev; for production at scale you typically enable Redis.
