/**
 * Safe redirect normalization.
 *
 * Prevents open-redirect attacks by only allowing internal paths
 * or same-origin absolute URLs when an `allowedOrigin` is provided.
 *
 * @module
 */

/**
 * Normalize a redirect URL to a safe internal path.
 *
 * @param input         - Raw redirect value (from a query string, etc.)
 * @param fallback      - Path to redirect to when `input` is invalid (default: `/dashboard`)
 * @param allowedOrigin - If provided, absolute URLs matching this origin are allowed
 * @returns A safe relative path (never an external URL)
 */
export function normalizeInternalRedirect(
  input: string | null | undefined,
  fallback = "/dashboard",
  allowedOrigin?: string,
) {
  if (!input) return fallback;

  if (input.startsWith("/") && !input.startsWith("//")) {
    return input;
  }

  if (!allowedOrigin) {
    return fallback;
  }

  try {
    const base = new URL(allowedOrigin);
    const url = new URL(input, allowedOrigin);

    if (url.origin !== base.origin) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

