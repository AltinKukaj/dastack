/**
 * Centralized feature flags -- "env key in -> feature on".
 *
 * Server components and API routes call getFeatureFlags() directly.
 * Client components fetch /api/features instead.
 */
export function getFeatureFlags() {
  const authEnabled = !!(
    process.env.DATABASE_URL &&
    process.env.BETTER_AUTH_SECRET &&
    process.env.BETTER_AUTH_URL
  );

  return {
    auth: authEnabled,
    email: authEnabled && !!process.env.RESEND_API_KEY,
    passkey: authEnabled && process.env.DISABLE_PASSKEY !== "true",
    discord: authEnabled && !!(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET),
    google: authEnabled && !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    github: authEnabled && !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    stripe: authEnabled && !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
  };
}

export type FeatureFlags = ReturnType<typeof getFeatureFlags>;
