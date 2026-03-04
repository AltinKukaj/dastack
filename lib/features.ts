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

function isLocalhostAuthUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "::1"
    );
  } catch {
    return false;
  }
}

function warnForPartialConfig({
  authEnabled,
  hasAnyAuthInput,
  hasAnyStripeInput,
  hasAnyCaptchaInput,
  captchaConfigured,
  captchaEnabled,
  localhostAuth,
  captchaAllowedOnLocalhost,
}: {
  authEnabled: boolean;
  hasAnyAuthInput: boolean;
  hasAnyStripeInput: boolean;
  hasAnyCaptchaInput: boolean;
  captchaConfigured: boolean;
  captchaEnabled: boolean;
  localhostAuth: boolean;
  captchaAllowedOnLocalhost: boolean;
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

  if (hasAnyCaptchaInput && !process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY) {
    warnings.push(
      "Captcha is partially configured. Set NEXT_PUBLIC_CAPTCHA_SITE_KEY to enable Turnstile.",
    );
  }

  if (
    captchaConfigured &&
    localhostAuth &&
    !captchaAllowedOnLocalhost &&
    !captchaEnabled
  ) {
    warnings.push(
      "Captcha is disabled on localhost by default. Set ENABLE_CAPTCHA_ON_LOCALHOST=true and allow localhost in Turnstile to test captcha locally.",
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
  const hasAnyCaptchaInput = !!(
    process.env.CAPTCHA_SECRET_KEY || process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY
  );
  const captchaConfigured = !!(
    process.env.CAPTCHA_SECRET_KEY && process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY
  );
  const captchaExplicitlyDisabled = process.env.DISABLE_CAPTCHA === "true";
  const localhostAuth = isLocalhostAuthUrl(process.env.BETTER_AUTH_URL);
  const captchaAllowedOnLocalhost =
    process.env.ENABLE_CAPTCHA_ON_LOCALHOST === "true";
  const captchaEnabled =
    authEnabled &&
    captchaConfigured &&
    !captchaExplicitlyDisabled &&
    (!localhostAuth || captchaAllowedOnLocalhost);

  warnForPartialConfig({
    authEnabled,
    hasAnyAuthInput,
    hasAnyStripeInput,
    hasAnyCaptchaInput,
    captchaConfigured,
    captchaEnabled,
    localhostAuth,
    captchaAllowedOnLocalhost,
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

    /** Cloudflare Turnstile bot protection (requires auth + both server secret + client site key) */
    captcha: captchaEnabled,
  };
}

export type FeatureFlags = ReturnType<typeof getFeatureFlags>;
