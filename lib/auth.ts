import { i18n } from "@better-auth/i18n";
import { passkey } from "@better-auth/passkey";
import { stripe } from "@better-auth/stripe";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {
  admin,
  anonymous,
  haveIBeenPwned,
  magicLink,
  twoFactor,
  username,
} from "better-auth/plugins";
import Stripe from "stripe";
import { prisma } from "./db";
import { env } from "./env";
import { getFeatureFlags } from "./features";
import { ac, roleDefinitions } from "./permissions";
import { stripePlans } from "./stripe-plans.generated";

const features = getFeatureFlags();

function createAuth() {
  if (!features.auth || !prisma) return null;

  const authUrl = new URL(env.BETTER_AUTH_URL!);
  const plugins = [];

  if (features.email) {
    plugins.push(
      magicLink({
        sendMagicLink: async ({ email, url }: { email: string; url: string }) => {
          const { sendMagicLinkEmail } = await import("./email");
          await sendMagicLinkEmail({ email, url });
        },
      }),
    );
  }

  plugins.push(haveIBeenPwned());
  plugins.push(admin({ ac, roles: roleDefinitions }));
  plugins.push(twoFactor());
  plugins.push(username());
  plugins.push(anonymous());

  if (features.passkey) {
    plugins.push(
      passkey({
        rpID: authUrl.hostname === "localhost" ? "localhost" : authUrl.hostname,
        origin: authUrl.origin,
        rpName: "dastack",
      }),
    );
  }

  plugins.push(i18n({ defaultLocale: "en", translations: { en: {} } }));

  if (features.stripe) {
    plugins.push(
      stripe({
        stripeClient: new Stripe(env.STRIPE_SECRET_KEY!),
        stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET!,
        createCustomerOnSignUp: false,
        subscription: { enabled: true, plans: stripePlans },
      }),
    );
  }

  return betterAuth({
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    experimental: { joins: true },

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      ...(features.email
        ? {
            sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
              const { sendPasswordResetEmail } = await import("./email");
              await sendPasswordResetEmail({ email: user.email, url });
            },
          }
        : {}),
    },

    ...(features.email
      ? {
          emailVerification: {
            sendOnSignUp: false,
            autoSignInAfterVerification: true,
            sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
              const { sendVerificationEmail } = await import("./email");
              await sendVerificationEmail({ email: user.email, url });
            },
          },
        }
      : {}),

    socialProviders: {
      ...(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET
        ? { discord: { clientId: env.DISCORD_CLIENT_ID, clientSecret: env.DISCORD_CLIENT_SECRET, prompt: "consent" } }
        : {}),
      ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
        : {}),
      ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
        ? { github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET } }
        : {}),
    },

    plugins,
  });
}

export const auth = createAuth();
