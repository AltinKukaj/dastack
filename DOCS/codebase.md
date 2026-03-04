# Where things live (codebase map)

Use this when you’re looking for a feature and don’t know which file to open. Every path and command below exists in the repo.

---

## Auth & protection

| What | Where |
|------|--------|
| Auth server config (providers, plugins, Stripe) | `lib/auth.ts` |
| Auth client (signIn, signOut, useSession, 2FA, subscription) | `lib/auth-client.ts` |
| Roles and permissions (RBAC + admin plugin roles; optional, see [optional.md](./optional.md#custom-roles-and-permissions-rbac)) | `lib/permissions.ts` |
| Feature flags (which features are on; passkey can be disabled via `DISABLE_PASSKEY`) | `lib/features.ts` |
| Auth API route (all `/api/auth/*`) | `app/api/auth/[...all]/route.ts` |
| Feature flags API | `app/api/features/route.ts` |
| Proxy (redirects unauthenticated `/dashboard/*` to sign-in) | `proxy.ts` |
| Dashboard layout (session check -> redirect to `/auth`) | `app/dashboard/layout.tsx` |
| Sign-in / sign-up page (unified) | `app/(auth)/auth/page.tsx` |
| Sign-in form, sign-up form, shared components | `app/(auth)/components/sign-in-form.tsx`, `sign-up-form.tsx`, `shared.tsx`, `icons.tsx` |
| Redirects `/sign-in` -> `/auth`, `/sign-up` -> `/auth` | `app/sign-in/page.tsx`, `app/sign-up/page.tsx` |
| Forgot / reset password | `app/forgot-password/page.tsx`, `app/reset-password/page.tsx` |
| Dashboard settings (profile, 2FA, sessions) | `app/dashboard/settings/page.tsx` |

---

## Database & API

| What | Where |
|------|--------|
| Prisma schema | `prisma/schema.prisma` |
| Prisma client (single instance) | `lib/db.ts` |
| **tRPC server** (path alias `@/server`) | `server/` - trpc setup, routers, root |
| tRPC context and procedures (public, protected) | `server/trpc.ts` |
| tRPC routers (add your procedures here) | `server/routers/` (e.g. `example.ts`) |
| Root router (combines all routers) | `server/root.ts` |
| tRPC HTTP route | `app/api/trpc/[trpc]/route.ts` |
| React Query + tRPC provider | `lib/trpc.tsx`, `app/providers.tsx` |

---

## Email

| What | Where |
|------|--------|
| Magic link, verification, password reset emails | `lib/email.ts` |
| Swap provider (e.g. Resend -> Plunk) | Edit `lib/email.ts` |

---

## Stripe

| What | Where |
|------|--------|
| Plan definitions (names, prices, features) | `lib/plans.ts` |
| Generated Stripe price IDs for auth plugin | `lib/stripe-plans.generated.ts` |
| Stripe plugin wiring | `lib/auth.ts` |
| Pricing page | `app/pricing/page.tsx` |
| Billing page | `app/dashboard/billing/page.tsx` |
| Sync plans to Stripe, generate auth price IDs | `scripts/sync-stripe.ts` -> `bun stripe:sync` |
| Poll for completed checkouts (local dev) | `scripts/poll-stripe.ts` -> `bun stripe:poll` |

---

## UI & layout

| What | Where |
|------|--------|
| Root layout (metadata, fonts) | `app/layout.tsx` |
| Global CSS (Tailwind) | `app/globals.css` |
| Home / landing | `app/page.tsx` |
| Dashboard shell and nav | `app/dashboard/layout.tsx`, `app/dashboard/page.tsx` |
| Legal pages | `app/terms/page.tsx`, `app/privacy/page.tsx` |
| 404 and error boundaries | `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx` |
| Favicon, icons, manifest | `app/favicon.ico`, `app/apple-icon.png`, `app/manifest.json` |

---

## SEO

| What | Where |
|------|--------|
| Sitemap | `app/sitemap.ts` -> `/sitemap.xml` |
| Robots.txt | `app/robots.ts` -> `/robots.txt` |

---

## Config & env

| What | Where |
|------|--------|
| Env validation | `lib/env.ts` |
| Next.js config | `next.config.ts` |
| Prisma config | `prisma.config.ts` |

---

## Scripts (package.json)

| Command | What it does |
|---------|----------------|
| `bun dev` | Start Next.js dev server |
| `bun build`, `bun start` | Production build and run |
| `bun db:generate` | Generate Prisma client |
| `bun db:push` | Apply schema (no migration files) |
| `bun db:migrate:dev` | Create and apply a migration |
| `bun db:migrate:deploy` | Apply migrations (e.g. production) |
| `bun db:studio` | Open Prisma Studio |
| `bun stripe:sync` | Push `lib/plans.ts` to Stripe, update `lib/auth.ts` |
| `bun stripe:poll` | Poll Stripe for completed checkouts (local dev) |
| `bun lint`, `bun type-check` | Lint and TypeScript check |
| `bun test` | Run tests in `__tests__/` (Bun; env schema + Prisma config smoke tests) |

---

## Tests

| What | Where |
|------|--------|
| Test runner | **Bun** (`bun test`) |
| Test files | `__tests__/` (e.g. `__tests__/smoke.test.ts`) |
| What’s covered | Env schema validation (Zod), Prisma config import - no DB or real env required |

The default smoke tests check that the same Zod patterns used in `lib/env.ts` accept/reject values correctly, and that `prisma.config.ts` can be loaded. You can add more tests in `__tests__/` and run them with `bun test`.
