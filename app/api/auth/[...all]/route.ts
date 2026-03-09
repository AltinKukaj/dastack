import { auth } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIpFromHeaders, getRequestIdFromHeaders } from "@/lib/request-id";
import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse, type NextRequest } from "next/server";

const logger = createLogger("auth-route");
const authHandler = toNextJsHandler(auth);

function getAuthPath(request: NextRequest): string {
  return request.nextUrl.pathname.replace(/^\/api\/auth/, "") || "/";
}

function getRateLimitScope(path: string): string | null {
  if (
    path === "/sign-in/email" ||
    path === "/sign-in/username" ||
    path === "/sign-in/email-otp"
  ) {
    return "auth:signin";
  }

  if (path === "/sign-up/email") {
    return "auth:signup";
  }

  if (
    path === "/forget-password" ||
    path === "/email-otp/request-password-reset" ||
    path === "/forget-password/email-otp"
  ) {
    return "auth:password-reset";
  }

  if (
    path === "/sign-in/magic-link" ||
    path === "/magic-link/verify"
  ) {
    return "auth:magic-link";
  }

  if (
    path === "/send-verification-email" ||
    path === "/email-otp/send-verification-otp" ||
    path.startsWith("/two-factor/")
  ) {
    return "auth:otp";
  }

  if (path.startsWith("/subscription/")) {
    return "api:general";
  }

  return null;
}

async function extractIdentifier(request: NextRequest): Promise<string | null> {
  try {
    const body = (await request.clone().json()) as Record<string, unknown>;

    const candidates = [
      body.email,
      body.newEmail,
      body.username,
    ];

    for (const value of candidates) {
      if (typeof value === "string" && value.length > 0) {
        return value.toLowerCase();
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function enforceRateLimit(request: NextRequest) {
  const path = getAuthPath(request);
  const scope = getRateLimitScope(path);
  if (!scope) return null;

  const ipAddress = getClientIpFromHeaders(request.headers) ?? "unknown";
  const identifier = await extractIdentifier(request);
  const key = identifier ? `${ipAddress}:${identifier}` : ipAddress;
  const result = await checkRateLimit(scope, key);

  if (result.allowed) {
    return null;
  }

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
  );

  logger.warn(
    {
      requestId: getRequestIdFromHeaders(request.headers),
      ipAddress,
      path,
      scope,
      resetAt: result.resetAt.toISOString(),
    },
    "auth request rate limited",
  );

  return NextResponse.json(
    {
      error: "Too many requests",
      resetAt: result.resetAt.toISOString(),
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": result.resetAt.toISOString(),
      },
    },
  );
}

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;

  return authHandler.GET(request);
}

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;

  return authHandler.POST(request);
}
