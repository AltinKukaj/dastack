"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { authClient, signIn } from "@/lib/auth-client";
import { authDebugClient } from "@/lib/auth-debug-client";
import { getClientFeatureFlags } from "@/lib/feature-flags-client";
import { DiscordIcon, GitHubIcon, GoogleIcon } from "./icons";
import { SocialButton, Spinner } from "./shared";

type SocialProvider = "discord" | "google" | "github";
type AuthMode = "password" | "magic";

interface ProviderConfig {
  discord: boolean;
  google: boolean;
  github: boolean;
}

interface AuthConfig {
  emailEnabled: boolean;
  passkeyEnabled: boolean;
  providers: ProviderConfig;
}

interface SignInFormProps {
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

function maskEmail(email: string): string {
  const value = email.trim();
  const [local, domain] = value.split("@");
  if (!local || !domain) return value;
  if (local.length <= 2) return `${local[0] ?? "*"}*@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

export function SignInForm({ callbackURL }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>("password");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState<
    "password" | "magic" | "passkey" | SocialProvider | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<AuthConfig | null>(null);

  const [twoFactorPending, setTwoFactorPending] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  const getPasskeyErrorMessage = (err: unknown): string => {
    const message =
      err instanceof Error ? err.message : "Passkey sign-in failed.";
    const normalized = message.toLowerCase();
    if (
      normalized.includes("p2021") ||
      normalized.includes("public.passkey") ||
      normalized.includes("passkey")
    ) {
      return "Passkey data is unavailable in this database. Run `bun db:push` to create missing tables or set DISABLE_PASSKEY=true in .env.";
    }
    return message;
  };

  useEffect(() => {
    authDebugClient("sign_in.features.load.start", { callbackURL });
    getClientFeatureFlags()
      .then((data) => {
        authDebugClient("sign_in.features.load.success", {
          callbackURL,
          flags: data,
        });
        setConfig({
          emailEnabled: data.email ?? false,
          passkeyEnabled: data.passkey ?? false,
          providers: data.providers,
        });
      })
      .catch((error) => {
        authDebugClient("sign_in.features.load.error", {
          callbackURL,
          error: error instanceof Error ? error.message : String(error),
        });
        setConfig({
          emailEnabled: false,
          passkeyEnabled: false,
          providers: { discord: false, google: false, github: false },
        });
      });
  }, [callbackURL]);

  useEffect(() => {
    if (!config?.passkeyEnabled) return;
    if (typeof window === "undefined") return;
    if (!window.isSecureContext) return;
    if (!("PublicKeyCredential" in window)) return;

    const maybeCredentialApi =
      PublicKeyCredential as typeof PublicKeyCredential & {
        isConditionalMediationAvailable?: () => Promise<boolean>;
      };

    if (!maybeCredentialApi.isConditionalMediationAvailable) return;

    void maybeCredentialApi
      .isConditionalMediationAvailable()
      .then((supported) => {
        if (!supported) return;
        return authClient.signIn.passkey({
          autoFill: true,
          fetchOptions: {
            onSuccess: () => {
              window.location.href = callbackURL;
            },
          },
        });
      })
      .catch(() => {});
  }, [callbackURL, config?.passkeyEnabled]);

  const handlePasswordSignIn = async () => {
    if (!email.trim() || !password) return;
    setError(null);
    setLoading("password");
    authDebugClient("sign_in.password.start", {
      email: maskEmail(email),
      callbackURL,
    });

    try {
      const result = await signIn.email({
        email: email.trim(),
        password,
        callbackURL,
      });
      authDebugClient("sign_in.password.result", {
        email: maskEmail(email),
        hasError: !!result.error,
        error: result.error?.message ?? null,
        hasData: !!result.data,
        twoFactorRedirect: Boolean(
          (result.data as Record<string, unknown>)?.twoFactorRedirect,
        ),
      });

      if ((result.data as Record<string, unknown>)?.twoFactorRedirect) {
        setTwoFactorPending(true);
        setLoading(null);
        return;
      }

      if (result.error) {
        const msg = result.error.message?.toLowerCase() ?? "";
        if (
          msg.includes("two factor") ||
          msg.includes("2fa") ||
          msg.includes("totp")
        ) {
          setTwoFactorPending(true);
          setLoading(null);
          return;
        }
        throw new Error(result.error.message ?? "Sign in failed.");
      }

      authDebugClient("sign_in.password.success.redirect", { callbackURL });
      window.location.href = callbackURL;
    } catch (err: unknown) {
      authDebugClient("sign_in.password.exception", {
        email: maskEmail(email),
        error: err instanceof Error ? err.message : String(err),
      });
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(null);
    }
  };

  const handleTwoFactorVerify = async () => {
    if (!totpCode.trim()) return;
    setError(null);
    setTwoFactorLoading(true);

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: totpCode.trim(),
      });

      if (result.error) {
        throw new Error(result.error.message ?? "Invalid code.");
      }

      window.location.href = callbackURL;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid code.");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) return;
    setError(null);
    setLoading("magic");
    authDebugClient("sign_in.magic_link.start", {
      email: maskEmail(email),
      callbackURL,
    });

    try {
      const { error: magicLinkError } = await signIn.magicLink({
        email: email.trim(),
        callbackURL,
      });
      authDebugClient("sign_in.magic_link.result", {
        email: maskEmail(email),
        hasError: !!magicLinkError,
        error: magicLinkError?.message ?? null,
      });
      if (magicLinkError) throw new Error(magicLinkError.message);
      setSent(true);
    } catch (err: unknown) {
      authDebugClient("sign_in.magic_link.exception", {
        email: maskEmail(email),
        error: err instanceof Error ? err.message : String(err),
      });
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(null);
    }
  };

  const handlePasskey = async () => {
    setError(null);
    setLoading("passkey");
    authDebugClient("sign_in.passkey.start", {
      callbackURL,
      isSecureContext: window.isSecureContext,
    });
    try {
      const result = await authClient.signIn.passkey({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = callbackURL;
          },
        },
      });
      authDebugClient("sign_in.passkey.result", {
        hasError: !!result.error,
        error: result.error?.message ?? null,
      });
      if (result.error)
        throw new Error(result.error.message ?? "Passkey sign-in failed.");
    } catch (err: unknown) {
      authDebugClient("sign_in.passkey.exception", {
        error: err instanceof Error ? err.message : String(err),
      });
      setError(getPasskeyErrorMessage(err));
    } finally {
      setLoading(null);
    }
  };

  const handleSocial = async (provider: SocialProvider) => {
    setError(null);
    setLoading(provider);
    authDebugClient("sign_in.social.start", { provider, callbackURL });
    try {
      const result = await signIn.social({
        provider,
        callbackURL,
      });
      authDebugClient("sign_in.social.result", {
        provider,
        hasError: !!result.error,
        error: result.error?.message ?? null,
        rawResult: result,
      });

      const redirectUrl = getSocialRedirectUrl(result);
      if (redirectUrl) {
        authDebugClient("sign_in.social.redirect_url", {
          provider,
          redirectUrl,
        });
        window.location.assign(redirectUrl);
        return;
      }

      // Fallback to server route when client redirect URL is unavailable.
      const fallbackUrl = getSocialStartUrl(provider, callbackURL);
      authDebugClient("sign_in.social.redirect_fallback", {
        provider,
        fallbackUrl,
      });
      window.location.assign(fallbackUrl);
      return;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      authDebugClient("sign_in.social.exception", { provider, message });
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
          "Social sign-in session expired. Please try again (this refreshes the OAuth state cookie).",
        );
      } else if (normalized.includes("403")) {
        setError(
          "Social sign-in was blocked by browser/network security settings. Try a different browser or relax strict privacy blocking and retry.",
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
  const emailEnabled = config?.emailEnabled ?? false;
  const passkeyEnabled = config?.passkeyEnabled ?? false;

  if (twoFactorPending) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-geist-mono)] text-lg text-white">
            Two-factor authentication
          </h2>
          <p className="mt-1.5 text-sm text-neutral-500">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>

        <div>
          <label
            htmlFor="totp-code"
            className="mb-1.5 block text-xs text-neutral-600"
          >
            Authentication code
          </label>
          <input
            id="totp-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            maxLength={6}
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && handleTwoFactorVerify()}
            className="w-full rounded-lg border border-neutral-800 bg-transparent px-4 py-2.5 text-center font-mono text-lg tracking-[0.5em] text-white placeholder:text-neutral-700 outline-none transition focus:border-neutral-600"
          />
        </div>

        <button
          type="button"
          disabled={twoFactorLoading || totpCode.length < 6}
          onClick={handleTwoFactorVerify}
          className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {twoFactorLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner dark /> Verifying...
            </span>
          ) : (
            "Verify"
          )}
        </button>

        {error && (
          <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2.5 text-center text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            setTwoFactorPending(false);
            setTotpCode("");
            setError(null);
          }}
          className="text-center text-xs text-neutral-600 hover:text-white"
        >
          Use a different sign-in method
        </button>
      </div>
    );
  }

  if (sent) {
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
            We sent a sign-in link to{" "}
            <span className="text-neutral-200">{email}</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
          className="rounded-lg border border-neutral-800 px-4 py-2 text-xs font-medium text-neutral-400 transition hover:border-neutral-700 hover:text-white"
        >
          Try another email
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {passkeyEnabled && (
        <button
          type="button"
          disabled={loading === "passkey"}
          onClick={handlePasskey}
          className="w-full rounded-lg border border-neutral-800 px-4 py-2.5 text-sm font-medium text-white transition hover:border-neutral-700 hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "passkey" ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> Waiting for passkey...
            </span>
          ) : (
            "Sign in with passkey"
          )}
        </button>
      )}

      {emailEnabled && (
        <div className="flex rounded-lg border border-neutral-800 p-0.5">
          <button
            type="button"
            onClick={() => setAuthMode("password")}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${authMode === "password" ? "bg-white text-black" : "text-neutral-500 hover:text-white"}`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setAuthMode("magic")}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${authMode === "magic" ? "bg-white text-black" : "text-neutral-500 hover:text-white"}`}
          >
            Magic link
          </button>
        </div>
      )}

      <div>
        <label
          htmlFor="signin-email"
          className="mb-1.5 block text-xs text-neutral-600"
        >
          Email
        </label>
        <input
          id="signin-email"
          type="email"
          autoComplete="email webauthn"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (authMode === "password") handlePasswordSignIn();
              else handleMagicLink();
            }
          }}
          className="w-full rounded-lg border border-neutral-800 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-neutral-700 outline-none transition focus:border-neutral-600"
        />
      </div>

      {authMode === "password" && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="signin-password"
              className="text-xs text-neutral-600"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-neutral-600 hover:text-white"
            >
              Forgot?
            </Link>
          </div>
          <input
            id="signin-password"
            type="password"
            autoComplete="current-password webauthn"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePasswordSignIn()}
            className="w-full rounded-lg border border-neutral-800 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-neutral-700 outline-none transition focus:border-neutral-600"
          />
        </div>
      )}

      {authMode === "password" ? (
        <button
          type="button"
          disabled={loading === "password" || !email.trim() || !password}
          onClick={handlePasswordSignIn}
          className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "password" ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner dark /> Signing in...
            </span>
          ) : (
            "Sign in"
          )}
        </button>
      ) : (
        <>
          <button
            type="button"
            disabled={loading === "magic" || !email.trim()}
            onClick={handleMagicLink}
            className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading === "magic" ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner dark /> Sending...
              </span>
            ) : (
              "Send magic link"
            )}
          </button>
          <p className="text-sm text-neutral-500">
            We&apos;ll email a sign-in link instead of asking for a password.
          </p>
        </>
      )}

      {!emailEnabled && authMode === "password" && (
        <p className="text-xs text-neutral-600">
          Magic link sign-in requires{" "}
          <code className="text-neutral-400">RESEND_API_KEY</code>.
        </p>
      )}

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
