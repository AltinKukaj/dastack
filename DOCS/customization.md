# Customization Guide

This guide covers rebranding, legal pages, email, billing plans, trimming features, and a checklist for publishing the template (or a derivative) publicly. Use this checklist right after you fork/clone the template.

---

## 1. Rebrand the template

The template ships with placeholder **DaStack** branding. Replace it everywhere before publishing or launching.

### Files to update

| Location | What to change |
| --- | --- |
| `lib/config.ts` | `APP_NAME` (used in emails, auth prompts, meta) |
| `app/layout.tsx` | `metadata.title` uses `APP_NAME`; `appleWebApp.title` is hardcoded `"dastack"` — set to your app name |
| `app/manifest.ts` | `name`, `short_name` (currently `"dastack"`) |
| `package.json` | `name` (e.g. `"your-app"`) |
| `public/` | Replace `dastack.png` and any other placeholder images |
| `app/` | Replace `favicon.ico`, `icon0.svg`, `icon1.png`, `apple-icon.png` if you keep the same filenames, or update references in `app/layout.tsx` and `app/manifest.ts` |
| `.env.example` | `EMAIL_FROM`, `REDIS_KEY_PREFIX` (and any other app-named defaults) |
| `lib/env.ts` | Default for `REDIS_KEY_PREFIX` is `"dastack"` — change if you want a different default |
| `lib/logger.ts` | `service: "dastack"` in logger config |
| `lib/rate-limit.ts` | Comment reference to "DaStack" (optional) |
| `server/api/trpc.ts` | Comment reference to "DaStack" (optional) |
| `lib/auth.ts` | Log message that says "DaStack auth" (optional) |

After renaming, search the repo for `dastack` and `DaStack` to catch any remaining references.

---

## 2. Replace the legal placeholders

The routes exist; the content is not production-ready.

- **Terms** — `app/terms/page.tsx`
- **Privacy** — `app/privacy/page.tsx`

Replace the copy (and any shared component in `components/legal-placeholder-page.tsx`) before launch.

---

## 3. Switch email providers

Auth does not depend on Resend. It only uses:

- `sendEmail(...)`
- The email template helpers

To switch providers:

1. Change the implementation in `lib/email.ts`.
2. Keep the exported `sendEmail` signature the same.
3. Keep or replace the HTML template helpers.
4. Update `lib/env.ts` and `.env.example` with the new provider’s keys.

---

## 4. Change plans and limits

Edit `lib/plans.ts` for:

- Plan names and slugs
- Prices and descriptions
- Marketing copy and features list
- Highlighted plan and badge
- Usage limits (`limits.projects`, `limits.storage`, etc.)
- Trial days

Then run `pnpm stripe:sync` if Stripe is enabled. If you add new limit keys, update the app code that consumes usage and entitlements.

---

## 5. Trim features

### Option 1: Leave code in place, turn features off

Easiest approach: leave env unset so the UI hides the feature.

- Leave Stripe keys unset → billing hidden
- Leave `UPLOADTHING_TOKEN` unset → files pages 404
- Leave `ENABLE_ORGANIZATIONS` unset → org UI hidden
- Leave `ENABLE_ADMIN_PANEL` unset → admin disabled
- Leave Redis disabled → in-memory/no-op cache and rate limiting

### Option 2: Remove the feature entirely

For a slimmer template or product, remove the code:

1. Remove the UI routes and nav entries.
2. Remove the tRPC router and any procedures that only serve that feature.
3. Remove or slim the server module.
4. Remove the env keys and feature-flag checks.
5. Trim Prisma models and migrations if they are only used by that feature.

See [Architecture](architecture.md) for the list of modules and routers.

---

## 6. Clean publish checklist

Before publishing this repo as a **public GitHub template** (or a derivative):

1. **Branding** — Replace app name in `lib/config.ts`, `app/layout.tsx`, `app/manifest.ts`, `package.json`; replace icons and assets in `public/` and `app/`; update `REDIS_KEY_PREFIX` default and logger/comment references if desired.
2. **Legal** — Replace content of `app/terms/page.tsx` and `app/privacy/page.tsx`.
3. **Env** — Ensure `.env.example` only documents the providers you support; remove or comment unused keys (e.g. `POLAR_*` if not used).
4. **Docs** — Ensure `README.md` and `DOCS/` match the features and setup you ship.
5. **Optional modules** — Decide whether to keep or remove orgs, admin, Redis, UploadThing, or Stripe; document the chosen feature set.
6. **Security & automation** — Keep or adapt `SECURITY.md` for vulnerability reporting; keep `.github/dependabot.yml` so dependency update PRs are created. Ensure no secrets are committed (`.env` is in `.gitignore`).

---

## 7. Where to extend product behavior

If you are building a real product on top of this template:

- **Business logic** — `server/modules/*`
- **Pricing and limits** — `lib/plans.ts`, entitlement consumption in `server/modules/entitlements`
- **Email content and provider** — `lib/email.ts`
- **Product UI** — `app/dashboard/*`
- **Data model** — `prisma/schema.prisma` and any new modules/routers
