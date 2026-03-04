type ProviderFlags = {
  discord: boolean;
  google: boolean;
  github: boolean;
};

export type ClientFeatureFlags = {
  auth: boolean;
  email: boolean;
  passkey: boolean;
  stripe: boolean;
  captcha: boolean;
  captchaSiteKey: string | null;
  providers: ProviderFlags;
};

const defaultFeatureFlags: ClientFeatureFlags = {
  auth: false,
  email: false,
  passkey: false,
  stripe: false,
  captcha: false,
  captchaSiteKey: null,
  providers: {
    discord: false,
    google: false,
    github: false,
  },
};

let cachedFeatureFlags: ClientFeatureFlags | null = null;
let inFlightFeatureFlags: Promise<ClientFeatureFlags> | null = null;

function toBoolean(value: unknown): boolean {
  return value === true;
}

function normalizeFeatureFlags(payload: unknown): ClientFeatureFlags {
  if (!payload || typeof payload !== "object") return defaultFeatureFlags;

  const data = payload as Record<string, unknown>;
  const providersRaw =
    data.providers && typeof data.providers === "object"
      ? (data.providers as Record<string, unknown>)
      : {};

  return {
    auth: toBoolean(data.auth),
    email: toBoolean(data.email),
    passkey: toBoolean(data.passkey),
    stripe: toBoolean(data.stripe),
    captcha: toBoolean(data.captcha),
    captchaSiteKey:
      typeof data.captchaSiteKey === "string" ? data.captchaSiteKey : null,
    providers: {
      discord: toBoolean(providersRaw.discord),
      google: toBoolean(providersRaw.google),
      github: toBoolean(providersRaw.github),
    },
  };
}

export async function getClientFeatureFlags(): Promise<ClientFeatureFlags> {
  if (cachedFeatureFlags) return cachedFeatureFlags;
  if (inFlightFeatureFlags) return inFlightFeatureFlags;

  inFlightFeatureFlags = fetch("/api/features", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Feature flag request failed (${response.status})`);
      }
      return response.json();
    })
    .then((payload) => {
      const normalized = normalizeFeatureFlags(payload);
      cachedFeatureFlags = normalized;
      return normalized;
    })
    .catch(() => {
      cachedFeatureFlags = defaultFeatureFlags;
      return defaultFeatureFlags;
    })
    .finally(() => {
      inFlightFeatureFlags = null;
    });

  return inFlightFeatureFlags;
}
