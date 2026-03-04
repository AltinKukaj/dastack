# Deploying

This template ships with a production default: **GitHub Actions -> GHCR -> Dokploy** using the included Dockerfile.

If you do not use Dokploy, use the same Docker image on any host (VPS, Railway, Render, Fly, ECS, etc.).

---

## TL;DR

| Goal | Do this |
|------|--------|
| Set env in production | Same as [env.md](./env.md): at least `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` |
| Health check URL | Use `GET /api/health` (returns `{ status: "ok", db: "up" \| "down" }`) |
| Default path | Use `.github/workflows/deploy.yml` + GHCR + Dokploy secrets |
| Generic Docker host | `docker build -t your-app .` then `docker run -p 3000:3000 --env-file .env your-app` |
| Other platforms | Reuse the Docker image (or adapt to Vercel/serverless if preferred) |

---

## Before you deploy

**Required env vars (minimum):**

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL` (e.g. `https://create.dagrate.xyz`)

If you use Stripe, OAuth, or email, add those too. See [env.md](./env.md).

**Health checks:** configure your host to probe `GET /api/health` for liveness/readiness.

Common targets:

- Docker: `HEALTHCHECK` against `http://localhost:3000/api/health`
- Dokploy: health path `/api/health`
- Kubernetes: set both liveness and readiness probes to `/api/health`

**Migrations:** If you use them, run in production:

```bash
bun db:migrate:deploy
```

If you only use `db:push`, make sure the schema was applied (e.g. during build or a one-off step).

---

## Recommended default: GitHub Actions -> GHCR -> Dokploy

Workflow file: **`.github/workflows/deploy.yml`**

What it does on push to `main`/`master`:

1. Installs deps (`bun install`)
2. Runs quality checks (`bun run lint`, `bun run type-check`)
3. Builds and pushes Docker image to GHCR
4. Triggers Dokploy deploy (only when Dokploy secrets are set)

**GitHub Secrets** (required only for Dokploy auto-deploy):

- `DOKPLOY_URL`
- `DOKPLOY_API_KEY`
- `DOKPLOY_APPLICATION_ID`

If these secrets are missing, the workflow still builds/pushes the image and skips Dokploy trigger.

For pull requests and non-deploy quality checks, use **`.github/workflows/ci.yml`** (lint, type-check, tests, and build).

---

## Generic Docker host (alternative)

The included **Dockerfile** builds a Next.js **standalone** image (`output: "standalone"` in `next.config.ts`).

**Build and run:**

```bash
docker build -t your-app .
docker run -p 3000:3000 --env-file .env your-app
```

- Container runs as a **non-root** user.
- Prisma client is generated during build.

---

## Included workflow details (GHCR + Dokploy)

The workflow already lowercases `owner/repo` for GHCR image naming, caches Docker layers, and sets `SKIP_ENV_VALIDATION=1` where needed for CI.

Use this path if you want a repeatable template deployment with minimal setup drift across users.

---

## Other platforms (optional)

### Vercel (serverless)

1. Import the GitHub repo into Vercel.
2. Set env vars in **Project Settings** (same values as `.env`).
3. Build command: `bun run build` (or `next build` if you prefer npm/pnpm runtime).
4. Deploy and verify `https://your-domain/api/health`.

**Tips:**

- Use a **pooled** Postgres URL if your provider offers it (avoids connection limits).
- Set **`BETTER_AUTH_URL`** to your exact Vercel domain (e.g. `https://your-app.vercel.app`).

> If you only use Vercel, you can skip the Docker/GHCR/Dokploy path entirely.

---

## Railway / Render / Fly.io / Coolify

Each can use the **Dockerfile** in this repo:

- Connect the repo to the host
- Add the same environment variables
- Deploy
- Configure health checks to `GET /api/health`

### Railway quick path

- Runtime: Dockerfile from repo root
- Build command: handled by Dockerfile
- Start command: handled by Dockerfile (`next start`)
- Health check path: `/api/health`

| Provider | Notes |
|----------|--------|
| [Railway](https://railway.app) | Good DX, instant deploys |
| [Render](https://render.com) | Simple, free tier with sleep |
| [Fly.io](https://fly.io) | Edge, free tier |
| [Coolify](https://coolify.io) | Self-hosted, open source |

---

## Don’t forget OAuth in production

If you use Discord/Google/GitHub, add your **production** redirect URLs in each provider’s dashboard:

- `https://create.dagrate.xyz/api/auth/callback/discord`
- `https://create.dagrate.xyz/api/auth/callback/google`
- `https://create.dagrate.xyz/api/auth/callback/github`

See [oauth.md](./oauth.md).
