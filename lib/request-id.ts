/**
 * Request metadata utilities.
 *
 * Extract request IDs, client IPs, and user agents from HTTP headers.
 * Used for structured logging, audit trails, and rate-limit keying.
 *
 * @module
 */

import { randomUUID } from "crypto";

/** Return the first comma-separated value from a header, or `null`. */
function firstHeaderValue(value: string | null): string | null {
  if (!value) return null;
  const [first] = value.split(",");
  return first?.trim() || null;
}

/**
 * Get or generate a request correlation ID from headers.
 *
 * Checks `x-request-id` and `x-correlation-id`, then falls back
 * to a random UUID.
 */
export function getRequestIdFromHeaders(
  hdrs: Pick<Headers, "get">,
): string {
  return (
    hdrs.get("x-request-id") ??
    hdrs.get("x-correlation-id") ??
    randomUUID()
  );
}

/**
 * Extract the client IP address from common proxy headers.
 *
 * Checks Cloudflare (`cf-connecting-ip`), then `x-real-ip`,
 * then `x-forwarded-for`. Returns `null` if none are present.
 */
export function getClientIpFromHeaders(
  hdrs: Pick<Headers, "get">,
): string | null {
  return (
    firstHeaderValue(hdrs.get("cf-connecting-ip")) ??
    firstHeaderValue(hdrs.get("x-real-ip")) ??
    firstHeaderValue(hdrs.get("x-forwarded-for"))
  );
}

/**
 * Extract the User-Agent string from headers.
 */
export function getUserAgentFromHeaders(
  hdrs: Pick<Headers, "get">,
): string | null {
  return hdrs.get("user-agent");
}

