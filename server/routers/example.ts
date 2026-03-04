import { z } from "zod";
import {
  permissionProcedure,
  protectedProcedure,
  publicProcedure,
  roleProcedure,
  router,
} from "../trpc";

/**
 * Example router - replace / extend with your own procedures.
 *
 * Demonstrates:
 *   - A public procedure (health check)
 *   - A protected procedure that requires auth
 *   - Input validation with Zod
 */
export const exampleRouter = router({
  /**
   * A simple health-check query anyone can call.
   *
   *   const { data } = trpc.example.hello.useQuery({ name: "World" });
   */
  hello: publicProcedure
    .input(z.object({ name: z.string().optional().default("World") }))
    .query(({ input }) => {
      return { greeting: `Hello, ${input.name}!` };
    }),

  /**
   * Returns the caller's own session info.
   * Only authenticated users can call this.
   *
   *   const { data } = trpc.example.me.useQuery();
   */
  me: protectedProcedure.query(({ ctx }) => {
    return {
      user: ctx.session.user,
    };
  }),

  /**
   * Example role-gated endpoint.
   */
  adminSummary: roleProcedure(["admin", "owner"]).query(() => {
    return {
      ok: true,
      message: "Admin/owner role check passed.",
    };
  }),

  /**
   * Example permission-gated endpoint.
   */
  billingReadiness: permissionProcedure("billing:read").query(({ ctx }) => {
    const role = (ctx.session.user as Record<string, unknown>).role ?? "user";
    return {
      role,
      canViewBilling: true,
    };
  }),
});
