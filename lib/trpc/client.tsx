"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import superjson from "superjson";

import type { AppRouter } from "@/server/api/routers/_app";
import { makeQueryClient } from "@/lib/trpc/query-client";

/**
 * Create the tRPC + React Query integration.
 */
export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

/**
 * Singleton query client for the browser.
 * On the server, always create a new one.
 */
let browserQueryClient: ReturnType<typeof makeQueryClient> | undefined;

function getQueryClient() {
    if (typeof window === "undefined") {
        // Server: always create a new client
        return makeQueryClient();
    }
    // Browser: reuse the same client
    if (!browserQueryClient) {
        browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
}

/**
 * Get the base URL for tRPC requests.
 */
function getBaseUrl() {
    if (typeof window !== "undefined") return "";
    // Server-side: use the app URL
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/**
 * Root provider that wraps the app with tRPC + React Query.
 *
 * Add this in layout.tsx:
 * ```tsx
 * <TRPCReactProvider>{children}</TRPCReactProvider>
 * ```
 */
export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
    const queryClient = getQueryClient();

    const [trpcClient] = useState(() =>
        createTRPCClient<AppRouter>({
            links: [
                httpBatchLink({
                    url: `${getBaseUrl()}/api/trpc`,
                    transformer: superjson,
                }),
            ],
        }),
    );

    return (
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </TRPCProvider>
    );
}
