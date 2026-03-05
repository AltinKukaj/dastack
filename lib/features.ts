/**
 * Centralized feature flags - "API key in -> feature on".
 *
 * Every optional integration is **off by default**. Drop the relevant
 * API key / credentials into `.env` and the feature lights up in the UI
 * automatically.
 *
 * Server components and API routes can call `getFeatureFlags()` directly.
 * Client components should fetch `/api/features` instead.
 *
 * @see README.md - Feature Toggles section
 */

const globalForFeatureWarnings = globalThis as unknown as {
  __dastackWarnedForPartialConfig?: boolean;
};

function warnForPartialConfig({
  authEnabled,
  hasAnyAuthInput,
  hasAnyStripeInput,
}: {
  authEnabled: boolean;
  hasAnyAuthInput: boolean;
  hasAnyStripeInput: boolean;
}) {
  if (process.env.NODE_ENV !== "development") return;
  if (globalForFeatureWarnings.__dastackWarnedForPartialConfig) return;

  const warnings: string[] = [];

  if (hasAnyAuthInput && !authEnabled) {
    warnings.push(
      "Auth is partially configured. Set DATABASE_URL + BETTER_AUTH_SECRET + BETTER_AUTH_URL together.",
    );
  }

  if (hasAnyStripeInput && !process.env.STRIPE_WEBHOOK_SECRET) {
    warnings.push(
      "Stripe is partially configured. Set STRIPE_WEBHOOK_SECRET to enable billing routes/UI.",
    );
  }

  if (warnings.length === 0) return;

  globalForFeatureWarnings.__dastackWarnedForPartialConfig = true;
  console.warn(`\n[features] ${warnings.join(" ")}`);
}

export function getFeatureFlags() {
  const hasAnyAuthInput = !!(
    process.env.DATABASE_URL ||
    process.env.BETTER_AUTH_SECRET ||
    process.env.BETTER_AUTH_URL
  );
  const authEnabled = !!(
    process.env.DATABASE_URL &&
    process.env.BETTER_AUTH_SECRET &&
    process.env.BETTER_AUTH_URL
  );
  const hasAnyStripeInput = !!(
    process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_WEBHOOK_SECRET ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );

  warnForPartialConfig({
    authEnabled,
    hasAnyAuthInput,
    hasAnyStripeInput,
  });

  return {
    /** Core authentication - requires DATABASE_URL + BETTER_AUTH_SECRET + BETTER_AUTH_URL */
    auth: authEnabled,

    /** Magic-link email auth (requires Resend + auth enabled) */
    email: authEnabled && !!process.env.RESEND_API_KEY,

    /** Passkey auth (WebAuthn). Off when DISABLE_PASSKEY=true. Default: on when auth is on. */
    passkey: authEnabled && process.env.DISABLE_PASSKEY !== "true",

    /** OAuth providers - each needs both client ID and secret (+ auth enabled) */
    discord:
      authEnabled &&
      !!(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET),
    google:
      authEnabled &&
      !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    github:
      authEnabled &&
      !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),

    /** Stripe payments & subscriptions (requires auth + both secret + webhook secret) */
    stripe:
      authEnabled &&
      !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
  };
}

export type FeatureFlags = ReturnType<typeof getFeatureFlags>;
