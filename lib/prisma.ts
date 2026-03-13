/**
 * Prisma client singleton.
 *
 * Uses the PrismaPg adapter for PostgreSQL. In development, the client
 * is cached on `globalThis` to survive Next.js hot reloads without
 * exhausting database connections.
 *
 * @module
 */

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Create a fresh Prisma client wired to `DATABASE_URL`. */
function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
  });

  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

