import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

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
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const signInUrl = new URL("/sign-in", request.url);
    // Preserve query params for post-auth return navigation.
    const callbackPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    signInUrl.searchParams.set("callbackUrl", callbackPath);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
