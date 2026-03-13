import "server-only";

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { isAdminPanelEnabled } from "@/lib/features";
import { createRequestContext, type RequestContext } from "@/server/context/request-context";

/**
 * tRPC initialization for DaStack.
 *
 * - Uses superjson so dates, maps, etc. serialize correctly.
 * - Context is built from the current request headers.
 */
const t = initTRPC.context<RequestContext>().create({
    transformer: superjson,
});

/**
 * Create the context for each incoming tRPC request.
 * Called automatically by the fetch adapter in the API route.
 */
export const createTRPCContext = async (): Promise<RequestContext> => {
    return createRequestContext();
};

/**
 * Router factory — use this to define new routers.
 */
export const router = t.router;

/**
 * Public procedure — accessible to anyone, authenticated or not.
 * Session may be null.
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure — requires an authenticated session.
 * Throws UNAUTHORIZED if the user is not logged in.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.session) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    return next({
        ctx: {
            ...ctx,
            // Narrow the session type so downstream resolvers know it's non-null
            session: ctx.session,
        },
    });
});

/**
 * Admin procedure — requires an authenticated session with admin role.
 */
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
    if (!isAdminPanelEnabled()) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Admin panel is disabled" });
    }

    if (!ctx.session) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    const role = (ctx.session.user as { role?: string }).role;
    if (role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }

    return next({
        ctx: {
            ...ctx,
            session: ctx.session,
        },
    });
});

/**
 * Caller factory — create a server-side caller for use in Server Components.
 * This avoids HTTP roundtrips when fetching data on the server.
 */
export const createCallerFactory = t.createCallerFactory;
