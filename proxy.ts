import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Optimistic auth gate for /dashboard/* routes.
 * The authoritative session check lives in app/dashboard/layout.tsx.
 */
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    const signInUrl = new URL("/sign-in", request.url);
    const callbackPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    signInUrl.searchParams.set("callbackUrl", callbackPath);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
