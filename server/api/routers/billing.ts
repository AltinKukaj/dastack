import { router, publicProcedure, protectedProcedure } from "@/server/api/trpc";
import {
  getBillingCapabilities,
  getUserSubscriptions,
} from "@/server/modules/billing/billing.service";
import { getEntitlements } from "@/server/modules/entitlements/entitlements.service";

/**
 * Billing router - exposes billing state used by the dashboard.
 */
export const billingRouter = router({
    capabilities: publicProcedure.query(() => {
        return getBillingCapabilities();
    }),

    subscriptions: protectedProcedure.query(async ({ ctx }) => {
        return getUserSubscriptions(ctx.db, ctx.session.user.id);
    }),

    entitlements: protectedProcedure.query(async ({ ctx }) => {
        return getEntitlements(ctx.db, ctx.session.user.id);
    }),
});
