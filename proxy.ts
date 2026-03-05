import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { authDebug } from "@/lib/auth-debug";

/**
 * Next.js Proxy (formerly "middleware").
 *
 * Runs on every matched request *before* the route handler.
 * Defaults to the Node.js runtime.
 *
 * This is an **optimistic** auth gate - the authoritative session
 * check lives in `app/dashboard/layout.tsx`.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */
export function proxy(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const sessionCookie = getSessionCookie(request);
  authDebug("proxy.dashboard_check", {
    requestId,
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    hasSessionCookie: !!sessionCookie,
    cookieBytes: sessionCookie?.length ?? 0,
  });

  if (!sessionCookie) {
    const signInUrl = new URL("/sign-in", request.url);
    // Preserve query params for post-auth return navigation.
    const callbackPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    signInUrl.searchParams.set("callbackUrl", callbackPath);
    authDebug("proxy.redirect_sign_in", {
      requestId,
      redirectTo: signInUrl.toString(),
    });
    return NextResponse.redirect(signInUrl);
  }

  authDebug("proxy.allow_request", { requestId });
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
