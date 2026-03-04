import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Lightweight health endpoint for platform liveness/readiness probes.
 *
 * Always returns HTTP 200 when the app process is reachable.
 * Includes a non-fatal DB ping signal so deploy targets can decide whether to
 * treat DB connectivity as part of readiness.
 */
export async function GET() {
  let db: "up" | "down" = "down";

  if (prisma) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      db = "up";
    } catch {
      db = "down";
    }
  }

  return NextResponse.json(
    {
      status: "ok",
      db,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
