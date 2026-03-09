/** Shared settings helpers — types, error extractors, date/device formatters, and Banner component. */
export type ClientError = {
  message?: string;
};

export type SessionRecord = {
  token: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt?: string | Date;
  expiresAt?: string | Date;
};

export type AccountRecord = {
  providerId: string;
  accountId?: string;
  createdAt?: string | Date;
};

export type TwoFactorSetup = {
  totpURI: string;
  backupCodes: string[];
};

export type PasskeyRecord = {
  id: string;
  name?: string | null;
  createdAt?: string | Date;
  deviceType?: string | null;
  backedUp?: boolean | null;
};

export function extractError(result: unknown) {
  if (!result || typeof result !== "object" || !("error" in result)) {
    if (result && typeof result === "object" && "data" in result) {
      const data = (result as { data?: unknown }).data;
      if (data && typeof data === "object" && "error" in data) {
        return ((data as { error?: ClientError | null }).error ?? null) as ClientError | null;
      }
    }
    return null;
  }
  return ((result as { error?: ClientError | null }).error ?? null) as ClientError | null;
}

export function extractData<T>(result: unknown, fallback: T) {
  if (Array.isArray(result)) return result as T;
  if (result && typeof result === "object" && "data" in result) {
    return ((result as { data?: T | null }).data ?? fallback) as T;
  }
  return (result as T | null) ?? fallback;
}

export function formatError(result: unknown, fallback: string) {
  return extractError(result)?.message ?? fallback;
}

export function formatDate(value: string | Date | undefined) {
  if (!value) return "Unknown";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function providerLabel(providerId: string) {
  switch (providerId) {
    case "credential": return "Password";
    case "google": return "Google";
    case "github": return "GitHub";
    case "discord": return "Discord";
    default: return providerId;
  }
}

export function deviceLabel(userAgent?: string | null) {
  if (!userAgent) return "Unknown device";
  if (userAgent.includes("Windows")) return "Windows device";
  if (userAgent.includes("Mac")) return "Mac device";
  if (userAgent.includes("iPhone")) return "iPhone";
  if (userAgent.includes("Android")) return "Android device";
  if (userAgent.includes("Linux")) return "Linux device";
  return "Browser session";
}

export function formatLoginMethod(method?: string | null) {
  if (!method) return "Not available yet";
  switch (method) {
    case "credential":
    case "email": return "Password";
    case "email-otp": return "Email code";
    case "magic-link": return "Magic link";
    case "passkey": return "Passkey";
    case "google": return "Google";
    case "github": return "GitHub";
    case "discord": return "Discord";
    default: return method;
  }
}

export function formatPasskeyDevice(passkey: PasskeyRecord) {
  if (passkey.name?.trim()) return passkey.name.trim();
  if (passkey.deviceType === "multiDevice") return "Synced passkey";
  return passkey.backedUp ? "Backed-up passkey" : "Security key";
}

export function Banner({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "success" | "error";
}) {
  return (
    <div className={`rounded-md border px-4 py-3 text-[12px] ${tone === "success" ? "border-white/[0.08] bg-white/[0.03] text-zinc-300" : "border-white/[0.08] bg-white/[0.03] text-zinc-300"}`}>
      {children}
    </div>
  );
}
