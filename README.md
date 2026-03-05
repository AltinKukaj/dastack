# dastack

An opinionated, production-ready Next.js template starter. Clone it, wire up your own providers, and build your own product.

---

## 📚 Documentation

**All setup and feature guides live in [DOCS/](./DOCS/).** Start there so you don’t get lost.

| I want to… | Go to |
|------------|--------|
| Validate local requirements first | [DOCS/prerequisites.md](./DOCS/prerequisites.md) |
| Get running | [DOCS/database.md](./DOCS/database.md) -> [DOCS/env.md](./DOCS/env.md) |
| Validate first-time setup quickly | [DOCS/onboarding.md](./DOCS/onboarding.md) |
| Understand architecture quickly | [DOCS/architecture.md](./DOCS/architecture.md) |
| Set up auth & OAuth | [DOCS/auth.md](./DOCS/auth.md) -> [DOCS/oauth.md](./DOCS/oauth.md) |
| Add Stripe | [DOCS/stripe.md](./DOCS/stripe.md) |
| Customize branding/placeholders | [DOCS/customization.md](./DOCS/customization.md) |
| Deploy (Docker + Dokploy default) | [DOCS/deploying.md](./DOCS/deploying.md) |
| Follow production deploy runbook | [DOCS/deployment-runbook.md](./DOCS/deployment-runbook.md) |
| Fix common setup/runtime issues | [DOCS/troubleshooting.md](./DOCS/troubleshooting.md) |
| Explore optional integrations | [DOCS/optional.md](./DOCS/optional.md) |
| Find a file or command | [DOCS/codebase.md](./DOCS/codebase.md) |

**[DOCS/README.md](./DOCS/README.md)** - full index and recommended reading order.

---

## Stack

| Layer | Tech |
|-------|------|
| **Runtime** | [Bun](https://bun.sh) |
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) |
| **React** | 19 |
| **Database** | PostgreSQL |
| **ORM** | [Prisma 7](https://prisma.io) + `@prisma/adapter-pg` |
| **Auth** | [Better Auth](https://www.better-auth.com) - passkeys · magic link · Discord · Google · GitHub |
| **Auth plugins** | Admin (custom roles) · Passkey · Stripe · i18n · Have I Been Pwned |
| **Email** | [Resend](https://resend.com) (default, swappable) |
| **API** | [tRPC](https://trpc.io) + [TanStack Query](https://tanstack.com/query) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com) |
| **Validation** | [Zod](https://zod.dev) |
| **Env** | [@t3-oss/env-nextjs](https://env.t3.gg) - build-time validation |
| **Lint** | [Biome](https://biomejs.dev) |
| **Deploy** | Docker, Vercel, Railway, Fly.io, Dokploy - your choice |

---

## Template intent

This repository is a **starter template**, not a finished SaaS product.

- Keep the architecture and primitives (auth, billing, API, dashboard shell).
- Replace branding, copy, links, legal pages, and pricing for your project.
- Use [DOCS/customization.md](./DOCS/customization.md) for a release-ready checklist.

---

## Who is this for?

- **Indie makers** who want a solid auth + billing + dashboard baseline.
- **Agencies/freelancers** shipping client apps quickly with room to customize.
- **Startups** that need a pragmatic v1 foundation, not a locked framework.
- **Hobby projects** that may begin landing-only and grow into full product flows.

---

## Feature toggles (env only)

Optional integrations are **off by default**. Add the right env vars and the UI turns them on - no code changes.

| Feature | Env vars | What appears |
|---------|----------|--------------|
| Magic link email | `RESEND_API_KEY` | Email sign-in on `/auth` |
| Discord OAuth | `DISCORD_CLIENT_ID` + `DISCORD_CLIENT_SECRET` | Discord button |
| Google OAuth | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Google button |
| GitHub OAuth | `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` | GitHub button |
| Passkeys (WebAuthn) | none (enabled with core auth) | Passkey sign-in and passkey management |
| Stripe | `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Pricing page, billing in dashboard |

`/api/features` exposes boolean flags (no secrets) so the client knows what to render. See [DOCS/env.md](./DOCS/env.md) and [DOCS/auth.md](./DOCS/auth.md).

---

## Usage modes

Choose the mode that matches your project:

- **SaaS mode (auth + Stripe):** set core auth env + Stripe env; use `/pricing` and `/dashboard/billing`.
- **Auth-only mode:** set only core auth env; Stripe UI auto-hides.
- **Landing/portfolio mode:** leave auth env unset; marketing pages still work while protected app areas stay off.

---

## What can I strip out?

- **Auth-only:** set only `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`; leave Stripe vars unset so pricing/billing stays hidden.
- **Landing-only:** leave core auth vars unset and use only marketing/public routes.
- **Stripe-free:** remove pricing/billing links and uninstall Stripe-related deps/scripts if your product does not need subscriptions.

Detailed customization steps: [DOCS/customization.md](./DOCS/customization.md)

---

## Quick start

**Install Bun** (if needed):

- **Windows (PowerShell):** `powershell -c "irm bun.sh/install.ps1|iex"`
- **Mac/Linux:** [bun.sh/docs/installation](https://bun.sh/docs/installation)

**Then:**

```bash
git clone https://github.com/AltinKukaj/dastack.git
cd dastack

bun install
# Add .env (see DOCS/env.md) with DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL

bun db:generate
bun db:push
bun dev
```

Open [http://localhost:3000](http://localhost:3000). Sign-in is at **`/auth`** (or `/sign-in` / `/sign-up`).

**Runtime note:** scripts are written for Bun, but `npm run` or `pnpm` equivalents work if you have a compatible Node runtime installed.

---

## Project structure (high level)

```
app/              # Next.js App Router (pages, api, layout)
lib/              # Auth, db, env, email, tRPC client
server/           # tRPC routers and context
prisma/           # Schema
proxy.ts          # Route protection (dashboard)
scripts/          # stripe:sync, stripe:poll
DOCS/             # All documentation - start there
```

Full map of features -> files: **[DOCS/codebase.md](./DOCS/codebase.md)**.

---

## Optional integrations

Need monitoring, analytics, or i18n guidance without adding defaults to the template?

- [DOCS/optional.md](./DOCS/optional.md)

---

## Testing

Template tests are intentionally minimal and serve as examples.

- Included coverage and test philosophy: [DOCS/testing.md](./DOCS/testing.md)
- You should still add project-specific unit tests and end-to-end coverage for your own domain flows.

---

## Contributing & Security

- Contribution guide: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Security policy: [SECURITY.md](./SECURITY.md)

---

## License

MIT

---

Made by [dagrate](https://github.com/AltinKukaj)
