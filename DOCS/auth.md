# Auth

---

## TL;DR

| Goal | Do this |
|------|--------|
| **Turn auth on** | Set `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` in `.env` |
| **Sign-in page** | Visit **`/login`** (or `/signup`) |

---

Auth is handled by [Better Auth](https://www.better-auth.com/) and is configured in `lib/auth.ts` and exposed via `app/api/auth/[...all]/route.ts`.

The template’s Better Auth setup enables:

- email/password auth
- email verification
- password reset
- magic links
- email OTP for verification and recovery
- passkeys
- TOTP-based 2FA
- email OTP 2FA fallback
- backup codes
- Google OAuth
- GitHub OAuth
- Discord OAuth
- guest sessions
- username support
- admin plugin
- organization plugin when enabled
- Stripe subscription plugin when Stripe is configured
- haveibeenpwned password checks
- last-login-method tracking

## Main files

| File | Responsibility |
| --- | --- |
| `lib/auth.ts` | server-side Better Auth configuration and plugin wiring |
| `lib/auth-client.ts` | client-side Better Auth SDK with matching plugins |
| `lib/auth-server.ts` | `getSession`, `requireAuth`, and `requireAdmin` helpers for Server Components |
| `app/api/auth/[...all]/route.ts` | Better Auth route handler plus request rate limiting |
| `app/login/auth-page.tsx` | main sign-in/sign-up/recovery UI |
| `app/dashboard/settings/*` | profile, security, passkeys, sessions, files, and danger-zone screens |

## How the request flow works

1. The browser talks to Better Auth through `/api/auth/...`.
2. `app/api/auth/[...all]/route.ts` applies per-flow rate limiting before passing the request to Better Auth.
3. Better Auth uses the Prisma adapter and stores data in PostgreSQL.
4. Session access in server code goes through `auth.api.getSession(...)`.
5. Protected pages use `requireAuth()` or `requireAdmin()`.

## Email behavior

`lib/auth.ts` does not send raw provider emails directly.

Instead it calls template helpers from `lib/email.ts` for:

- email verification
- password reset
- magic links
- email OTP
- 2FA OTP
- change-email confirmation
- account deletion confirmation
- organization invitations
- "existing user tried to sign up again" notices

This is why swapping away from Resend is easy: auth only depends on the shared email helper.

## Social providers

Google, GitHub, and Discord are only added when both client credentials exist.

If the keys are missing:

- the provider is not registered in Better Auth
- the button does not show on the login page

## Organizations

Organizations are disabled unless `ENABLE_ORGANIZATIONS` is truthy.

When enabled:

- the Better Auth organization plugin is added
- the dashboard exposes the organization screen
- invitation emails are sent through `lib/email.ts`
- extra org read helpers are available through `server/api/routers/organizations.ts`

Write actions such as creating an org or inviting members mostly go through Better Auth's client API from the UI. The tRPC router mainly fills gaps for richer reads and cache invalidation.

## Admin

The admin plugin is always loaded in Better Auth, but the admin UI and admin tRPC procedures are hidden behind `ENABLE_ADMIN_PANEL`.

That means:

- admin-only procedures return `NOT_FOUND` if the flag is off
- `/admin` only makes sense when the flag is on and the current user has role `admin`

## Rate limiting

`app/api/auth/[...all]/route.ts` maps auth endpoints into scopes such as:

- `auth:signin`
- `auth:signup`
- `auth:password-reset`
- `auth:magic-link`
- `auth:otp`

Rate limiting uses Redis when available and falls back to an in-process store when Redis is off or unavailable.

## Customization points

If you want to trim auth features, these are the places to touch first:

- remove the plugin from `lib/auth.ts`
- remove the matching client plugin from `lib/auth-client.ts`
- remove the related UI from `app/login/auth-page.tsx` or settings pages
- remove the unused tables from `prisma/schema.prisma` if you want a smaller schema

Examples:

- remove social login: delete the provider credentials and remove the social buttons
- remove passkeys: remove the passkey plugin, client plugin, and passkeys settings page
- remove organizations: leave `ENABLE_ORGANIZATIONS` unset or remove the org code entirely

## Important implementation details

- Email/password sign-up requires email verification.
- Email OTP sign-up is disabled. OTP is used for verification and recovery, not as a public sign-up method.
- Passkeys use `BETTER_AUTH_URL` for both the origin and RP ID hostname.
- Sessions are stored in the database, not in-memory.

---

## Destructive actions (template warning)

Once auth + database are configured, these actions are live and affect real user data:

- **Delete account** permanently removes the signed-in user.
- **Revoke session** / **Revoke all others** signs devices out immediately.
- **Change password with revoke** revokes other sessions.

These are protected by authenticated user context in Better Auth flows, but template users should still:

1. Keep these controls behind authenticated dashboard routes only.
2. Keep confirmation prompts (or add stronger server-side confirmations for high-risk apps).
3. Test with disposable accounts before going live.
