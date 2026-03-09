/**
 * Core Better Auth configuration.
 *
 * Builds the auth instance with conditional plugins (Stripe, Polar,
 * passkeys, organizations, etc.) based on environment variables.
 * This is the single server-side entry point for all authentication.
 *
 * @module
 */

import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import {
  admin,
  anonymous,
  emailOTP,
  haveIBeenPwned,
  lastLoginMethod,
  magicLink,
  organization,
  twoFactor,
  username,
} from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";

import {
  changeEmailConfirmationEmail,
  deleteAccountVerificationEmail,
  existingUserSignUpEmail,
  magicLinkEmail,
  orgInvitationEmail,
  otpEmail,
  passwordResetEmail,
  sendEmail,
  twoFactorEmail,
  verificationEmail,
} from "@/lib/email";
import { APP_NAME } from "@/lib/config";
import { env } from "@/lib/env";
import { isOrganizationsEnabled, isPaymentsEnabled } from "@/lib/features";
import { getStripePlans } from "@/lib/plans";
import prisma from "@/lib/prisma";
import {
  handleStripeBillingWebhook,
} from "@/server/modules/billing/billing-webhooks.service";
import { createLogger } from "@/lib/logger";

const log = createLogger("auth");

const TAG = "[auth]";

type SocialProviders = NonNullable<
  Parameters<typeof betterAuth>[0]["socialProviders"]
>;

function logEnabled(label: string, enabled: boolean) {
  log.debug({ enabled }, `%s is ${enabled ? "enabled" : "disabled"}`, label.padEnd(18));
}

function buildSocialProviders(): SocialProviders {
  const providers: SocialProviders = {};

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    };
  }

  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    providers.github = {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    };
  }

  if (env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET) {
    providers.discord = {
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    };
  }

  return providers;
}

function buildStripePlugin(): BetterAuthPlugin | null {
  const secretKey = env.STRIPE_SECRET_KEY;
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  if (!isPaymentsEnabled() || !secretKey || !webhookSecret) return null;

  const stripeClient = new Stripe(secretKey, {
    apiVersion: "2026-02-25.clover",
  });

  return stripe({
    stripeClient,
    stripeWebhookSecret: webhookSecret,
    createCustomerOnSignUp: true,
    onEvent: async (event) => {
      await handleStripeBillingWebhook(event);
    },
    subscription: {
      enabled: true,
      plans: getStripePlans(),
      authorizeReference: async () => true,
    },
  });
}

function buildPasskeyPlugin(): BetterAuthPlugin {
  const { hostname } = new URL(env.BETTER_AUTH_URL);

  return passkey({
    origin: env.BETTER_AUTH_URL,
    rpID: hostname,
    rpName: APP_NAME,
  });
}

function buildOrganizationPlugin(): BetterAuthPlugin | null {
  if (!isOrganizationsEnabled()) return null;

  return organization({
    async sendInvitationEmail(data) {
      log.info({ orgId: data.organization.id, to: data.email }, "Sending organization invitation email");
      const inviteLink = `${env.BETTER_AUTH_URL}/accept-invitation/${data.id}`;
      const inviterName = data.inviter.user.name ?? "A team member";
      const orgName = data.organization.name;
      const { subject, html } = orgInvitationEmail(inviterName, orgName, inviteLink);
      await sendEmail({ to: data.email, subject, html });
    },
  });
}

function buildPlugins(): BetterAuthPlugin[] {
  const plugins: Array<BetterAuthPlugin | null> = [
    username(),
    anonymous(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        log.info({ to: email }, "Sending magic link email");
        const { subject, html } = magicLinkEmail(url);
        await sendEmail({ to: email, subject, html });
      },
    }),
    emailOTP({
      allowedAttempts: 5,
      disableSignUp: true,
      async sendVerificationOTP({ email, otp, type }) {
        log.info({ to: email, type }, "Sending verification OTP email");
        const { subject, html } = otpEmail(otp, type);
        await sendEmail({ to: email, subject, html });
      },
    }),
    buildPasskeyPlugin(),
    twoFactor({
      issuer: APP_NAME,
      otpOptions: {
        async sendOTP({ user, otp }) {
          log.info({ to: user.email }, "Sending 2FA OTP email");
          const { subject, html } = twoFactorEmail(otp);
          await sendEmail({ to: user.email, subject, html });
        },
      },
    }),
    admin(),
    lastLoginMethod({ storeInDatabase: true }),
    haveIBeenPwned(),
    buildOrganizationPlugin(),
    buildStripePlugin(),
    nextCookies(),
  ];

  return plugins.filter((plugin): plugin is BetterAuthPlugin => plugin !== null);
}

const socialProviders = buildSocialProviders();
const plugins = buildPlugins();

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  appName: APP_NAME,
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  logger: {
    disabled: process.env.NODE_ENV === "test",
    level: process.env.NODE_ENV === "development" ? "debug" : "info",
  },
  session: {
    freshAge: 60 * 30,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    customSyntheticUser: ({ coreFields, additionalFields, id }) => ({
      ...coreFields,
      username: null,
      displayUsername: null,
      isAnonymous: false,
      twoFactorEnabled: false,
      role: "user",
      banned: false,
      banReason: null,
      banExpires: null,
      lastLoginMethod: null,
      stripeCustomerId: null,
      ...additionalFields,
      id,
    }),
    onExistingUserSignUp: async ({ user }) => {
      log.info({ to: user.email }, "Sending existing user sign up email");
      const { subject, html } = existingUserSignUpEmail();
      await sendEmail({ to: user.email, subject, html });
    },
    sendResetPassword: async ({ user, url }) => {
      log.info({ to: user.email }, "Sending reset password email");
      const { subject, html } = passwordResetEmail(url);
      await sendEmail({ to: user.email, subject, html });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }) => {
      log.info({ to: user.email }, "Sending verification email");
      const { subject, html } = verificationEmail(url);
      await sendEmail({ to: user.email, subject, html });
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        log.info({ to: user.email, newEmail }, "Sending change email confirmation");
        const { subject, html } = changeEmailConfirmationEmail(newEmail, url);
        await sendEmail({ to: user.email, subject, html });
      },
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url }) => {
        log.info({ to: user.email }, "Sending delete account verification email");
        const { subject, html } = deleteAccountVerificationEmail(url);
        await sendEmail({ to: user.email, subject, html });
      },
    },
  },
  socialProviders,
  plugins,
});

export type Session = typeof auth.$Infer.Session;

if (process.env.NODE_ENV === "development") {
  log.debug(`Initializing DaStack auth at ${env.BETTER_AUTH_URL}`);
  logEnabled("Email (Resend)", !!env.RESEND_API_KEY);
  logEnabled("Google OAuth", !!socialProviders.google);
  logEnabled("GitHub OAuth", !!socialProviders.github);
  logEnabled("Discord OAuth", !!socialProviders.discord);
  logEnabled("Stripe", !!env.STRIPE_SECRET_KEY);
  logEnabled("Organizations", isOrganizationsEnabled());
  log.debug("Plugins: %s", plugins.map((plugin) => plugin.id).join(", "));
}
