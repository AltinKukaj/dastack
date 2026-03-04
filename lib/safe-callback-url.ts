const LOCAL_BASE_URL = "http://localhost";

/**
 * Accept only local, relative callback paths.
 *
 * Prevents open-redirects by rejecting absolute URLs and malformed values.
 */
export function getSafeCallbackUrl(
  candidate: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!candidate) return fallback;

  const value = candidate.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;

  try {
    const parsed = new URL(value, LOCAL_BASE_URL);
    if (parsed.origin !== LOCAL_BASE_URL) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
