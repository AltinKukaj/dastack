"use client";

import { TRPCProvider } from "@/lib/trpc";

/**
 * Global client-side providers.
 *
 * Wraps the app with everything that needs React context on the client:
 *   - tRPC + React Query
 *   - (add more providers here as needed, e.g. theme, toast, etc.)
 *
 * Used in `app/layout.tsx` to keep the layout server-renderable.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <TRPCProvider>{children}</TRPCProvider>;
}
