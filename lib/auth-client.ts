/**
 * Client-side Better Auth SDK.
 *
 * Creates the auth client with all feature plugins pre-loaded.
 * Client plugins are tree-shaken at build time when unused,
 * so including them unconditionally is safe.
 *
 * @module
 */

import { createAuthClient } from "better-auth/react";
import {
  usernameClient,
  anonymousClient,
  magicLinkClient,
  emailOTPClient,
  twoFactorClient,
  adminClient,
  organizationClient,
  lastLoginMethodClient,
} from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import { stripeClient } from "@better-auth/stripe/client";

/** Singleton auth client instance for use in client components. */
export const authClient = createAuthClient({
  basePath: "/api/auth",
  plugins: [
    usernameClient(),
    anonymousClient(),
    magicLinkClient(),
    emailOTPClient(),
    passkeyClient(),
    twoFactorClient(),
    adminClient(),
    organizationClient(),
    lastLoginMethodClient(),
    stripeClient({ subscription: true }),
  ],
});

/** Convenience re-exports for common auth actions. */
export const { signIn, signUp, signOut, useSession } = authClient;

