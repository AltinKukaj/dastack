import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const AUTH_PAGES = ["/login", "/signup", "/forgot-password"];
const PROTECTED_PREFIX = ["/dashboard", "/settings", "/admin"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = getSessionCookie(request);

  if (session && AUTH_PAGES.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!session && PROTECTED_PREFIX.some((p) => pathname.startsWith(p))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
