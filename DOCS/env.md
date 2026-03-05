# Environment Variables (`.env`)

What to put in `.env` and where to get each key. Start with the core three; add the rest when you need them.

---

## TL;DR

- Copy **`.env.example`** -> **`.env`** in the project root.
- **Core (auth on):** `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.
- **Optional:** Add Resend, OAuth, or Stripe keys when you want those features.
- Keep `.env` local only. Never commit it.

---

## 1. Create your `.env`

Use the template file:

```bash
cp .env.example .env
```

Minimal core setup to enable auth:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB?schema=public
BETTER_AUTH_SECRET=paste_output_of_openssl_rand_below
BETTER_AUTH_URL=http://localhost:3000
```

Generate a secret (see below) and replace `paste_output_of_openssl_rand_below`.

For Windows PowerShell, copy manually:

```powershell
Copy-Item .env.example .env
```

---

## 2. Core variables (turns auth on)

Auth is enabled only when **all three** are set:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB?schema=public
BETTER_AUTH_SECRET=your_long_random_string
BETTER_AUTH_URL=http://localhost:3000
```

| Variable | What to do |
|----------|------------|
| **`DATABASE_URL`** | Your PostgreSQL connection string. See [database.md](./database.md). |
| **`BETTER_AUTH_SECRET`** | Used to sign sessions. Generate one: `openssl rand -base64 32` |
| **`BETTER_AUTH_URL`** | Dev: `http://localhost:3000` · Prod: `https://create.dagrate.xyz` |

---

## 3. Optional variables (turn features on)

### Email (Resend)

**Get the key:** [resend.com](https://resend.com) -> Sign up -> **API Keys** -> **Create API Key** -> copy.

```env
RESEND_API_KEY=re_...
# optional - defaults to onboarding@resend.dev in dev
EMAIL_FROM=Your App <noreply@create.dagrate.xyz>
```

**Dev:** Resend’s test domain (`onboarding@resend.dev`) can only deliver to the email you signed up with. No domain setup needed.

**Production:** In Resend Dashboard -> **Domains** -> add your domain and DNS records, then set `EMAIL_FROM=Your App <noreply@create.dagrate.xyz>`.

**Other providers:** You can swap Resend for another service by editing `lib/email.ts`. Better Auth only needs `sendMagicLink({ email, url }) -> Promise<void>`. Options: [Plunk](https://useplunk.com), [Postmark](https://postmarkapp.com), [SendGrid](https://sendgrid.com), [AWS SES](https://aws.amazon.com/ses/), [Mailgun](https://www.mailgun.com).

---

### OAuth (Discord, Google, GitHub)

Callback URL pattern:

```
{BETTER_AUTH_URL}/api/auth/callback/{provider}
```

Examples:  
`http://localhost:3000/api/auth/callback/discord` · same for `google` and `github`.

```env
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

Step-by-step: [oauth.md](./oauth.md).

---

### Passkeys (WebAuthn)

Passkeys are **on** when auth is enabled. No extra env vars are required to enable them.

To **disable** passkeys (no passkey sign-in or passkey management in Settings):

```env
DISABLE_PASSKEY=true
```

See [Optional integrations](./optional.md#passkeys-webauthn) for details.

---

### Stripe

```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

Full setup: [stripe.md](./stripe.md).

---

### Optional app URL (client-safe)

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Used by client-side helpers/metadata where a public base URL is needed.

---

## 4. “Why is my app crashing on startup?”

This project validates env vars at **build/dev time** (`lib/env.ts`). Invalid or missing required vars can make the dev server fail early.

**Bypass in CI/Docker** (when `.env` isn’t available):

```bash
SKIP_ENV_VALIDATION=1 bun run build
```

---

## 5. Keep secrets out of git

- **Never** commit `.env`.
- This template already ignores `.env*` and keeps `.env.example` tracked.
- Build artifacts under `.next/` are ignored too, including copied `.env` files from standalone output.
- In production, set variables in your host’s UI (Vercel, Railway, Fly, Dokploy, etc.).

---

## Need help debugging env issues?

If startup fails, OAuth callbacks mismatch, emails fail, or Stripe appears stuck, use:

- [troubleshooting.md](./troubleshooting.md)

---

## 6. Complete variable reference

| Variable | Required | Enables / used by |
|----------|----------|-------------------|
| `DATABASE_URL` | Required for auth mode | Prisma + Better Auth DB connection |
| `BETTER_AUTH_SECRET` | Required for auth mode | Session signing and auth security |
| `BETTER_AUTH_URL` | Required for auth mode | Auth callbacks, webhook URLs, absolute app URL |
| `NEXT_PUBLIC_APP_URL` | Optional | Client-side base URL fallback |
| `RESEND_API_KEY` | Optional | Magic link + verification + password reset emails |
| `EMAIL_FROM` | Optional | Sender identity for auth emails |
| `DISCORD_CLIENT_ID` | Optional | Discord OAuth button + callback flow |
| `DISCORD_CLIENT_SECRET` | Optional | Discord OAuth button + callback flow |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth button + callback flow |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth button + callback flow |
| `GITHUB_CLIENT_ID` | Optional | GitHub OAuth button + callback flow |
| `GITHUB_CLIENT_SECRET` | Optional | GitHub OAuth button + callback flow |
| `DISABLE_PASSKEY` | Optional | Set to `true` to disable passkeys (default: passkeys on when auth is on) |
| `STRIPE_SECRET_KEY` | Optional | Stripe subscriptions and billing APIs |
| `STRIPE_WEBHOOK_SECRET` | Optional | Stripe webhook verification |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional | Stripe client checkout flows |
