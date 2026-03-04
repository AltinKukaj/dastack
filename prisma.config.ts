import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // process.env reads from .env (via dotenv) locally and from real env vars in CI/production.
    // The fallback lets `prisma generate` and `prisma validate` succeed without a real DATABASE_URL
    // - those commands only need the schema, not an actual database connection.
    url: process.env.DATABASE_URL ?? "postgresql://",
  },
});
