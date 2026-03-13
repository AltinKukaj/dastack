/**
 * Re-export the shared Prisma client for server modules.
 * All server-side database access should import from here.
 */
export { default as db } from "@/lib/prisma";
