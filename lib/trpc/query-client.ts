import { QueryClient } from "@tanstack/react-query";
import superjson from "superjson";

/**
 * Create a new QueryClient instance.
 *
 * In SSR environments each request should get its own client to
 * prevent data leaking between users. On the client we reuse a
 * single instance.
 */
export function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Don't refetch on window focus in production
                refetchOnWindowFocus: false,
                // Keep data fresh for 30 seconds
                staleTime: 30 * 1000,
            },
            dehydrate: {
                serializeData: superjson.serialize,
            },
            hydrate: {
                deserializeData: superjson.deserialize,
            },
        },
    });
}
