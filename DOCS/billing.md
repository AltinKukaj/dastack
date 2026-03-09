# Billing

Billing in this template is **Stripe-only**.

---

## TL;DR

| Goal | Do this |
|------|--------|
| **Get API keys** | [dashboard.stripe.com](https://dashboard.stripe.com) -> **Developers -> API keys** (use Test mode first) |
| **Local dev (no webhook)** | Run **`pnpm stripe:poll`** in a second terminal next to `pnpm dev` |
| **Change plans/prices** | Edit **`lib/plans.ts`** -> run **`pnpm stripe:sync`** -> restart `pnpm dev` |
| **Production** | Add webhook in Stripe Dashboard, set `STRIPE_WEBHOOK_SECRET` |

---

The app uses:

- Better Auth's Stripe subscription plugin
- `lib/plans.ts` as the source of truth for plan metadata and limits
- `lib/stripe-plans.generated.ts` for account-specific Stripe price IDs
- inline webhook processing in `server/modules/billing/billing-webhooks.service.ts`
- entitlement snapshots in `server/modules/entitlements/entitlements.service.ts`

Unused `POLAR_*` env definitions remain in `lib/env.ts`; you can remove them if you do not plan to add Polar.

## Main files

| File | Responsibility |
| --- | --- |
| `lib/plans.ts` | plan names, prices, marketing copy, and usage limits |
| `lib/stripe-plans.generated.ts` | generated Stripe price IDs for the current Stripe account |
| `lib/auth.ts` | Better Auth Stripe plugin setup |
| `app/pricing/pricing-client.tsx` | public pricing page actions |
| `app/dashboard/billing/page.tsx` | authenticated billing management UI |
| `server/modules/billing/billing.service.ts` | billing capabilities and subscription summaries |
| `server/modules/billing/billing-webhooks.service.ts` | webhook ingestion, dedupe, entitlement refresh, and audit logging |
| `server/modules/entitlements/entitlements.service.ts` | plan-to-limit translation and usage snapshots |
| `scripts/sync-stripe.ts` | pushes plans to Stripe and regenerates the mapping file |
| `scripts/poll-stripe.ts` | local helper when webhooks are not being forwarded |

## Setup flow

1. Add these keys:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
2. Review `lib/plans.ts`.
3. Run `pnpm stripe:sync`.
4. Restart the dev server.
5. Either forward real Stripe webhooks or run `pnpm stripe:poll` locally.

Until step 3 is done, billing may appear as configured but checkout stays disabled.

## Local development: use the poll script (no webhook)

You **don’t** need webhooks or the Stripe CLI for local testing. This repo has a script that polls Stripe every 5 seconds and updates your database when a checkout is completed.

**Steps:**

1. **Terminal 1** - start the app:

   ```bash
   pnpm dev
   ```

2. **Terminal 2** - run the poll script:

   ```bash
   pnpm stripe:poll
   ```

Leave both running. After a user completes checkout, you’ll see the script output that it activated subscriptions.

> **Tip:** The app only shows the Stripe UI when **both** `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are set. For local dev with the poll script, set `STRIPE_WEBHOOK_SECRET=whsec_local` (or any placeholder) so the feature turns on; the poll script will still update subscription status.

## How checkout works

The public pricing page and dashboard billing page call Better Auth's subscription client methods:

- `authClient.subscription.upgrade(...)`
- `authClient.subscription.billingPortal(...)`
- `authClient.subscription.cancel(...)`
- `authClient.subscription.list()`

The UI uses `getStripeBillingReadiness()` from `lib/features.ts` to decide whether:

- Stripe is configured
- Stripe plan IDs are ready
- checkout and portal actions should be enabled

## Plan sync behavior

`pnpm stripe:sync` reads `lib/plans.ts`, creates Stripe products and prices, then rewrites `lib/stripe-plans.generated.ts`.

Two important details:

- the generated file is account-specific and should be regenerated for each Stripe account
- the current sync script creates new Stripe products and prices each time it runs; it does not update existing ones in place

That means you should treat the script as a bootstrap tool, not a full catalog-management system.

## Webhooks and entitlement refresh

The Better Auth Stripe plugin forwards Stripe events into `handleStripeBillingWebhook(...)`.

The billing webhook service then:

1. stores the event in `webhook_event`
2. deduplicates it through cache + database state
3. resolves the affected subject
4. refreshes entitlements
5. invalidates caches
6. writes an audit event

Relevant Stripe events are:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

If you are forwarding real Stripe webhooks, point Stripe at Better Auth's Stripe webhook endpoint under the auth route. In this app that is `/api/auth/stripe/webhook`.

## How limits work

`lib/plans.ts` currently defines limits for:

- `projects`
- `storage`

Those values feed both:

- the pricing and billing UI
- the entitlement and usage system

When a user has an active subscription, `getEntitlements(...)` turns the plan into a snapshot of:

- plan slug
- enabled features
- per-meter limits
- used and remaining amounts

## Current limitations

These are real implementation limits in the current template:

- billing only resolves paid plans for users; organizations currently fall back to the `free` entitlement snapshot
- the pricing model is plan-based, not seat-based
- the plan sync script is create-only, not idempotent catalog management

If you want team billing, org billing, seats, or metered pricing, this template gives you a starting point but not a finished implementation.

## Editing plans safely

When changing plans:

1. edit `lib/plans.ts`
2. regenerate Stripe IDs with `pnpm stripe:sync`
3. restart the app
4. verify the billing pages show checkout as ready
5. verify entitlements still match your limit names

If you add a new limit key, also update the parts of your app that consume usage and entitlement data.
