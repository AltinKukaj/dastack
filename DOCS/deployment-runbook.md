# Deployment Runbook

Use this as the operational checklist for production deploys.

---

## Pre-deploy checklist

- `bun run check` passes locally or in CI
- required env vars are set in target environment
- database migration strategy chosen (`db:migrate:deploy` preferred for production)
- OAuth callback URLs match production domain
- Stripe webhook endpoint and secret are configured (if billing enabled)

---

## Environment readiness

Minimum required vars:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`

Optional vars are feature-dependent; see `env.md`.

---

## Migration strategy

Preferred in production:

```bash
bun db:migrate:deploy
```

For prototype environments only (no migration history):

```bash
bun db:push
```

Do not switch between strategies casually across environments.

---

## Deploy steps (default GHCR + Dokploy path)

1. Merge to tracked deploy branch.
2. Confirm CI workflow success (`.github/workflows/ci.yml`).
3. Confirm deploy workflow success (`.github/workflows/deploy.yml`).
4. Verify application rollout completed in host platform.
5. Run post-deploy smoke checks.

---

## Post-deploy smoke checks

- `GET /api/health` returns `status: "ok"`
- `/auth` renders and accepts sign-in
- `/dashboard` loads for authenticated user
- `/api/features` reflects expected env-enabled options
- `/pricing` and `/dashboard/billing` behave correctly when Stripe is enabled

---

## Rollback guidance

If deploy is unhealthy:

1. Roll back to previous known-good image/release in host platform.
2. Re-run smoke checks.
3. Verify database compatibility with rolled-back app version.
4. Open incident notes with root cause and remediation plan.

---

## Incident quick actions

- **Auth failures:** verify `BETTER_AUTH_URL` and `BETTER_AUTH_SECRET`
- **OAuth errors:** verify provider redirect URLs
- **Billing errors:** verify Stripe webhook secret and event delivery
- **Health checks down:** verify DB connectivity and app env boot state

See `troubleshooting.md` for deeper diagnostics.
