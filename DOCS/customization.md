# Template customization checklist

Use this checklist right after you fork/clone the template.

---

## 1) Rename and brand the app

Replace the default brand name (`dastack`) in:

- `app/layout.tsx` (metadata title + description)
- `app/page.tsx` (landing copy and nav branding)
- `app/dashboard/page.tsx` (dashboard branding and starter checklist copy)
- `app/dashboard/billing/page.tsx` (sidebar/header brand text)
- `app/dashboard/settings/page.tsx` (sidebar/header brand text)
- `app/pricing/page.tsx` (header brand text)
- `lib/email.ts` (email sender fallback + email body branding)
- `package.json` (`name`, `description`, `author` if needed)

---

## 2) Replace template links and contact details

Update these placeholders:

- Repo links:
  - `app/page.tsx`
  - `app/dashboard/page.tsx`
  - `app/pricing/page.tsx`
  - `README.md`
- Sales/support email placeholder (`sales@create.dagrate.xyz`):
  - `app/pricing/page.tsx`
- Sender domain placeholder (`noreply@create.dagrate.xyz`):
  - `.env.example`
  - `DOCS/env.md`

---

## 3) Configure metadata, legal, and public assets

- Metadata title/description: `app/layout.tsx`
- Favicon / app icons / manifest:
  - `app/favicon.ico`
  - `app/apple-icon.png`
  - `app/manifest.json`
- Legal content:
  - `app/terms/page.tsx`
  - `app/privacy/page.tsx`

---

## 4) Customize pricing and billing copy

- Plan names, prices, features, limits: `lib/plans.ts`
- Pricing page messaging and CTA wording: `app/pricing/page.tsx`
- Stripe IDs used by auth: `lib/stripe-plans.generated.ts` (regenerated via `bun stripe:sync`, then consumed by `lib/auth.ts`)

After editing plan values in `lib/plans.ts`, run:

```bash
bun stripe:sync
```

---

## 5) Adjust starter/dashboard placeholders

The dashboard includes scaffold content to help users get started. Replace it with your product metrics and workflows:

- Quick actions and checklist items: `app/dashboard/page.tsx`
- Security/billing labels and helper copy:
  - `app/dashboard/settings/page.tsx`
  - `app/dashboard/billing/page.tsx`

---

## 6) Flexible modes + i18n hooks

- Want auth-only or landing-only behavior? Start with the **"What can I strip out?"** section in [../README.md](../README.md).
- Planning translations later? i18n usually plugs into:
  - `app/layout.tsx`
  - `app/page.tsx`
  - `app/(auth)/auth/page.tsx` + auth components
  - `app/dashboard/*`
- See [optional.md](./optional.md) for integration options and trade-offs.

---

## 7) Final pre-release pass

- Search the codebase for leftover placeholders:
  - `dastack`
  - `create.dagrate.xyz`
  - `AltinKukaj`
- Verify `.env` is local-only and `.env.example` is clean.
- Run checks before shipping:

```bash
bun run lint
bun run type-check
bun test
```
