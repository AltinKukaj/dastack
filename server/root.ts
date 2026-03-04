import { exampleRouter } from "./routers/example";
import { createCallerFactory, router } from "./trpc";

/**
 * Root tRPC router - merge all sub-routers here.
 *
 * Every router added here becomes available as `trpc.<routerName>.<procedure>`.
 */
export const appRouter = router({
  example: exampleRouter,
});

/** Type-only export so the client can infer the full API shape. */
export type AppRouter = typeof appRouter;

/**
 * Server-side caller factory - call procedures without HTTP in Server Components.
 *
 *   import { createCaller } from "@/server/root";
 *   import { createTRPCContext } from "@/server/trpc";
 *
 *   const trpc = createCaller(await createTRPCContext());
 *   const greeting = await trpc.example.hello({ name: "Server" });
 */
export const createCaller = createCallerFactory(appRouter);
