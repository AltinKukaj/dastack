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
import { authDebugClient } from "./auth-debug-client";
import { ac, roleDefinitions } from "./permissions";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
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

if (typeof window !== "undefined") {
  authDebugClient("auth_client.init", {
    configuredBaseUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
    windowOrigin: window.location.origin,
  });
}

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
