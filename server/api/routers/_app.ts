import { router } from "@/server/api/trpc";
import { adminRouter } from "./admin";
import { authRouter } from "./auth";
import { billingRouter } from "./billing";
import { organizationsRouter } from "./organizations";
import { storageRouter } from "./storage";

/**
 * Root application router.
 *
 * Merge all sub-routers here. This is the single entry point
 * used by both the API route handler and the server-side caller.
 */
export const appRouter = router({
    admin: adminRouter,
    auth: authRouter,
    billing: billingRouter,
    organizations: organizationsRouter,
    storage: storageRouter,
});

/**
 * Export the router type for client-side type inference.
 */
export type AppRouter = typeof appRouter;
