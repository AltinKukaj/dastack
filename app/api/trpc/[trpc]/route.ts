import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { NextResponse, type NextRequest } from "next/server";
import { createLogger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIpFromHeaders, getRequestIdFromHeaders } from "@/lib/request-id";
import { appRouter } from "@/server/api/routers/_app";
import { createTRPCContext } from "@/server/api/trpc";

const logger = createLogger("trpc-route");

async function enforceRateLimit(request: NextRequest) {
    const ipAddress = getClientIpFromHeaders(request.headers) ?? "unknown";
    const result = await checkRateLimit("api:general", ipAddress);

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
            path: request.nextUrl.pathname,
            resetAt: result.resetAt.toISOString(),
        },
        "tRPC request rate limited",
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

/**
 * Next.js App Router catch-all for tRPC.
 *
 * All tRPC requests are handled at /api/trpc/[trpc].
 */
const handler = async (req: NextRequest) => {
    const limited = await enforceRateLimit(req);
    if (limited) {
        return limited;
    }

    return fetchRequestHandler({
        endpoint: "/api/trpc",
        req,
        router: appRouter,
        createContext: createTRPCContext,
    });
};

export { handler as GET, handler as POST };
