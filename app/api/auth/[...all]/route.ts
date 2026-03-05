import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Better Auth catch-all route handler.
 *
 * When auth is disabled (no env vars configured), returns a JSON 404
 * instead of crashing.
 */
async function handler(req: Request) {
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
    // In production behind reverse proxies, req.url may resolve to an internal
    // origin (e.g. 0.0.0.0:3000). Prefer BETTER_AUTH_URL for user-facing redirects.
    const redirectBase = process.env.BETTER_AUTH_URL ?? req.url;
    const redirectTarget = new URL("/auth", redirectBase);
    redirectTarget.searchParams.set("tab", "sign-in");
    redirectTarget.searchParams.set(
      "oauthError",
      url.searchParams.get("error") ?? "oauth_flow_failed",
    );
    return NextResponse.redirect(redirectTarget);
  }

  const { toNextJsHandler } = await import("better-auth/next-js");
  const { GET, POST } = toNextJsHandler(auth);
  if (req.method === "GET") return GET(req);
  return POST(req);
}

export { handler as GET, handler as POST };
