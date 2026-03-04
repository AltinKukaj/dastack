import { initTRPC, TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  type AppPermission,
  type AppRole,
  hasPermission,
  hasRole,
} from "@/lib/permissions";

/**
 * tRPC server initialisation - the building blocks for your API.
 *
 * Usage:
 *   import { router, publicProcedure, protectedProcedure } from "@/server/trpc";
 *
 * @see https://trpc.io/docs/server/introduction
 */

// ── Context ──────────────────────────────────────────────────────────────────

/**
 * Creates the context available to every tRPC procedure.
 * Called once per request.
 *
 * When auth is disabled, `session` is always `null`.
 */
export async function createTRPCContext() {
  let session = null;

  if (auth) {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  }

  return { session };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

// ── Initialisation ───────────────────────────────────────────────────────────

const t = initTRPC.context<TRPCContext>().create();

// ── Exports ──────────────────────────────────────────────────────────────────

/**
 * Create a new router.
 * @see https://trpc.io/docs/server/routers
 */
export const router = t.router;

/**
 * Create a server-side caller.
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * Public (unauthenticated) procedure.
 * Anyone can call these - no session required.
 */
export const publicProcedure = t.procedure;

/**
 * Protected (authenticated) procedure.
 * Throws UNAUTHORIZED if the user is not signed in.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      // Narrow the type so downstream resolvers get a non-null session
      session: ctx.session,
    },
  });
});

/**
 * Procedure gated by one or more roles.
 */
export const roleProcedure = (roles: AppRole[]) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const roleValue = (ctx.session.user as Record<string, unknown>).role;
    if (!hasRole(roleValue, roles)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Missing required role.",
      });
    }
    return next();
  });

/**
 * Procedure gated by a granular permission string.
 */
export const permissionProcedure = (permission: AppPermission) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const roleValue = (ctx.session.user as Record<string, unknown>).role;
    if (!hasPermission(roleValue, permission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Missing required permission: ${permission}`,
      });
    }
    return next();
  });
