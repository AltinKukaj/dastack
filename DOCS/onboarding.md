# Onboarding Checklist (First 30 Minutes)

Use this runbook to get from clone to a validated local setup quickly.

---

## 1) Install and bootstrap

```bash
bun install
cp .env.example .env
```

Fill in `.env` with at least:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL=http://localhost:3000`

Then run:

```bash
bun db:generate
bun db:push
bun dev
```

---

## 2) Validate core app behavior

With dev server running, verify:

- `GET /api/health` returns JSON with `status: "ok"`
- `GET /api/features` returns booleans and provider flags
- `/auth` loads sign-in/sign-up UI
- `/dashboard` redirects to auth when signed out
- sign-up + sign-in succeed once auth env is configured

---

## 3) Validate optional modes

### Auth-only mode

- Keep only core auth env vars set
- Confirm billing links are hidden
- Confirm `/dashboard/billing` shows Stripe-not-configured state

### SaaS mode (Stripe enabled)

- Set Stripe env vars
- Run `bun stripe:sync`
- Visit `/pricing` and complete checkout flow
- For local webhook fallback, run `bun stripe:poll`

### Landing-only mode

- Remove core auth env vars
- Confirm public pages render
- Confirm protected routes redirect away

---

## 4) Run quality checks before customization

```bash
bun run check
```

If this passes, move to:

- [customization.md](./customization.md) for branding and placeholders
- [deploying.md](./deploying.md) for deployment paths

---

## 5) Common first-run issues

- **Auth appears disabled:** one of the 3 core auth env vars is missing
- **OAuth redirect mismatch:** provider callback URL does not match `BETTER_AUTH_URL`
- **Stripe incomplete state:** webhook not connected; use `bun stripe:poll` locally
- **Captcha missing:** allow `challenges.cloudflare.com` in browser privacy/ad blockers

More fixes: [troubleshooting.md](./troubleshooting.md)
