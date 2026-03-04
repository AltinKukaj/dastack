import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../generated/prisma/client";

/**
 * Singleton Prisma client.
 *
 * Returns `null` when DATABASE_URL is not set (auth/db features disabled).
 *
 * In development, Next.js HMR re-evaluates modules on every save. Without a
 * singleton, each reload spawns a new PrismaClient -> a new PG connection,
 * quickly hitting the "too many clients" limit.
 *
 * In production (serverless), this module-level cache is shared within a single
 * Lambda / serverless function instance. For true connection pooling at scale,
 * consider adding:
 *
 *   - PgBouncer: lightweight PG connection pooler you run alongside your DB.
 *   - Neon: serverless Postgres with built-in connection pooling.
 *   - Prisma Accelerate: managed connection pooling + caching by Prisma.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient | null {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}
