import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { authDebug } from "@/lib/auth-debug";

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
  const requestId = crypto.randomUUID().slice(0, 8);
  // Auth not configured - redirect to home
  if (!auth) {
    authDebug("dashboard_layout.auth_disabled", { requestId });
    redirect("/");
  }

  const headerStore = await headers();
  const cookieHeader = headerStore.get("cookie");
  authDebug("dashboard_layout.session_lookup.start", {
    requestId,
    hasCookieHeader: !!cookieHeader,
    cookieHeaderBytes: cookieHeader?.length ?? 0,
    host: headerStore.get("host"),
    origin: headerStore.get("origin"),
    referer: headerStore.get("referer"),
  });

  const session = await auth.api.getSession({
    headers: headerStore,
  });
  authDebug("dashboard_layout.session_lookup.result", {
    requestId,
    hasSession: !!session,
    userId: session?.user?.id ?? null,
    email: session?.user?.email ?? null,
  });

  if (!session) {
    authDebug("dashboard_layout.redirect_auth", {
      requestId,
      redirectTo: "/auth?callbackUrl=/dashboard",
    });
    redirect("/auth?callbackUrl=/dashboard");
  }

  return <>{children}</>;
}
