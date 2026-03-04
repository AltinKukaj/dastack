## Vexonhub Template – Implementation Plan

This plan tracks upcoming improvements to the template to make it “ready to use, everything optional, lots of leeway” without over‑opinionating the stack.

---

## 1) Core runtime additions

- **1.1 `/api/health` endpoint**
  - Add `app/api/health/route.ts`.
  - `GET /api/health` returns `{ status: "ok" }` with HTTP 200.
  - Optionally include a non‑fatal DB ping (Prisma) and report `{ db: "up" | "down" }` in the JSON response.
  - Reference this endpoint in deployment docs as the default liveness/readiness URL (Docker, Dokploy, K8s, etc.).

---

## 2) Documentation

- **2.1 `DOCS/troubleshooting.md`**
  - Short, copy‑paste friendly answers for:
    - App crashes on startup → env validation errors, `SKIP_ENV_VALIDATION=1`, link to `DOCS/env.md`.
    - OAuth `redirect_uri mismatch` → check `BETTER_AUTH_URL`, provider redirect URLs, link to `DOCS/oauth.md`.
    - Magic link / emails not sending → `RESEND_API_KEY`, `EMAIL_FROM`, Resend sandbox vs prod.
    - Stripe webhook errors or subscription stuck as `incomplete` → webhook URL, `stripe:poll`, `STRIPE_WEBHOOK_SECRET`, link to `DOCS/stripe.md`.
    - Dashboard not accessible → core auth env missing, feature flags off, proxy/layout redirects.
  - Link this file from:
    - `DOCS/README.md` (“If something breaks, read troubleshooting.md”).
    - `DOCS/env.md` near the bottom.

- **2.2 `DOCS/optional.md` – optional integrations overview**
  - **Error monitoring (docs‑only):**
    - Mention tools like Sentry, Better Stack, Logtail, etc.
    - One‑liner each: “Follow their Next.js guide, add DSN env var, wrap Next handlers/components as recommended.”
  - **Analytics (docs‑only):**
    - Mention Plausible, PostHog, Umami, Vercel Web Analytics.
    - Call out basic trade‑offs (self‑hosted vs managed, privacy friendly).
  - **i18n (docs‑only for now):**
    - Mention Next.js i18n routing and libraries like Paraglide or next‑intl.
    - Note that Better Auth already has an i18n plugin; link to its docs.
    - Brief guidance on where translations usually live: `app/layout.tsx`, `app/page.tsx`, auth components, dashboard pages.
  - **Other ideas (bullets only, no code):**
    - Extra OAuth providers, queues, background jobs, search, object storage, etc.
  - Cross‑link from:
    - `DOCS/README.md` (“Want optional integrations?”).
    - Root `README.md` in an “Optional integrations” section.

- **2.3 README and docs tweaks for flexibility**
  - **Root `README.md`:**
    - Add a “Who is this for?” section (indies, agencies, startups, hobby apps).
    - Add a “What can I strip out?” section:
      - Auth‑only: set core auth env, leave Stripe env unset (pricing + billing auto‑hide).
      - Landing‑only: leave core auth env unset; only marketing routes work.
      - Stripe‑free: remove billing/pricing links and uninstall Stripe deps (link to customization docs).
    - Add a short “Testing” section explaining that tests are intentionally minimal and recommending project‑specific tests (unit + E2E).
  - **`DOCS/customization.md`:**
    - Reference the “What can I strip out?” section in `README.md` for people who want auth‑only or landing‑only modes.
    - Add a quick hint that i18n hooks into layout, landing, auth pages, and dashboard; link to `DOCS/optional.md`.
  - **`DOCS/ui.md`:**
    - Add a brief accessibility note (contrast, focus, keyboard nav, labels) and link to a simple WCAG resource.
    - Mention key files where i18n would be wired (layout, landing, auth, dashboard) with a pointer to `DOCS/optional.md`.
  - **`DOCS/deploying.md`:**
    - Document `/api/health` as the recommended health check URL.
    - Optionally add short, concrete bullet‑point guides for 1–2 extra deploy targets (e.g. Vercel/Railway) using the same env + build commands.

- **2.4 `CHANGELOG.md`**
  - Create `CHANGELOG.md` with:
    - `## 1.0.0` – initial template release (current state).
    - `## 1.1.0` – to include: health endpoint, troubleshooting + optional integrations docs, minimal tests (once implemented).

---

## 3) Minimal tests (super basic)

The template should ship with only a few small tests and **encourage users to add their own**.

- **3.1 Feature flag tests**
  - File: `__tests__/features.test.ts`.
  - Tests:
    - With no relevant env → all feature flags `false`.
    - With only core auth env set → `auth: true`, all others `false`.
    - With Stripe env set (plus auth) → `stripe: true` while others stay consistent.
  - Implementation notes:
    - Safely snapshot and restore `process.env` within each test suite.

- **3.2 tRPC example tests**
  - File: `__tests__/trpc-example.test.ts`.
  - Tests:
    - Call the `example` router (e.g. `example.hello`) with a minimal context.
    - Assert that the response matches the documented shape (e.g. `{ greeting: string }`).
  - Purpose:
    - Serve as a reference for users to write their own tRPC tests.

- **3.3 Testing docs note**
  - In `README.md` and/or a tiny `DOCS/testing.md`:
    - Explain what’s covered by the template tests (env schema, Prisma config import, feature flags, example tRPC).
    - Explicitly recommend that users add:
      - Auth flow tests (sign‑in, sign‑up, restricted dashboard).
      - Domain‑specific unit tests.
      - E2E tests (e.g. Playwright) if they need regression safety.

---

## 4) Developer experience polish

- **4.1 VS Code settings (or snippet)**
  - Option A – add `.vscode/settings.json`:
    - Set Biome as default formatter for TS/TSX.
    - Enable format‑on‑save.
  - Option B – docs‑only:
    - Show a minimal VS Code settings snippet in `DOCS/README.md` or `DOCS/ui.md`.

- **4.2 Bun / Node / npm note**
  - In `README.md` or `DOCS/env.md`:
    - Clarify that scripts are written for Bun but `npm run` / `pnpm` can be used if the proper runtime and Node version are installed.

---

## 5) i18n stance (for now)

- No default i18n implementation in the codebase yet (to avoid adding complexity by default).
- All i18n guidance lives in docs:
  - `DOCS/optional.md` – overview of options (Next.js i18n, Paraglide, next‑intl, Better Auth i18n plugin).
  - `DOCS/ui.md` – list of key UI entry points where translations typically plug in.
- If needed later, add a very small, opt‑in i18n example (e.g. two languages for a couple of strings) as a separate phase, not part of the core template.

