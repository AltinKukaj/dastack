import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Better Auth catch-all route handler.
 *
 * When auth is disabled (no env vars configured), returns a JSON 404
 * instead of crashing.
 */
function handler(req: Request) {
  if (!auth) {
    return NextResponse.json(
      {
        error:
          "Authentication is not configured. Set DATABASE_URL, BETTER_AUTH_SECRET, and BETTER_AUTH_URL to enable it.",
      },
      { status: 404 },
    );
  }

  const url = new URL(req.url);
  if (url.pathname.endsWith("/api/auth/error")) {
    const oauthError = url.searchParams.get("error");
    if (oauthError) {
      const redirectTarget = new URL("/auth", req.url);
      redirectTarget.searchParams.set("tab", "sign-in");
      redirectTarget.searchParams.set("oauthError", oauthError);
      return NextResponse.redirect(redirectTarget);
    }
  }

  const { toNextJsHandler } = require("better-auth/next-js");
  const { GET, POST } = toNextJsHandler(auth);
  if (req.method === "GET") return GET(req);
  return POST(req);
}

export { handler as GET, handler as POST };
