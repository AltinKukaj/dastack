# Optional Integrations

This template keeps the core stack lean. Add integrations only when your project needs them.

---

## Template-included optional features

These features ship in the template but are **optional**: you can turn them off or simplify them without breaking the app.

### Passkeys (WebAuthn)

| What | Details |
|------|--------|
| **Default** | Passkeys are **on** when auth is enabled (sign-in with passkey, add/manage passkeys in Settings). |
| **Disable** | Set `DISABLE_PASSKEY=true` in `.env`. The server will not register passkey routes; `/api/features` returns `passkey: false` and the UI hides passkey sign-in and passkey management. |
| **Docs** | [Auth](./auth.md#optional-features-env-vars), [Env](./env.md#passkeys-webauthn) |
| **Files** | `lib/auth.ts` (passkey plugin), `lib/auth-client.ts` (passkeyClient), `lib/features.ts` (passkey flag), sign-in form + Settings passkey section, Prisma `Passkey` model |

If you disable passkeys, you can leave the `Passkey` table in the schema (it will simply be unused) or remove the model and run `bun db:push` if you want a minimal schema.

### Custom roles and permissions (RBAC)

| What | Details |
|------|--------|
| **Default** | The template uses **custom roles** (user, manager, support, billing, admin, owner) and granular permissions via Better Auth’s admin plugin and `lib/permissions.ts`. |
| **Use as-is** | Assign roles via your own admin flow or DB; use `roleProcedure` / `permissionProcedure` in tRPC and `hasRole` / `hasPermission` in UI. |
| **Simplify** | If you only need “user” and “admin”, you can revert to Better Auth’s default admin behaviour: in `lib/auth.ts` use `admin()` with no `ac`/`roles`; in `lib/auth-client.ts` use `adminClient()` with no `ac`/`roles`; remove or ignore `lib/permissions.ts`, `roleProcedure`, and `permissionProcedure`. See [Auth](./auth.md#customization). |
| **Docs** | [Auth](./auth.md), [Codebase](./codebase.md) (Roles and permissions) |
| **Files** | `lib/permissions.ts`, `server/trpc.ts` (roleProcedure, permissionProcedure), `server/routers/example.ts` (examples), dashboard Settings/Billing (role-aware UI) |

### Stripe plan IDs (generated file)

| What | Details |
|------|--------|
| **Default** | Stripe price IDs live in **`lib/stripe-plans.generated.ts`**, which is imported by `lib/auth.ts`. The sync script writes this file. |
| **Regenerate** | After editing `lib/plans.ts`, run `bun stripe:sync` to create/update products in Stripe and regenerate `lib/stripe-plans.generated.ts`. |
| **Optional** | You can edit `lib/stripe-plans.generated.ts` by hand instead of using the script. See [Stripe](./stripe.md). |

---

## Error monitoring (docs-only)

- **Sentry** - Follow the Next.js setup guide, add DSN env vars, and wrap server/client handlers as recommended.
- **Better Stack** - Add log/trace ingestion token and wire request/error logging in middleware and API handlers.
- **Logtail** - Add source token and forward structured logs from server routes and background scripts.

Any modern provider works. The main rule is to keep instrumentation centralized and opt-in.

---

## Analytics (docs-only)

- **Plausible** - Privacy-focused, lightweight, managed or self-hosted.
- **PostHog** - Product analytics + feature flags + session replay, managed or self-hosted.
- **Umami** - Minimal analytics, commonly self-hosted.
- **Vercel Web Analytics** - Quickest add-on for Vercel-hosted apps.

Trade-off reminder: managed services are faster to launch; self-hosted gives more data/control and infra ownership.

---

## i18n (docs-only for now)

No default i18n implementation ships in this template to avoid extra complexity in the baseline.

Options:

- Next.js i18n routing (App Router strategies)
- [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)
- [next-intl](https://next-intl.dev)
- Better Auth i18n plugin docs: [better-auth i18n](https://www.better-auth.com/docs/plugins/i18n)

Typical wiring points for translations:

- `app/layout.tsx` (locale setup, providers, metadata)
- `app/page.tsx` (landing copy)
- `app/(auth)/auth/page.tsx` and auth form components
- `app/dashboard/page.tsx` and dashboard sections

---

## Other optional ideas (no code by default)

- Extra OAuth providers (Microsoft, Apple, Slack, etc.)
- Queues/background jobs (BullMQ, Trigger.dev, Temporal)
- Search (Postgres FTS, Meilisearch, Algolia)
- Object storage (S3, R2, Supabase Storage)
- Audit logs and admin tooling
- Feature flag platforms and experimentation
