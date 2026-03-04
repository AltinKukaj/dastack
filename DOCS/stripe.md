# Stripe (Payments & Subscriptions)

Add payments and subscriptions. If you don’t set Stripe env vars, the pricing and billing UI hides itself.

---

## TL;DR

| Goal | Do this |
|------|--------|
| Get API keys | [dashboard.stripe.com](https://dashboard.stripe.com) -> **Developers -> API keys** (use Test mode first) |
| Local dev (no webhook) | Run **`bun stripe:poll`** in a second terminal next to `bun dev` |
| Change plans/prices | Edit **`lib/plans.ts`** -> run **`bun stripe:sync`** -> restart `bun dev` |
| Production | Add webhook in Stripe Dashboard, set `STRIPE_WEBHOOK_SECRET` |

---

## Template users: read this first

`price_...` IDs are **Stripe-account specific**.

- The IDs in `lib/stripe-plans.generated.ts` are starter defaults for this template.
- They will not match a new user's Stripe account.
- Every template user should run `bun stripe:sync` (or paste their own IDs manually) after editing plans.

---

## What’s included

- **`/pricing`** - Pricing page with plan cards
- **`/dashboard/billing`** - Billing page (current plan, manage, cancel)
- **`lib/plans.ts`** - Plan names, prices, features (single source of truth for the UI)
- **`bun stripe:sync`** - Creates Products/Prices in Stripe and generates `lib/stripe-plans.generated.ts` with price IDs
- **`bun stripe:poll`** - Local dev: polls Stripe every 5s and updates your DB so subscriptions go from `incomplete` -> `active` / `trialing`

---

## 1. Get your Stripe API keys

1. Create an account at [dashboard.stripe.com](https://dashboard.stripe.com).
2. Switch to **Test mode** (recommended while building).
3. Go to **Developers -> API keys**.
4. Copy **Secret key** (`sk_test_...`) and **Publishable key** (`pk_test_...`).

Add to `.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 2. Local development: use the poll script (no webhook)

You **don’t** need webhooks or the Stripe CLI for local testing. This repo has a script that polls Stripe every 5 seconds and updates your database when a checkout is completed.

**Steps:**

1. **Terminal 1** - start the app:

   ```bash
   bun dev
   ```

2. **Terminal 2** - run the poll script:

   ```bash
   bun stripe:poll
   ```

Leave both running. After a user completes checkout, you’ll see something like:

```
✅ [14:32:01] Activated 1 sub(s) -> active (sub_...)
```

- Script: **`scripts/poll-stripe.ts`**
- **Production:** Don’t use this script; real webhooks handle it.

> **Tip:** The app only shows the Stripe UI when **both** `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are set. For local dev with the poll script, set `STRIPE_WEBHOOK_SECRET=whsec_local` (or any placeholder) so the feature turns on; the poll script will still update subscription status.

---

## 3. Webhooks (production)

The Better Auth Stripe plugin expects:

```
{BETTER_AUTH_URL}/api/auth/stripe/webhook
```

**In Stripe Dashboard:**

1. **Developers -> Webhooks** -> **Add endpoint**
2. Endpoint URL: `https://create.dagrate.xyz/api/auth/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy the **Signing secret** (`whsec_...`)

Add to `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

Restart the server after changing `.env`.

**Optional - local webhooks with Stripe CLI:**

```bash
stripe login
stripe listen --forward-to localhost:3000/api/auth/stripe/webhook
```

Use the `whsec_...` the CLI prints as your local `STRIPE_WEBHOOK_SECRET`.

---

## 4. Plans and price IDs

- **`lib/plans.ts`** - What the **UI** shows (names, prices, features).
- **`lib/stripe-plans.generated.ts`** - What **Better Auth** uses (Stripe **price IDs**).

**Recommended workflow (for template users):**

1. Edit **`lib/plans.ts`** (e.g. change Pro monthly to $39: find the `pro` plan, set `monthlyPrice: 39`, save).
2. Run:

   ```bash
   bun stripe:sync
   ```

   This creates Stripe Products and Prices in **your Stripe account** and regenerates **`lib/stripe-plans.generated.ts`** with the new `price_...` IDs.

3. Restart **`bun dev`**.

If you prefer not to use the script, you can paste your Stripe `price_...` IDs into `lib/stripe-plans.generated.ts` by hand.

### Connecting a fresh Stripe account (ordered steps)

1. Add `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env`.
2. Edit plan details in `lib/plans.ts` (name, monthly/annual prices, features, limits).
3. Run `bun stripe:sync` to create/update Products + Prices and regenerate `lib/stripe-plans.generated.ts`.
4. Add `STRIPE_WEBHOOK_SECRET` and configure webhook endpoint for production.
5. Restart `bun dev` and test from `/pricing` to `/dashboard/billing`.

---

## 5. Test the full flow

1. Auth and Stripe env vars set (see [env.md](./env.md)).
2. **Terminal 1:** `bun dev`
3. **Terminal 2:** `bun stripe:poll`
4. Open **`/pricing`**, sign in, click a plan. After payment, the poll script will mark the subscription active within a few seconds.

---

## 6. Billing safety notes

- Cancel actions in `/dashboard/billing` are real subscription operations.
- Always test with Stripe test mode and test cards before enabling live keys.
- Keep billing pages behind authenticated routes only (already true in this template).

---

## 7. Where Stripe lives in the repo

| What | Where |
|------|--------|
| Stripe plugin wiring | `lib/auth.ts` |
| Generated plan config (price IDs) | `lib/stripe-plans.generated.ts` |
| Plan definitions (UI) | `lib/plans.ts` |
| Pricing page | `app/pricing/page.tsx` |
| Billing page | `app/dashboard/billing/page.tsx` |
| Sync script | `scripts/sync-stripe.ts` |
| Poll script | `scripts/poll-stripe.ts` |
