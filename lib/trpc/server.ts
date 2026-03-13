import "server-only";

import { createCallerFactory } from "@/server/api/trpc";
import { createRequestContext } from "@/server/context/request-context";
import { appRouter } from "@/server/api/routers/_app";

/**
 * Server-side tRPC caller.
 *
 * Use this in Server Components to call tRPC procedures directly
 * without making HTTP requests. The caller shares the same context
 * (session, db) as the API route handler.
 *
 * Usage:
 * ```ts
 * import { createCaller } from "@/lib/trpc/server";
 *
 * export default async function Page() {
 *   const caller = await createCaller();
 *   const stats = await caller.auth.stats();
 *   // ...
 * }
 * ```
 */

const callerFactory = createCallerFactory(appRouter);

export async function createCaller() {
    const ctx = await createRequestContext();
    return callerFactory(ctx);
}
