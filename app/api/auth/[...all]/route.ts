import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const betterAuthHandlers = auth ? toNextJsHandler(auth) : null;

function handler(req: Request) {
  try {
    if (!betterAuthHandlers) {
      return NextResponse.json(
        {
          error:
            "Authentication is not configured. Set DATABASE_URL, BETTER_AUTH_SECRET, and BETTER_AUTH_URL.",
        },
        { status: 404 },
      );
    }

    const url = new URL(req.url);
    if (url.pathname.endsWith("/api/auth/error")) {
      const redirectBase = process.env.BETTER_AUTH_URL ?? req.url;
      const target = new URL("/auth", redirectBase);
      target.searchParams.set("tab", "sign-in");
      target.searchParams.set(
        "oauthError",
        url.searchParams.get("error") ?? "oauth_flow_failed",
      );
      return NextResponse.redirect(target);
    }

    return req.method === "GET"
      ? betterAuthHandlers.GET(req)
      : betterAuthHandlers.POST(req);
  } catch (error) {
    console.error("[auth-route] Unhandled Better Auth error:", error);
    const redirectBase = process.env.BETTER_AUTH_URL ?? req.url;
    const target = new URL("/auth", redirectBase);
    target.searchParams.set("tab", "sign-in");
    target.searchParams.set("oauthError", "oauth_flow_failed");
    return NextResponse.redirect(target);
  }
}

export { handler as GET, handler as POST };
