# 📚 Documentation

**Start here.** These docs are written for beginners. Follow the order below and you won’t get lost.

---

## One idea to remember

> **No env -> feature off.**  
> If you don’t set the environment variables for a feature (auth, Stripe, email, OAuth), that feature stays **disabled** and the UI hides it. No code changes needed to turn things on - just add keys to `.env`.

---

## Where to go

| If you want to… | Read this |
|-----------------|-----------|
| **Get the app running** | [Database](./database.md) -> [Environment variables](./env.md) |
| **Set up sign-in (magic link, Discord, Google, GitHub)** | [Auth](./auth.md) + [OAuth setup](./oauth.md) |
| **Add payments** | [Stripe](./stripe.md) |
| **Customize this template for your brand** | [Customization checklist](./customization.md) |
| **Change branding, add UI components** | [UI & styling](./ui.md) |
| **Deploy to production** | [Deploying](./deploying.md) |
| **Fix common setup/runtime issues** | [Troubleshooting](./troubleshooting.md) |
| **Disable or customize template options (passkeys, RBAC, Stripe)** | [Optional integrations](./optional.md#template-included-optional-features) |
| **Explore add-on integrations (analytics, monitoring, i18n)** | [Optional integrations](./optional.md) |
| **Understand test coverage and next test steps** | [Testing](./testing.md) |
| **Find a file or command** | [Codebase map](./codebase.md) - “Where is X?” |

---

## Recommended order (first time)

1. **[database.md](./database.md)** - Get Postgres (local or hosted), then run `db:generate` and `db:push`.
2. **[env.md](./env.md)** - Create `.env`, add the three core variables, then add any optional ones (email, OAuth, Stripe).
3. **[auth.md](./auth.md)** - How auth works, routes, feature flags, and key files.
4. **[oauth.md](./oauth.md)** - Step-by-step: Discord, Google, GitHub redirect URLs (so you don’t get “redirect_uri mismatch”).
5. **[stripe.md](./stripe.md)** - Stripe keys, local dev with `bun stripe:poll`, webhooks, and plans.
6. **[customization.md](./customization.md)** - Replace template branding, links, and placeholder copy.
7. **[ui.md](./ui.md)** - Tailwind, branding, sitemap, and optional component libraries.
8. **[deploying.md](./deploying.md)** - Docker, Vercel, Railway, health checks, and the GitHub Actions -> Dokploy workflow.
9. **[troubleshooting.md](./troubleshooting.md)** - Fast answers for startup/env/OAuth/Stripe issues.
10. **[optional.md](./optional.md)** - Monitoring, analytics, and i18n integration options.
11. **[testing.md](./testing.md)** - What template tests cover and what to add next.

---

## Quick links

| What | Where |
|------|--------|
| Main project README | [../README.md](../README.md) |
| **“Where is X?”** | [codebase.md](./codebase.md) |
| Prisma schema | `prisma/schema.prisma` |
| Auth config | `lib/auth.ts` |
| Env validation | `lib/env.ts` |
| Feature flags | `lib/features.ts` + `/api/features` |

---

*If something breaks, open [troubleshooting.md](./troubleshooting.md).*

*Need implementation pointers? Open [codebase.md](./codebase.md) and search for the feature you’re looking for.*
