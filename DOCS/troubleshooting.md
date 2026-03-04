# Troubleshooting

Quick fixes for the most common setup and deployment issues.

---

## App crashes on startup

This template validates env vars in `lib/env.ts`. Missing or invalid required values can fail startup early.

**Checklist:**

- Confirm core auth values: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.
- Validate URLs are real URLs (including protocol), not placeholders.
- Re-check optional integrations for empty-string values.

**Bypass env validation in CI/Docker builds:**

```bash
SKIP_ENV_VALIDATION=1 bun run build
```

More details: [env.md](./env.md)

---

## OAuth `redirect_uri mismatch`

This usually means your provider dashboard URL does not exactly match your app callback URL.

**Callback pattern:**

```txt
{BETTER_AUTH_URL}/api/auth/callback/{provider}
```

**Checklist:**

- `BETTER_AUTH_URL` is correct for the current environment.
- Provider callback uses matching `http` vs `https`.
- No trailing slash and correct port.
- Provider and app environment (dev vs prod) match.

Setup guide: [oauth.md](./oauth.md)

---

## Magic link or auth emails not sending

If email sign-in or password reset emails do not arrive:

**Checklist:**

- `RESEND_API_KEY` is set and valid.
- `EMAIL_FROM` uses a verified sender for production.
- In Resend sandbox mode, emails only deliver to your account email.
- For production delivery, verify your domain in Resend first.

Env details: [env.md](./env.md)

---

## Stripe webhook errors or subscriptions stuck as `incomplete`

**Checklist:**

- Webhook endpoint is `{BETTER_AUTH_URL}/api/auth/stripe/webhook`.
- `STRIPE_WEBHOOK_SECRET` matches the endpoint signing secret.
- `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are both set.
- For local dev, run `bun stripe:poll` in a second terminal while `bun dev` is running.

Full guide: [stripe.md](./stripe.md)

---

## Dashboard not accessible

If `/dashboard` redirects away or appears blocked:

**Checklist:**

- Core auth env vars are all set (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`).
- Auth feature flag is enabled (`/api/features` -> `auth: true`).
- Proxy/layout protections are expected for signed-out users (`proxy.ts`, dashboard layout).
- Optional feature flags (like Stripe) may hide billing sections if not configured.

Related docs: [auth.md](./auth.md), [env.md](./env.md)
