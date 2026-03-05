import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { authDebug } from "@/lib/auth-debug";

/**
 * Better Auth catch-all route handler.
 *
 * When auth is disabled (no env vars configured), returns a JSON 404
 * instead of crashing.
 */
function handler(req: Request) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const url = new URL(req.url);
  const cookieHeader = req.headers.get("cookie");
  authDebug("route.incoming", {
    requestId,
    method: req.method,
    pathname: url.pathname,
    search: url.search,
    host: req.headers.get("host"),
    origin: req.headers.get("origin"),
    referer: req.headers.get("referer"),
    hasCookie: !!cookieHeader,
    cookieBytes: cookieHeader?.length ?? 0,
  });

  if (!auth) {
    authDebug("route.auth_disabled", { requestId });
    return NextResponse.json(
      {
        error:
          "Authentication is not configured. Set DATABASE_URL, BETTER_AUTH_SECRET, and BETTER_AUTH_URL to enable it.",
      },
      { status: 404 },
    );
  }

  if (url.pathname.endsWith("/api/auth/error")) {
    const redirectBase = process.env.BETTER_AUTH_URL ?? req.url;
    const redirectTarget = new URL("/auth", redirectBase);
    redirectTarget.searchParams.set("tab", "sign-in");
    redirectTarget.searchParams.set(
      "oauthError",
      url.searchParams.get("error") ?? "oauth_flow_failed",
    );
    authDebug("route.oauth_error_redirect", {
      requestId,
      incomingError: url.searchParams.get("error"),
      redirectTarget: redirectTarget.toString(),
    });
    return NextResponse.redirect(redirectTarget);
  }

  try {
    const { toNextJsHandler } = require("better-auth/next-js");
    const { GET, POST } = toNextJsHandler(auth);
    const responseOrPromise = req.method === "GET" ? GET(req) : POST(req);
    if (responseOrPromise instanceof Promise) {
      return responseOrPromise.then((response: Response) => {
        authDebug("route.outgoing", {
          requestId,
          method: req.method,
          status: response.status,
          location: response.headers.get("location"),
          hasSetCookie: !!response.headers.get("set-cookie"),
          setCookieBytes: response.headers.get("set-cookie")?.length ?? 0,
        });
        return response;
      });
    }

    authDebug("route.outgoing", {
      requestId,
      method: req.method,
      status: responseOrPromise.status,
      location: responseOrPromise.headers.get("location"),
      hasSetCookie: !!responseOrPromise.headers.get("set-cookie"),
      setCookieBytes: responseOrPromise.headers.get("set-cookie")?.length ?? 0,
    });
    return responseOrPromise;
  } catch (error) {
    authDebug("route.exception", {
      requestId,
      method: req.method,
      pathname: url.pathname,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

export { handler as GET, handler as POST };
