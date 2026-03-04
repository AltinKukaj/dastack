import { i18n } from "@better-auth/i18n";
import { passkey } from "@better-auth/passkey";
import { stripe } from "@better-auth/stripe";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {
  admin,
  anonymous,
  captcha,
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

function requireValue(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`[auth] Missing required env: ${name}`);
  }
  return value;
}

/**
 * Better Auth server instance.
 *
 * When the auth feature is disabled (missing DATABASE_URL, BETTER_AUTH_SECRET,
 * or BETTER_AUTH_URL), `auth` is `null`. All consumers must check for this.
 */
function createAuth() {
  if (!features.auth) return null;

  const authUrl = new URL(requireValue(env.BETTER_AUTH_URL, "BETTER_AUTH_URL"));
  if (!prisma) return null;

  const plugins = [];

  if (features.email) {
    plugins.push(
      magicLink({
        sendMagicLink: async ({
          email,
          url,
        }: {
          email: string;
          url: string;
        }) => {
          const { sendMagicLinkEmail } = await import("./email");
          await sendMagicLinkEmail({ email, url });
        },
      }),
    );
  }

  plugins.push(haveIBeenPwned());
  plugins.push(
    admin({
      ac,
      roles: roleDefinitions,
    }),
  );
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

  if (features.captcha) {
    const captchaSecret = requireValue(
      env.CAPTCHA_SECRET_KEY,
      "CAPTCHA_SECRET_KEY",
    );
    plugins.push(
      captcha({
        provider: "cloudflare-turnstile",
        secretKey: captchaSecret,
        endpoints: ["/sign-in/magic-link", "/sign-in/social"],
      }),
    );
  }

  plugins.push(
    i18n({
      defaultLocale: "en",
      translations: {
        en: {},
      },
    }),
  );

  if (features.stripe) {
    const stripeSecret = requireValue(
      env.STRIPE_SECRET_KEY,
      "STRIPE_SECRET_KEY",
    );
    const stripeWebhookSecret = requireValue(
      env.STRIPE_WEBHOOK_SECRET,
      "STRIPE_WEBHOOK_SECRET",
    );
    plugins.push(
      stripe({
        stripeClient: new Stripe(stripeSecret),
        stripeWebhookSecret,
        createCustomerOnSignUp: false,
        subscription: {
          enabled: true,
          plans: stripePlans,
        },
      }),
    );
  }

  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    experimental: {
      joins: true,
    },

    emailAndPassword: {
      enabled: true,
      ...(features.email
        ? {
            sendResetPassword: async ({
              user,
              url,
            }: {
              user: { email: string };
              url: string;
            }) => {
              const { sendPasswordResetEmail } = await import("./email");
              await sendPasswordResetEmail({ email: user.email, url });
            },
          }
        : {}),
    },

    ...(features.email
      ? {
          emailVerification: {
            sendOnSignUp: true,
            autoSignInAfterVerification: true,
            sendVerificationEmail: async ({
              user,
              url,
            }: {
              user: { email: string };
              url: string;
            }) => {
              const mod = await import("./email");
              await mod.sendVerificationEmail({ email: user.email, url });
            },
          },
        }
      : {}),

    socialProviders: {
      ...(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET
        ? {
            discord: {
              clientId: env.DISCORD_CLIENT_ID,
              clientSecret: env.DISCORD_CLIENT_SECRET,
            },
          }
        : {}),
      ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: env.GOOGLE_CLIENT_ID,
              clientSecret: env.GOOGLE_CLIENT_SECRET,
            },
          }
        : {}),
      ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
        ? {
            github: {
              clientId: env.GITHUB_CLIENT_ID,
              clientSecret: env.GITHUB_CLIENT_SECRET,
            },
          }
        : {}),
    },

    plugins,
  });
}

export const auth = createAuth();
