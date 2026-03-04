# Architecture Overview

This template is structured so core platform concerns are easy to extend:

- auth and session handling
- feature flags and optional providers
- dashboard and product surface
- API boundaries (tRPC + route handlers)

---

## High-level layers

| Layer | Purpose | Key paths |
|------|---------|-----------|
| App UI | Pages, layouts, route groups, API routes | `app/` |
| Domain logic | Auth wiring, env validation, feature flags, permissions | `lib/` |
| API server | tRPC context, procedures, and routers | `server/` |
| Data model | Prisma schema and generated client | `prisma/` |
| Edge gate | Fast optimistic protection for dashboard routes | `proxy.ts` |

---

## Request and auth flow

1. User requests a protected route under `/dashboard/*`.
2. `proxy.ts` checks for a session cookie:
   - missing cookie -> redirect to `/sign-in?callbackUrl=...`
   - cookie present -> continue
3. `app/dashboard/layout.tsx` performs authoritative server session validation:
   - invalid/expired session -> redirect to `/auth?callbackUrl=/dashboard`
   - valid session -> render dashboard routes
4. Auth UI (`/auth`) sanitizes `callbackUrl` and completes sign-in/sign-up flows.

---

## Feature-flag model

- Server source of truth: `lib/features.ts`
- Public client shape: `app/api/features/route.ts`
- Client helper/cache: `lib/feature-flags-client.ts`

Flags are env-driven and hide/show optional UI paths without code changes.

---

## Billing and Stripe flow

1. Plan definitions live in `lib/plans.ts`.
2. `bun stripe:sync` syncs plans and regenerates `lib/stripe-plans.generated.ts`.
3. Better Auth Stripe plugin in `lib/auth.ts` uses generated plan IDs.
4. Client billing UI calls Better Auth client subscription helpers in:
   - `app/pricing/page.tsx`
   - `app/dashboard/billing/page.tsx`
5. Stripe updates are processed via webhook/polling paths documented in `stripe.md`.

---

## API boundaries

- tRPC primitives and guards: `server/trpc.ts`
- Router composition: `server/root.ts`
- HTTP adapter route: `app/api/trpc/[trpc]/route.ts`

Use:

- `publicProcedure` for anonymous-safe calls
- `protectedProcedure` for auth-required calls
- `roleProcedure` / `permissionProcedure` for RBAC-gated operations

---

## Dashboard composition

- Shared shell/navigation/avatar: `app/dashboard/components/`
- Route pages:
  - `app/dashboard/page.tsx`
  - `app/dashboard/settings/page.tsx`
  - `app/dashboard/billing/page.tsx`

Keep layout/chrome concerns in shared components and page-specific logic in each route file.

---

## Extension guidelines

- Add new integrations behind feature flags first.
- Keep provider keys optional and env-gated.
- Put policy-sensitive actions behind server guards (tRPC procedures or server routes).
- Prefer additive docs updates whenever behavior changes.
