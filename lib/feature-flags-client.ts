export type ClientFeatureFlags = {
  auth: boolean;
  email: boolean;
  passkey: boolean;
  stripe: boolean;
  providers: { discord: boolean; google: boolean; github: boolean };
};

const defaults: ClientFeatureFlags = {
  auth: false,
  email: false,
  passkey: false,
  stripe: false,
  providers: { discord: false, google: false, github: false },
};

let cached: ClientFeatureFlags | null = null;

export async function getClientFeatureFlags(): Promise<ClientFeatureFlags> {
  if (cached) return cached;

  try {
    const res = await fetch("/api/features", { cache: "no-store" });
    if (!res.ok) return defaults;
    const data = await res.json();
    cached = {
      auth: data.auth === true,
      email: data.email === true,
      passkey: data.passkey === true,
      stripe: data.stripe === true,
      providers: {
        discord: data.providers?.discord === true,
        google: data.providers?.google === true,
        github: data.providers?.github === true,
      },
    };
    return cached;
  } catch {
    return defaults;
  }
}
