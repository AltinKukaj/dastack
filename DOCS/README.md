# Documentation

This folder contains maintainer-facing documentation for the **Next.js Starter**. Use it when setting up, configuring, or customizing the template for your own product or when publishing a derivative as a public repo.

---

## One idea to remember

> **No env -> feature off.**  
> If you don’t set the environment variables for a feature (auth, Stripe, email, OAuth), that feature stays **disabled** and the UI hides it. No code changes needed to turn things on - just add keys to `.env`.

---

## Where to go

| If you want to… | Read this |
|-----------------|-----------|
| **Confirm local requirements and start the app** | [Setup](setup.md) |
| **Understand all env variables and feature flags** | [Environment variables](environment.md) |
| **Understand auth flows and providers** | [Auth](auth.md) |
| **Understand Stripe setup and usage** | [Billing](billing.md) |
| **Understand uploads and file storage** | [Uploads and storage](uploads.md) |
| **Understand system architecture and libraries** | [Architecture and libraries](architecture.md) |
| **Customize this template for your brand** | [Customization guide](customization.md) |

## Suggested reading order

1. **[Setup](setup.md)** - Prerequisites and local run instructions.
2. **[Environment variables](environment.md)** - Learn what env vars exist and which ones unlock optional features.
3. **[Auth](auth.md)** - How the authentication and user session flow works.
4. **[Billing](billing.md)** (if using Stripe) - How plan mapping and webhooks work.
5. **[Customization guide](customization.md)** - Branding, legal, and pre-publish checks.

---

## Quick links

| What | Where |
|------|--------|
| Main project README | [../README.md](../README.md) |
| Prisma schema | `prisma/schema.prisma` |
| Auth config | `lib/auth.ts` |
| Env validation | `lib/env.ts` |
| Feature flags | `lib/features.ts` + `/api/features` |
