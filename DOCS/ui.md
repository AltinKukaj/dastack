# UI & Styling

Where to change branding, add components, and how sitemap/robots work. The template uses **Tailwind CSS v4** and **Next.js App Router** - no heavy UI library by default.

---

## TL;DR

| Goal | Where |
|------|--------|
| Global styles | `app/globals.css` |
| Layout, metadata, fonts | `app/layout.tsx` |
| Landing page | `app/page.tsx` |
| Auth pages | `app/(auth)/auth/page.tsx` + `app/(auth)/components/*` |
| Dashboard | `app/dashboard/layout.tsx`, `app/dashboard/page.tsx` |
| Change app name | `app/layout.tsx`, `app/page.tsx`, `lib/email.ts` |
| Add components | e.g. shadcn/ui: `bunx --bun shadcn@latest init` |

---

Need a full pass of placeholders to replace before release? Use [customization.md](./customization.md).

---

## Where to start

- **Global styles** - `app/globals.css`
- **Root layout** - `app/layout.tsx` (fonts, metadata, providers)
- **Landing page** - `app/page.tsx`
- **Auth UI** - `app/(auth)/auth/page.tsx`, `app/(auth)/components/sign-in-form.tsx`, `sign-up-form.tsx`
- **Dashboard shell** - `app/dashboard/layout.tsx`

---

## Changing branding

### App name and metadata

Search for the default name (e.g. **`dastack`**) and replace it in:

- `app/layout.tsx` (title, description)
- `app/page.tsx` (marketing copy)
- `lib/email.ts` (email branding)

### Icons and favicon

Icons live in **`app/`**:

- `app/favicon.ico`
- `app/apple-icon.png`
- `app/manifest.json`

**Easy way to regenerate:** [RealFaviconGenerator for Next.js](https://realfavicongenerator.net/favicon-generator/nextjs) -> upload logo, download, replace the files in `app/`.

---

## Adding a component library (optional)

The template ships without one so you keep full control. If you want prebuilt components, these work well with Tailwind:

| Library | Style | Notes |
|---------|--------|--------|
| [shadcn/ui](https://ui.shadcn.com) | Copy-paste | **Recommended** - you own the code, no lock-in |
| [Radix UI](https://www.radix-ui.com) | Headless | Unstyled primitives, style with Tailwind |
| [Headless UI](https://headlessui.com) | Headless | Menus, dialogs, transitions |
| [NextUI (HeroUI)](https://heroui.com) | Styled | Tailwind-based, quick to prototype |
| [Ark UI](https://ark-ui.com) | Headless | State machines, framework-agnostic |
| [Park UI](https://park-ui.com) | Styled | Themes on top of Ark UI |

**shadcn/ui quick start:**

```bash
bunx --bun shadcn@latest init
bunx --bun shadcn@latest add button card dialog
```

Components are copied into your repo (usually `components/ui/`).

---

## Sitemap and robots.txt

- **`app/sitemap.ts`** -> served at **`/sitemap.xml`**. Add public routes here as you build them.
- **`app/robots.ts`** -> served at **`/robots.txt`**. Allows `/`, disallows `/dashboard/` and `/api/`, and points to the sitemap.

Both use **`BETTER_AUTH_URL`** or **`NEXT_PUBLIC_APP_URL`** as the base URL.

---

## Feature-driven UI

Pages show or hide sections based on **`/api/features`**:

- No Stripe env -> pricing/billing shows “Stripe not configured”
- No Discord/Google/GitHub env -> OAuth buttons are hidden

So you can enable features one at a time via `.env` without touching UI code.

---

## Accessibility quick pass

Before shipping UI changes, run a simple manual accessibility check:

- Ensure text/background contrast is readable.
- Verify visible focus states on interactive controls.
- Test keyboard navigation for menus, dialogs, and forms.
- Keep form labels and error messages explicit.

Quick reference: [WCAG Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)

---

## i18n wiring points

If you add localization, the main entry points are:

- `app/layout.tsx` (locale provider + metadata wiring)
- `app/page.tsx` (landing content)
- `app/(auth)/auth/page.tsx` and `app/(auth)/components/*`
- `app/dashboard/layout.tsx` and `app/dashboard/*`

Integration options and trade-offs: [optional.md](./optional.md)
