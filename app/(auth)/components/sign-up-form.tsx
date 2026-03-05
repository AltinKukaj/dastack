"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { signIn, signUp } from "@/lib/auth-client";
import { getClientFeatureFlags } from "@/lib/feature-flags-client";
import { DiscordIcon, GitHubIcon, GoogleIcon } from "./icons";
import { SocialButton, Spinner } from "./shared";

type SocialProvider = "discord" | "google" | "github";

interface ProviderConfig {
  discord: boolean;
  google: boolean;
  github: boolean;
}

interface AuthConfig {
  emailEnabled: boolean;
  providers: ProviderConfig;
}

interface SignUpFormProps {
  callbackURL: string;
}

function getSocialRedirectUrl(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;

  const directUrl =
    "url" in result && typeof result.url === "string" ? result.url : null;
  if (directUrl) return directUrl;

  if (!("data" in result) || !result.data || typeof result.data !== "object") {
    return null;
  }

  return "url" in result.data && typeof result.data.url === "string"
    ? result.data.url
    : null;
}

function getSocialStartUrl(
  provider: SocialProvider,
  callbackURL: string,
): string {
  const params = new URLSearchParams({
    provider,
    callbackURL,
  });
  return `/api/auth/sign-in/social?${params.toString()}`;
}

export function SignUpForm({ callbackURL }: SignUpFormProps) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState<"email" | SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState<AuthConfig | null>(null);

  useEffect(() => {
    getClientFeatureFlags()
      .then((data) =>
        setConfig({
          emailEnabled: data.email ?? false,
          providers: data.providers,
        }),
      )
      .catch(() =>
        setConfig({
          emailEnabled: false,
          providers: { discord: false, google: false, github: false },
        }),
      );
  }, []);

  const handleEmailSignUp = async () => {
    if (!name.trim() || !email.trim() || !password) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setError(null);
    setLoading("email");

    try {
      const result = await signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
        ...(username.trim() ? { username: username.trim() } : {}),
        callbackURL,
      });

      if (result.error) {
        throw new Error(result.error.message ?? "Sign up failed.");
      }

      if (config?.emailEnabled) {
        setSuccess(true);
      } else {
        window.location.href = callbackURL;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(null);
    }
  };

  const handleSocial = async (provider: SocialProvider) => {
    setError(null);
    setLoading(provider);
    try {
      const result = await signIn.social({
        provider,
        callbackURL,
      });

      const redirectUrl = getSocialRedirectUrl(result);
      if (redirectUrl) {
        window.location.assign(redirectUrl);
        return;
      }

      // Fallback to server route when client redirect URL is unavailable.
      window.location.assign(getSocialStartUrl(provider, callbackURL));
      return;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      const normalized = message.toLowerCase();
      if (
        normalized.includes("failed to fetch") ||
        normalized.includes("networkerror")
      ) {
        window.location.assign(getSocialStartUrl(provider, callbackURL));
        return;
      }
      if (
        normalized.includes("please_restart_the_process") ||
        normalized.includes("state")
      ) {
        setError(
          "Social sign-up session expired. Please try again (this refreshes the OAuth state cookie).",
        );
      } else if (normalized.includes("403")) {
        setError(
          "Social sign-up was blocked by browser/network security settings. Try a different browser or relax strict privacy blocking and retry.",
        );
      } else {
        setError(message);
      }
      setLoading(null);
    }
  };

  const socialButtons: {
    key: SocialProvider;
    icon: ReactNode;
    label: string;
  }[] = [
    { key: "discord", icon: <DiscordIcon />, label: "Continue with Discord" },
    { key: "google", icon: <GoogleIcon />, label: "Continue with Google" },
    { key: "github", icon: <GitHubIcon />, label: "Continue with GitHub" },
  ];

  const enabledSocials = config
    ? socialButtons.filter((b) => config.providers[b.key])
    : [];

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="size-6 text-white"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
            />
          </svg>
        </div>
        <div>
          <p className="font-[family-name:var(--font-geist-mono)] text-sm text-white">
            Check your inbox
          </p>
          <p className="mt-1.5 text-sm text-neutral-400">
            We sent a verification link to{" "}
            <span className="text-neutral-200">{email}</span>. Click it to
            activate your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div>
          <label
            htmlFor="signup-name"
            className="mb-1.5 block text-xs text-neutral-600"
          >
            Full name
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-neutral-700 outline-none transition focus:border-neutral-600"
          />
        </div>

        <div>
          <label
            htmlFor="signup-username"
            className="mb-1.5 block text-xs text-neutral-600"
          >
            Username <span className="text-neutral-700">(optional)</span>
          </label>
          <input
            id="signup-username"
            type="text"
            autoComplete="username"
            placeholder="janedoe"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-neutral-700 outline-none transition focus:border-neutral-600"
          />
        </div>

        <div>
          <label
            htmlFor="signup-email"
            className="mb-1.5 block text-xs text-neutral-600"
          >
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-neutral-700 outline-none transition focus:border-neutral-600"
          />
        </div>

        <div>
          <label
            htmlFor="signup-password"
            className="mb-1.5 block text-xs text-neutral-600"
          >
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-neutral-700 outline-none transition focus:border-neutral-600"
          />
        </div>

        <div>
          <label
            htmlFor="signup-confirm-password"
            className="mb-1.5 block text-xs text-neutral-600"
          >
            Confirm password
          </label>
          <input
            id="signup-confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEmailSignUp()}
            className="w-full rounded-lg border border-neutral-800 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-neutral-700 outline-none transition focus:border-neutral-600"
          />
        </div>

        <button
          type="button"
          disabled={
            loading === "email" ||
            !name.trim() ||
            !email.trim() ||
            !password ||
            !confirmPassword
          }
          onClick={handleEmailSignUp}
          className="mt-1 w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "email" ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner dark /> Creating account...
            </span>
          ) : (
            "Create account"
          )}
        </button>

        <p className="text-xs text-neutral-600">
          Passwords are checked against known breaches via{" "}
          <span className="text-neutral-500">HaveIBeenPwned</span>.
        </p>
      </div>

      {enabledSocials.length > 0 && (
        <>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-800" />
            <span className="text-[11px] text-neutral-600">or</span>
            <div className="h-px flex-1 bg-neutral-800" />
          </div>
          <div className="flex flex-col gap-2.5">
            {enabledSocials.map((b) => (
              <SocialButton
                key={b.key}
                onClick={() => handleSocial(b.key)}
                loading={loading === b.key}
                icon={b.icon}
                label={b.label}
              />
            ))}
          </div>
        </>
      )}

      {error && (
        <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2.5 text-center text-sm text-red-300">
          {error}
        </p>
      )}

      <p className="text-center text-[11px] text-neutral-600">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="text-neutral-500 hover:text-white">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-neutral-500 hover:text-white">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
