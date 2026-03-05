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

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [
    magicLinkClient(),
    adminClient({ ac, roles: roleDefinitions }),
    twoFactorClient(),
    usernameClient(),
    anonymousClient(),
    passkeyClient(),
    stripeClient({ subscription: true }),
  ],
});

export const { signIn, signOut, signUp, useSession } = authClient;
