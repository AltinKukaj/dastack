# Prerequisites

Use this page before setup so your local environment matches template expectations.

---

## Required software

| Tool | Recommended | Notes |
|------|-------------|-------|
| Bun | `1.3.x` | Primary runtime/package manager for scripts in this repo |
| Node.js | `20+` | Optional fallback if you use `npm`/`pnpm` commands |
| PostgreSQL | `14+` | Required for auth/session/account data |
| Git | latest | Required for cloning and updating |

---

## Required app config

At minimum, auth and dashboard flows require:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`

Create `.env` from `.env.example`, then follow [env.md](./env.md).

---

## Optional provider accounts

You only need these if you enable the related feature:

- **Resend** for magic link / verification / password reset emails
- **Discord, Google, GitHub** for OAuth sign-in
- **Stripe** for pricing + billing

---

## OS notes

- **Windows (PowerShell):**
  - Install Bun: `powershell -c "irm bun.sh/install.ps1|iex"`
  - Copy env template: `Copy-Item .env.example .env`
- **macOS/Linux:**
  - Install Bun from [bun.sh/docs/installation](https://bun.sh/docs/installation)
  - Copy env template: `cp .env.example .env`

---

## Verify your toolchain

```bash
bun --version
node --version
psql --version
```

Then run the project checks:

```bash
bun install
bun run check
```

If checks pass, continue with [onboarding.md](./onboarding.md).
