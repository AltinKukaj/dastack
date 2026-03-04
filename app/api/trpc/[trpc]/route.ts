import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/root";
import { createTRPCContext } from "@/server/trpc";

/**
 * tRPC HTTP handler - handles all /api/trpc/* requests.
 *
 * Uses the fetch adapter so it works in both Node and Edge runtimes.
 *
 * @see https://trpc.io/docs/server/adapters/fetch
 */
function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });
}

export { handler as GET, handler as POST };
