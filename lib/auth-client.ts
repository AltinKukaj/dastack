import { passkeyClient } from "@better-auth/passkey/client";
import { stripeClient } from "@better-auth/stripe/client";
import {
  adminClient,
  anonymousClient,
  magicLinkClient,
  twoFactorClient,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac, roleDefinitions } from "./permissions";

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  );
}

function getResolvedAuthBaseUrl(): string | undefined {
  const configured = process.env.NEXT_PUBLIC_APP_URL;

  if (typeof window === "undefined") {
    return configured;
  }

  const currentOrigin = window.location.origin;
  if (!configured) return currentOrigin;

  try {
    const configuredUrl = new URL(configured);
    const currentUrl = new URL(currentOrigin);

    // Avoid hard-failing auth when a localhost URL is accidentally shipped
    // to production clients (or vice versa).
    const configuredLocal = isLocalHostname(configuredUrl.hostname);
    const currentLocal = isLocalHostname(currentUrl.hostname);
    if (configuredLocal !== currentLocal) {
      return currentOrigin;
    }

    return configuredUrl.origin;
  } catch {
    return currentOrigin;
  }
}

export const authClient = createAuthClient({
  baseURL: getResolvedAuthBaseUrl(),
  plugins: [
    magicLinkClient(),
    adminClient({
      ac,
      roles: roleDefinitions,
    }),
    twoFactorClient(),
    usernameClient(),
    anonymousClient(),
    passkeyClient(),
    stripeClient({ subscription: true }),
  ],
});

// Core helpers – used across sign-in, sign-up, and dashboard pages
export const { signIn, signOut, signUp, useSession } = authClient;

// ─── Additional auth methods available on authClient ──────────────────────────
//
// Password management:
//   authClient.requestPasswordReset({ email, redirectTo })
//   authClient.resetPassword({ newPassword })
//   authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions })
//
// Email verification:
//   authClient.sendVerificationEmail({ email, callbackURL })
//
// Two-factor authentication:
//   authClient.twoFactor.enable({ password })       -> { totpURI, backupCodes }
//   authClient.twoFactor.disable({ password })
//   authClient.twoFactor.verifyTotp({ code })
//   authClient.twoFactor.getTotpUri({ password })
//
// Session management:
//   authClient.listSessions()
//   authClient.revokeSession({ token })
//   authClient.revokeSessions()
//
// Username:
//   authClient.updateUser({ username })
//
// Anonymous:
//   authClient.signIn.anonymous()
//   authClient.linkAccount({ ... })
//
// Passkeys:
//   authClient.signIn.passkey({ autoFill?: boolean })
//   authClient.passkey.addPasskey({ name?, authenticatorAttachment? })
//   authClient.passkey.listUserPasskeys()
//   authClient.passkey.deletePasskey({ id })
