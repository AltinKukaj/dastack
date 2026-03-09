import "server-only";

import { headers } from "next/headers";
import { auth, type Session } from "@/lib/auth";
import {
  getClientIpFromHeaders,
  getRequestIdFromHeaders,
  getUserAgentFromHeaders,
} from "@/lib/request-id";
import { db } from "@/server/db/prisma";

/**
 * Shared request context used by tRPC and server modules.
 *
 * Contains the authenticated session (if any) and a reference
 * to the database client.
 */
export interface RequestContext {
    session: Session | null;
    db: typeof db;
    requestId: string;
    ipAddress: string | null;
    userAgent: string | null;
}

/**
 * Build a request context from the incoming Next.js headers.
 * This is called once per tRPC request batch.
 */
export async function createRequestContext(): Promise<RequestContext> {
    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });

    return {
        session,
        db,
        requestId: getRequestIdFromHeaders(hdrs),
        ipAddress: getClientIpFromHeaders(hdrs),
        userAgent: getUserAgentFromHeaders(hdrs),
    };
}
