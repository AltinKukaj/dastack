/** Login entry point — resolves OAuth providers from env and determines the initial auth view. */
import { env } from "@/lib/env";
import { normalizeInternalRedirect } from "@/lib/auth-redirect";
import AuthPage from "./auth-page";

export type AuthConfig = {
  providers: {
    google: boolean;
    github: boolean;
    discord: boolean;
  };
};

interface Props {
  searchParams: Promise<{
    tab?: string;
    view?: string;
    callbackUrl?: string;
    verified?: string;
    reset?: string;
  }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;

  const config: AuthConfig = {
    providers: {
      google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      github: !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
      discord: !!(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET),
    },
  };

  const initialView =
    params.view === "forgot-password"
      ? "forgot-password"
      : params.view === "two-factor"
        ? "two-factor"
        : params.tab === "sign-up"
          ? "sign-up"
          : "sign-in";

  return (
    <AuthPage
      config={config}
      initialView={initialView}
      callbackUrl={normalizeInternalRedirect(
        params.callbackUrl,
        "/dashboard",
        env.NEXT_PUBLIC_APP_URL,
      )}
      status={{
        verified: params.verified === "1",
        reset: params.reset === "success",
      }}
    />
  );
}
