import { NextResponse } from "next/server";

/** Health check endpoint — returns status, timestamp, and process uptime. */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
