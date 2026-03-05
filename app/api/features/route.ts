import { NextResponse } from "next/server";
import { getFeatureFlags } from "@/lib/features";

export const dynamic = "force-dynamic";

/**
 * Exposes which optional features are enabled.
 *
 * Client components fetch this once on mount so the UI only renders
 * elements for features that are actually configured.
 * No secrets are leaked - only boolean flags.
 */
export function GET() {
  const flags = getFeatureFlags();

  return NextResponse.json(
    {
      auth: flags.auth,
      email: flags.email,
      passkey: flags.passkey,
      providers: {
        discord: flags.discord,
        google: flags.google,
        github: flags.github,
      },
      stripe: flags.stripe,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
