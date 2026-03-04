# Authentication

Everything you need to get sign-in and sign-up working. Auth is **optional**: set the three core env vars and it turns on.

---

## TL;DR

| Goal | Do this |
|------|--------|
| Turn auth on | Set `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` in `.env` |
| Run the app | `bun db:generate` -> `bun db:push` -> `bun dev` |
| Sign-in page | Visit **`/auth`** (or `/sign-in` / `/sign-up` - they redirect there) |

---

## Quick start

Create a `.env` file and set these **three** variables:

| Variable | What it is |
|----------|------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Session signing key (run `openssl rand -base64 32` to generate) |
| `BETTER_AUTH_URL` | App base URL, e.g. `http://localhost:3000` |

Then run:

```bash
bun db:generate
bun db:push
bun dev
```

Open **`/auth`** for sign-in / sign-up.

---

## Optional features (env vars)

Turn these on by adding the right variables. The UI shows or hides options automatically.

| Feature | Env vars |
|---------|----------|
| Email (magic link, verification, password reset) | `RESEND_API_KEY`, optional `EMAIL_FROM` |
| Discord OAuth | `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| GitHub OAuth | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |
| Passkeys (WebAuthn) | On when auth is on. Set `DISABLE_PASSKEY=true` to turn off. See [Optional](./optional.md#passkeys-webauthn). |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Captcha (Turnstile) | `CAPTCHA_SECRET_KEY`, `NEXT_PUBLIC_CAPTCHA_SITE_KEY` |

When captcha is enabled, auth requires a valid token for email/password sign-in, email sign-up, magic-link sign-in, and passkey sign-in.
On localhost, captcha is disabled by default unless `ENABLE_CAPTCHA_ON_LOCALHOST=true`.

**OAuth callback URL** (when registering your app with Discord/Google/GitHub):

```
{BETTER_AUTH_URL}/api/auth/callback/{provider}
```

Example: `http://localhost:3000/api/auth/callback/github`

> First time setting up OAuth? Use [oauth.md](./oauth.md) - it has the exact steps and redirect URLs so you don’t get “redirect_uri mismatch”.

---

## Feature flags

Defined in **`lib/features.ts`**, exposed at **`/api/features`**.

- **Server:** `import { getFeatureFlags } from "@/lib/features"`
- **Client:** `fetch("/api/features")` -> `{ auth, email, passkey, providers: { discord, google, github }, stripe, captcha }`

All optional features require `auth` to be `true`. The UI reads these flags and only shows buttons/links for enabled features.

---

## Routes

| Route | Purpose |
|-------|---------|
| `/auth` | Sign-in / sign-up (use `?tab=sign-up`, `?callbackUrl=/dashboard`) |
| `/sign-in`, `/sign-up` | Redirect to `/auth` |
| `/forgot-password`, `/reset-password?token=...` | Password reset |
| `/dashboard/*` | Protected - no session -> redirect to sign-in, then `/auth` |

`callbackUrl` is sanitized to local relative paths (must start with `/`) to prevent open redirects.

**How protection works**

1. **`proxy.ts`** - Runs first; redirects unauthenticated `/dashboard/*` requests to `/sign-in` (which then sends users to `/auth`).
2. **`app/dashboard/layout.tsx`** - Does the real session check; redirects to `/auth` if there’s no valid session.

The layout is the source of truth; the proxy is a fast first gate.

---

## Destructive actions (template warning)

Once auth + database are configured, these actions are live and affect real user data:

- **Delete account** (`app/dashboard/settings/page.tsx`) permanently removes the signed-in user.
- **Revoke session** / **Revoke all others** (`app/dashboard/settings/page.tsx`) signs devices out immediately.
- **Change password with revoke** (`app/dashboard/settings/page.tsx`) revokes other sessions.
- **Cancel subscription** (`app/dashboard/billing/page.tsx`) requests cancellation in Stripe/Better Auth.

These are protected by authenticated user context in Better Auth/Stripe flows, but template users should still:

1. Keep these controls behind authenticated dashboard routes only.
2. Keep confirmation prompts (or add stronger server-side confirmations for high-risk apps).
3. Test with disposable accounts before going live.

---

## Database

Schema: **`prisma/schema.prisma`**. Core models: `User`, `Session`, `Account`, `Verification`. Plugins add `TwoFactor` (2FA), `Subscription` (Stripe). After changing the schema:

```bash
bun db:generate
bun db:push
```

---

## API (tRPC)

- **Context** in `server/trpc.ts` includes `session` from `auth.api.getSession()`.
- Use **`protectedProcedure`** for auth-required routes; it throws `UNAUTHORIZED` when there’s no session.

**Where to add your API logic:** Define procedures in **`server/routers/`** (e.g. `example.ts`), merge them in **`server/root.ts`**, and call them from the client. Full file map: [codebase.md](./codebase.md).

---

## Key files

| Area | Files |
|------|--------|
| Auth config | `lib/auth.ts`, `lib/auth-client.ts`, `lib/features.ts`, `lib/permissions.ts` |
| Route protection | `proxy.ts`, `app/dashboard/layout.tsx` |
| Email templates | `lib/email.ts` |
| Auth UI | `app/(auth)/auth/page.tsx`, `app/(auth)/components/sign-in-form.tsx`, `sign-up-form.tsx` |
| API | `app/api/auth/[...all]/route.ts`, `app/api/features/route.ts` |
| Dashboard | `app/dashboard/layout.tsx`, `app/dashboard/settings/page.tsx` (profile, 2FA, sessions) |

---

## Customization

- **App name:** Replace `"dastack"` in `lib/email.ts`, `app/layout.tsx`, and `app/page.tsx`.
- **New OAuth provider:** Add env vars -> add flag in `lib/features.ts` and in `app/api/features/route.ts` -> add provider in `lib/auth.ts` -> add button in sign-in/sign-up forms.
- **Roles/permissions:** Edit role definitions and permission helpers in `lib/permissions.ts`; use `roleProcedure` / `permissionProcedure` in `server/trpc.ts`. To use only default admin/user (no custom RBAC), see [Optional](./optional.md#custom-roles-and-permissions-rbac).
- **Different database:** Change `prisma/schema.prisma` datasource, adapter in `lib/auth.ts`, and `lib/db.ts`; set `DATABASE_URL` to match.
- **Disable a plugin:** Remove it from `lib/auth.ts` and `lib/auth-client.ts`, remove related Prisma fields, then `bun db:generate` and `bun db:push`.
