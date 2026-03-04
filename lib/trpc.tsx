"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";
import type { AppRouter } from "@/server/root";

/**
 * Type-safe tRPC React hooks.
 *
 *   import { trpc } from "@/lib/trpc";
 *   const { data } = trpc.example.hello.useQuery({ name: "World" });
 */
export const trpc = createTRPCReact<AppRouter>();

// ── Helper ──────────────────────────────────────────────────────────────────

function getBaseUrl() {
  if (typeof window !== "undefined") return ""; // browser - relative URL
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

// ── Provider ────────────────────────────────────────────────────────────────

/**
 * Wrap your app with `<TRPCProvider>` to enable tRPC + React Query on the
 * client side. Already included in `<Providers>` - you don't need to add it
 * manually.
 */
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, avoid refetching immediately on mount
            staleTime: 30 * 1000,
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
