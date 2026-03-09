import { hasConfiguredStripePlans } from "@/lib/plans";

/**
 * Configuration-aware feature flags.
 *
 * Credential-backed features enable automatically when their required keys
 * exist. Boolean flags only turn on for explicit true-ish values so
 * `ENABLE_FOO=false` behaves correctly in starter deployments.
 */

function hasValue(key: string): boolean {
  return typeof process.env[key] === "string" && process.env[key]!.trim().length > 0;
}

function isEnabledFlag(key: string): boolean {
  const raw = process.env[key]?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes" || raw === "on";
}

function hasStripeCredentials() {
  return hasValue("STRIPE_SECRET_KEY") && hasValue("STRIPE_WEBHOOK_SECRET");
}

export interface StripeBillingReadiness {
  stripeConfigured: boolean;
  stripePlansReady: boolean;
  checkoutEnabled: boolean;
}

export function getStripeBillingReadiness(): StripeBillingReadiness {
  const stripeConfigured = hasStripeCredentials();
  const stripePlansReady = hasConfiguredStripePlans();

  return {
    stripeConfigured,
    stripePlansReady,
    checkoutEnabled: stripeConfigured && stripePlansReady,
  };
}

export function getFeatureFlags() {
  const readiness = getStripeBillingReadiness();

  return {
    stripe: readiness.stripeConfigured,
    email: hasValue("RESEND_API_KEY"),
    google: hasValue("GOOGLE_CLIENT_ID"),
    github: hasValue("GITHUB_CLIENT_ID"),
    discord: hasValue("DISCORD_CLIENT_ID"),
    organizations: isEnabledFlag("ENABLE_ORGANIZATIONS"),
    redis: isEnabledFlag("ENABLE_REDIS_CACHE"),
    uploads: hasValue("UPLOADTHING_TOKEN"),
    adminPanel: isEnabledFlag("ENABLE_ADMIN_PANEL"),
  };
}

export type FeatureFlags = ReturnType<typeof getFeatureFlags>;

export function isPaymentsEnabled(): boolean {
  return getStripeBillingReadiness().stripeConfigured;
}

export function isStripeCheckoutEnabled(): boolean {
  return getStripeBillingReadiness().checkoutEnabled;
}

export function isOrganizationsEnabled(): boolean {
  return getFeatureFlags().organizations;
}

export function isRedisEnabled(): boolean {
  return getFeatureFlags().redis;
}

export function isUploadsEnabled(): boolean {
  return getFeatureFlags().uploads;
}

export function isAdminPanelEnabled(): boolean {
  return getFeatureFlags().adminPanel;
}
