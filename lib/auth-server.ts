import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, type Session } from "@/lib/auth";

/**
 * Retrieve the current session in a Server Component or Route Handler.
 * Returns `null` when the user is not authenticated.
 */
export async function getSession(): Promise<Session | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/**
 * Guard that redirects unauthenticated visitors.
 * Use at the top of any protected Server Component or layout.
 *
 * @param redirectTo - Where to send unauthenticated users (default: `/login`)
 */
export async function requireAuth(
  redirectTo = "/login",
): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(redirectTo);
  return session;
}

/**
 * Guard that requires an admin role.
 * Redirects to `redirectTo` when the user lacks the "admin" role.
 */
export async function requireAdmin(redirectTo = "/"): Promise<Session> {
  const session = await requireAuth(redirectTo);
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") redirect(redirectTo);
  return session;
}
