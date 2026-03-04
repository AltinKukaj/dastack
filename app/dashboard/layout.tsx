import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Server-side layout for /dashboard/*.
 *
 * This is the **authoritative** auth check - proxy.ts is only a fast
 * optimistic gate. If the session is invalid or expired, the user is
 * redirected to sign-in before any dashboard content is rendered.
 *
 * When auth is disabled (no env vars), redirects to the home page.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth not configured - redirect to home
  if (!auth) {
    redirect("/");
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth?callbackUrl=/dashboard");
  }

  return <>{children}</>;
}
