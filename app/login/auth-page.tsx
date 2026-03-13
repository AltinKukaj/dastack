"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { APP_NAME } from "@/lib/config";
import type { AuthConfig } from "./page";

type View =
  | "sign-in"
  | "sign-up"
  | "forgot-password"
  | "two-factor"
  | "verify-email";

type TwoFactorMode = "totp" | "otp" | "backup";

interface Props {
  config: AuthConfig;
  initialView: Exclude<View, "verify-email">;
  callbackUrl: string;
  status: {
    verified: boolean;
    reset: boolean;
  };
}

type ResultLike = {
  data?: unknown;
  error?: {
    message?: string;
    status?: number;
  } | null;
};

type ResultError = ResultLike["error"];

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.07l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
    </svg>
  );
}

function PasskeyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" />
      <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function getResultError(result: ResultLike): ResultError {
  if (result.error) {
    return result.error;
  }

  if (result.data && typeof result.data === "object" && "error" in result.data) {
    return ((result.data as { error?: ResultError }).error ?? null) as ResultError;
  }

  return null;
}

function getErrorMessage(result: ResultLike, fallback: string) {
  return getResultError(result)?.message ?? fallback;
}

function getErrorStatus(result: ResultLike) {
  return getResultError(result)?.status ?? null;
}

function isAbortErrorLike(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    name?: unknown;
    message?: unknown;
    error?: { name?: unknown; message?: unknown } | null;
  };

  const names = [candidate.name, candidate.error?.name]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLowerCase());
  if (names.some((value) => value === "aborterror")) return true;

  const messages = [candidate.message, candidate.error?.message]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLowerCase());
  return messages.some((value) => value.includes("abort signal") || value.includes("aborted"));
}

function isNetworkErrorLike(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { message?: unknown; error?: { message?: unknown } | null };
  const messages = [candidate.message, candidate.error?.message]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLowerCase());
  return messages.some((value) => value.includes("failed to fetch") || value.includes("networkerror"));
}

function getSuccessData<T>(result: ResultLike) {
  return (result.data ?? null) as T | null;
}

export default function AuthPage({
  config,
  initialView,
  callbackUrl,
  status,
}: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>(initialView);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(
    status.verified
      ? "Your email is verified. You can sign in now."
      : status.reset
        ? "Your password has been reset. Sign in with your new password."
        : "",
  );
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  const [verificationOtpSent, setVerificationOtpSent] = useState(false);
  const [twoFactorMode, setTwoFactorMode] = useState<TwoFactorMode>("totp");
  const [twoFactorOtpSent, setTwoFactorOtpSent] = useState(false);
  const [trustDevice, setTrustDevice] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);

  const tabsRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
      setPasskeyAvailable("PublicKeyCredential" in window);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (view !== "sign-in") return;
    if (typeof window === "undefined" || !window.isSecureContext || !("PublicKeyCredential" in window)) return;

    const pk = PublicKeyCredential as typeof PublicKeyCredential & {
      isConditionalMediationAvailable?: () => Promise<boolean>;
    };
    if (!pk.isConditionalMediationAvailable) return;

    let aborted = false;

    void pk.isConditionalMediationAvailable()
      .then(async (ok) => {
        if (!ok || aborted) return;
        try {
          const result = (await authClient.signIn.passkey({
            autoFill: true,
            fetchOptions: {
              onSuccess: () => { window.location.href = callbackUrl; },
            },
          })) as ResultLike;
          if (result.error) return;
        } catch {
          // Ignore passkey auto-fill errors
        }
      })
      .catch(() => { });

    return () => {
      aborted = true;
    };
  }, [callbackUrl, view, mounted]);

  useEffect(() => {
    if (!tabsRef.current || view === "forgot-password" || view === "two-factor" || view === "verify-email") {
      return;
    }

    const idx = view === "sign-in" ? 0 : 1;
    const btn = tabsRef.current.children[idx] as HTMLElement | undefined;

    if (btn) {
      setIndicatorStyle({ left: btn.offsetLeft, width: btn.offsetWidth });
    }
  }, [mounted, view]);

  const hasOAuth = useMemo(
    () => config.providers.google || config.providers.github || config.providers.discord,
    [config.providers.discord, config.providers.github, config.providers.google],
  );

  const switchView = useCallback((nextView: View) => {
    setError("");
    setNotice("");
    setResetSent(false);
    setVerificationOtpSent(false);
    setTwoFactorOtpSent(false);
    setView(nextView);
  }, []);

  const handleResendVerification = useCallback(async () => {
    if (!pendingVerificationEmail) return;

    setLoading(true);
    setError("");
    setNotice("");

    const result = await authClient.sendVerificationEmail({
      email: pendingVerificationEmail,
      callbackURL: "/login?verified=1",
    });

    setLoading(false);

    if (result.error) {
      setError(getErrorMessage(result, "We could not resend the verification email."));
      return;
    }

    setNotice(`We sent a fresh verification link to ${pendingVerificationEmail}.`);
  }, [pendingVerificationEmail]);

  const handleSignIn = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError("");
      setNotice("");
      setLoading(true);

      const form = new FormData(e.currentTarget);
      const email = String(form.get("email") ?? "");
      const password = String(form.get("password") ?? "");

      const result = (await authClient.signIn.email({
        email,
        password,
        callbackURL: callbackUrl,
      })) as ResultLike;

      setLoading(false);

      if (result.error) {
        if (getErrorStatus(result) === 403) {
          setPendingVerificationEmail(email);
          setNotice("Verify your email to continue. We can resend the verification link.");
          setView("verify-email");
          return;
        }

        setError(getErrorMessage(result, "Sign in failed. Check your credentials."));
        return;
      }

      const data = getSuccessData<{ twoFactorRedirect?: boolean }>(result);

      if (data?.twoFactorRedirect) {
        router.push(`/login?view=two-factor&callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }

      router.push(callbackUrl);
    },
    [callbackUrl, router],
  );

  const handleSignUp = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError("");
      setNotice("");
      setLoading(true);

      const form = new FormData(e.currentTarget);
      const name = String(form.get("name") ?? "");
      const email = String(form.get("email") ?? "");
      const password = String(form.get("password") ?? "");

      const result = (await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: "/login?verified=1",
      })) as ResultLike;

      setLoading(false);

      if (result.error) {
        setError(getErrorMessage(result, "Sign up failed. Try again in a moment."));
        return;
      }

      setPendingVerificationEmail(email);
      setView("verify-email");
      setNotice(`Check ${email} for a verification link to finish creating your account.`);
    },
    [],
  );

  const handleForgotPassword = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");

    const result = (await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    })) as ResultLike;

    setLoading(false);

    if (result.error) {
      setError(getErrorMessage(result, "Could not send the reset email."));
      return;
    }

    setResetSent(true);
  }, []);

  const handleSocial = useCallback(
    async (provider: "google" | "github" | "discord") => {
      setError("");
      setNotice("");
      try {
        await authClient.signIn.social({
          provider,
          callbackURL: callbackUrl,
        });
      } catch (error) {
        if (isAbortErrorLike(error)) return;
        if (isNetworkErrorLike(error)) {
          setError("Could not reach the auth service. Check your connection and try again.");
          return;
        }
        setError("Could not start social sign in. Please try again.");
      }
    },
    [callbackUrl],
  );

  const handlePasskey = useCallback(async () => {
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const result = (await authClient.signIn.passkey({
        autoFill: false,
      })) as ResultLike;

      if (result.error) {
        if (isAbortErrorLike(result.error)) return;
        setError(getErrorMessage(result, "Passkey authentication failed."));
        return;
      }

      router.push(callbackUrl);
    } catch (error) {
      if (isAbortErrorLike(error)) return;
      if (isNetworkErrorLike(error)) {
        setError("Could not reach the auth service. Check your connection and try again.");
        return;
      }
      setError("Passkey authentication failed.");
    } finally {
      setLoading(false);
    }
  }, [callbackUrl, router]);

  const handleAnonymous = useCallback(async () => {
    setError("");
    setNotice("");
    setLoading(true);

    const result = (await authClient.signIn.anonymous()) as ResultLike;

    setLoading(false);

    if (result.error) {
      setError(getErrorMessage(result, "Could not continue as guest."));
      return;
    }

    router.push(callbackUrl);
  }, [callbackUrl, router]);

  const handleSendTwoFactorOtp = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");

    const result = (await authClient.twoFactor.sendOtp()) as ResultLike;

    setLoading(false);

    if (result.error) {
      setError(getErrorMessage(result, "Could not send the email code."));
      return;
    }

    setTwoFactorMode("otp");
    setTwoFactorOtpSent(true);
    setNotice("We sent a six-digit code to your email.");
  }, []);

  const handleVerifyTwoFactor = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoading(true);
      setError("");
      setNotice("");

      const form = new FormData(e.currentTarget);
      const code = String(form.get("code") ?? "").trim();

      const result =
        twoFactorMode === "otp"
          ? ((await authClient.twoFactor.verifyOtp({
            code,
            trustDevice,
          })) as ResultLike)
          : twoFactorMode === "backup"
            ? ((await authClient.twoFactor.verifyBackupCode({
              code,
              trustDevice,
            })) as ResultLike)
            : ((await authClient.twoFactor.verifyTotp({
              code,
              trustDevice,
            })) as ResultLike);

      setLoading(false);

      if (result.error) {
        setError(getErrorMessage(result, "Two-factor verification failed."));
        return;
      }

      router.push(callbackUrl);
    },
    [callbackUrl, router, trustDevice, twoFactorMode],
  );

  const handleSendVerificationOtp = useCallback(async () => {
    if (!pendingVerificationEmail) return;

    setLoading(true);
    setError("");
    setNotice("");

    const result = (await authClient.emailOtp.sendVerificationOtp({
      email: pendingVerificationEmail,
      type: "email-verification",
    })) as ResultLike;

    setLoading(false);

    if (getResultError(result)) {
      setError(getErrorMessage(result, "We could not send a verification code."));
      return;
    }

    setVerificationOtpSent(true);
    setNotice(`We sent a verification code to ${pendingVerificationEmail}.`);
  }, [pendingVerificationEmail]);

  const handleVerifyEmailOtp = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!pendingVerificationEmail) return;

      setLoading(true);
      setError("");
      setNotice("");

      const form = new FormData(e.currentTarget);
      const otp = String(form.get("otp") ?? "").trim();

      const result = (await authClient.emailOtp.verifyEmail({
        email: pendingVerificationEmail,
        otp,
      })) as ResultLike;

      setLoading(false);

      if (getResultError(result)) {
        setError(getErrorMessage(result, "That verification code is not valid anymore."));
        return;
      }

      setPendingVerificationEmail("");
      setVerificationOtpSent(false);
      switchView("sign-in");
      setNotice("Your email is verified. You can sign in now.");
    },
    [pendingVerificationEmail, switchView],
  );

  const fade = mounted ? "opacity-100" : "opacity-0";
  const inputClass =
    "w-full bg-transparent border border-white/[0.08] rounded-md px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 outline-none transition-colors duration-150 focus:border-white/25 disabled:opacity-40";
  const labelClass = "block text-[12px] text-zinc-500 mb-1.5";

  return (
    <div className="min-h-dvh bg-[#09090b] text-zinc-100 font-sans flex flex-col">
      {/* Minimal header */}
      <header className="animate-fade-in flex items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="text-[13px] font-semibold tracking-tight text-white">
          {APP_NAME}
        </Link>
        <Link
          href="/pricing"
          className="text-[12px] text-zinc-600 hover:text-white transition-colors duration-150"
        >
          Pricing
        </Link>
      </header>

      {/* Centered auth form */}
      <div className="flex-1 flex items-center justify-center px-5 py-8 sm:px-8">
        <div className="w-full max-w-[380px]">
          {/* Tabs: sign-in / sign-up */}
          {view !== "forgot-password" && view !== "two-factor" && view !== "verify-email" && (
            <div className={`mb-8 transition-all duration-500 ease-out ${fade}`}>
              <div ref={tabsRef} className="relative flex gap-6">
                <button
                  type="button"
                  onClick={() => switchView("sign-in")}
                  className={`text-sm tracking-wide pb-2.5 transition-colors duration-200 ${view === "sign-in" ? "text-white" : "text-zinc-600 hover:text-zinc-400"
                    }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => switchView("sign-up")}
                  className={`text-sm tracking-wide pb-2.5 transition-colors duration-200 ${view === "sign-up" ? "text-white" : "text-zinc-600 hover:text-zinc-400"
                    }`}
                >
                  Create account
                </button>
                <div
                  className="absolute bottom-0 h-px bg-white transition-all duration-300 ease-out"
                  style={{
                    left: indicatorStyle.left,
                    width: indicatorStyle.width,
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-white/6" />
              </div>
            </div>
          )}

          {/* Back + heading for secondary views */}
          {(view === "forgot-password" || view === "two-factor" || view === "verify-email") && (
            <div className={`mb-8 transition-all duration-500 ease-out ${fade}`}>
              <button
                type="button"
                onClick={() => switchView("sign-in")}
                className="text-[13px] text-zinc-600 hover:text-zinc-300 transition-colors duration-200 mb-5 block"
              >
                Back
              </button>

              {view === "forgot-password" && (
                <>
                  <h2 className="text-lg font-medium text-white">Reset password</h2>
                  <p className="mt-2 text-[13px] text-zinc-500 leading-relaxed">
                    Enter your email and we&apos;ll send you a secure reset link.
                  </p>
                </>
              )}

              {view === "two-factor" && (
                <>
                  <h2 className="text-lg font-medium text-white">Two-factor check</h2>
                  <p className="mt-2 text-[13px] text-zinc-500 leading-relaxed">
                    Finish signing in with your authenticator app, an emailed code, or a backup code.
                  </p>
                </>
              )}

              {view === "verify-email" && (
                <>
                  <h2 className="text-lg font-medium text-white">Check your inbox</h2>
                  <p className="mt-2 text-[13px] text-zinc-500 leading-relaxed">
                    {pendingVerificationEmail
                      ? `We sent a verification link to ${pendingVerificationEmail}.`
                      : "Verify your email address before signing in."}
                  </p>
                </>
              )}
            </div>
          )}

          <div key={view} className="animate-fade-in">
            {/* SIGN IN: form first, then divider, then providers */}
            {view === "sign-in" && (
              <div className="space-y-5">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label htmlFor="signin-email" className={labelClass}>
                      Email
                    </label>
                    <input
                      id="signin-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="username webauthn"
                      disabled={loading}
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="signin-password" className="text-[12px] text-zinc-500">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => switchView("forgot-password")}
                        className="text-[12px] text-zinc-600 hover:text-zinc-400 transition-colors duration-200"
                      >
                        Forgot?
                      </button>
                    </div>
                    <input
                      id="signin-password"
                      name="password"
                      type="password"
                      required
                      autoComplete="current-password webauthn"
                      disabled={loading}
                      placeholder="Your password"
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? <Spinner /> : "Sign in"}
                  </button>
                </form>

                {passkeyAvailable && (
                  <button
                    type="button"
                    onClick={handlePasskey}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2.5 border border-white/[0.06] rounded-md py-2.5 text-sm text-zinc-500 hover:text-white hover:border-white/[0.14] transition-colors duration-150 disabled:opacity-40"
                  >
                    <PasskeyIcon />
                    <span>Sign in with passkey</span>
                  </button>
                )}

                {hasOAuth && (
                  <>
                    <Divider />
                    <SocialButtons config={config} onSocial={handleSocial} />
                  </>
                )}

                <button
                  type="button"
                  onClick={handleAnonymous}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 border border-dashed border-zinc-800 rounded-md py-2.5 text-sm text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 transition-colors duration-150 disabled:opacity-40"
                >
                  Continue as guest
                </button>

                <p className="text-[11px] text-zinc-600 leading-relaxed text-center pt-1">
                  <Link href="/terms" className="text-zinc-500 hover:text-zinc-300 transition-colors">Terms</Link>
                  {" · "}
                  <Link href="/privacy" className="text-zinc-500 hover:text-zinc-300 transition-colors">Privacy</Link>
                </p>
              </div>
            )}

            {/* SIGN UP: form first, then divider, then providers (consistent with sign-in) */}
            {view === "sign-up" && (
              <div className="space-y-5">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label htmlFor="signup-name" className={labelClass}>
                      Name
                    </label>
                    <input
                      id="signup-name"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      disabled={loading}
                      placeholder="Your name"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="signup-email" className={labelClass}>
                      Email
                    </label>
                    <input
                      id="signup-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      disabled={loading}
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="signup-password" className={labelClass}>
                      Password
                    </label>
                    <input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      disabled={loading}
                      placeholder="Min. 8 characters"
                      className={inputClass}
                    />
                    <p className="mt-1.5 text-[11px] text-zinc-600">
                      Checked against known breaches for your safety.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary flex items-center justify-center gap-2 mt-1"
                  >
                    {loading ? <Spinner /> : "Create account"}
                  </button>
                </form>

                {hasOAuth && (
                  <>
                    <Divider />
                    <SocialButtons config={config} onSocial={handleSocial} />
                  </>
                )}

                <p className="text-[11px] text-zinc-600 leading-relaxed text-center">
                  By continuing you agree to our{" "}
                  <Link href="/terms" className="text-zinc-500 hover:text-zinc-300 transition-colors">Terms</Link>
                  {" and "}
                  <Link href="/privacy" className="text-zinc-500 hover:text-zinc-300 transition-colors">Privacy Policy</Link>.
                </p>
              </div>
            )}

            {/* FORGOT PASSWORD */}
            {view === "forgot-password" && (
              <div>
                {resetSent ? (
                  <div className="animate-in fade-in duration-300">
                    <p className="text-sm text-zinc-400">
                      Check your inbox. If an account exists for that email, you&apos;ll receive a reset link shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => switchView("sign-in")}
                      className="mt-6 text-[13px] text-zinc-600 hover:text-zinc-300 transition-colors duration-200"
                    >
                      Return to sign in
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label htmlFor="reset-email" className={labelClass}>
                        Email
                      </label>
                      <input
                        id="reset-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        disabled={loading}
                        placeholder="you@example.com"
                        className={inputClass}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      {loading ? <Spinner /> : "Send reset link"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* VERIFY EMAIL */}
            {view === "verify-email" && (
              <div className="space-y-4">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-sm text-zinc-300">
                    Open the verification email, confirm your address, then come back here to sign in.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={loading || !pendingVerificationEmail}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  {loading ? <Spinner /> : "Resend verification email"}
                </button>
                <button
                  type="button"
                  onClick={handleSendVerificationOtp}
                  disabled={loading || !pendingVerificationEmail}
                  className="w-full border border-white/[0.06] rounded-md py-2.5 text-sm text-zinc-500 hover:text-white hover:border-white/[0.12] transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {loading ? <Spinner /> : verificationOtpSent ? "Resend 6-digit code" : "Use a 6-digit code instead"}
                </button>
                {verificationOtpSent && (
                  <form onSubmit={handleVerifyEmailOtp} className="space-y-3 rounded-lg border border-white/8 bg-black/20 p-4">
                    <div>
                      <label htmlFor="verification-otp" className={labelClass}>
                        Verification code
                      </label>
                      <input
                        id="verification-otp"
                        name="otp"
                        type="text"
                        required
                        autoComplete="one-time-code"
                        disabled={loading}
                        placeholder="123456"
                        className={inputClass}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      {loading ? <Spinner /> : "Verify email with code"}
                    </button>
                  </form>
                )}
                <button
                  type="button"
                  onClick={() => switchView("sign-in")}
                  className="w-full border border-white/[0.06] rounded-md py-2.5 text-sm text-zinc-500 hover:text-white hover:border-white/[0.12] transition-all duration-200"
                >
                  Back to sign in
                </button>
              </div>
            )}

            {/* TWO-FACTOR */}
            {view === "two-factor" && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/[0.08] bg-white/[0.02] p-1">
                  <button
                    type="button"
                    onClick={() => setTwoFactorMode("totp")}
                    className={`rounded-md px-3 py-2 text-[13px] font-medium transition-colors duration-150 ${twoFactorMode === "totp" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}
                  >
                    App code
                  </button>
                  <button
                    type="button"
                    onClick={() => setTwoFactorMode("otp")}
                    className={`rounded-md px-3 py-2 text-[13px] font-medium transition-colors duration-150 ${twoFactorMode === "otp" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}
                  >
                    Email code
                  </button>
                  <button
                    type="button"
                    onClick={() => setTwoFactorMode("backup")}
                    className={`rounded-md px-3 py-2 text-[13px] font-medium transition-colors duration-150 ${twoFactorMode === "backup" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}
                  >
                    Backup code
                  </button>
                </div>

                {twoFactorMode === "otp" && !twoFactorOtpSent && (
                  <button
                    type="button"
                    onClick={handleSendTwoFactorOtp}
                    disabled={loading}
                    className="w-full border border-white/[0.06] rounded-md py-2.5 text-sm text-zinc-500 hover:text-white hover:border-white/[0.12] transition-all duration-200 disabled:opacity-40"
                  >
                    {loading ? <Spinner /> : "Send email code"}
                  </button>
                )}

                <form onSubmit={handleVerifyTwoFactor} className="space-y-4">
                  <div>
                    <label htmlFor="two-factor-code" className={labelClass}>
                      {twoFactorMode === "backup"
                        ? "Backup code"
                        : twoFactorMode === "otp"
                          ? "Email code"
                          : "Authenticator code"}
                    </label>
                    <input
                      id="two-factor-code"
                      name="code"
                      type="text"
                      required
                      autoComplete="one-time-code"
                      disabled={loading}
                      placeholder={twoFactorMode === "backup" ? "Enter a backup code" : "123456"}
                      className={inputClass}
                    />
                  </div>

                  <label className="flex items-center gap-3 text-sm text-zinc-500">
                    <input
                      type="checkbox"
                      checked={trustDevice}
                      onChange={(event) => setTrustDevice(event.target.checked)}
                      className="size-4 rounded border-zinc-700 bg-transparent"
                    />
                    Trust this device for 30 days
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    {loading ? <Spinner /> : "Verify and continue"}
                  </button>
                </form>

                {twoFactorMode === "otp" && twoFactorOtpSent && (
                  <button
                    type="button"
                    onClick={handleSendTwoFactorOtp}
                    disabled={loading}
                    className="text-[13px] text-zinc-600 hover:text-zinc-300 transition-colors duration-200"
                  >
                    Send a new email code
                  </button>
                )}
              </div>
            )}

            {notice && (
              <p className="mt-4 text-[13px] text-zinc-300 animate-fade-in">
                {notice}
              </p>
            )}

            {error && (
              <p className="mt-4 rounded-md border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-center text-sm text-zinc-300 animate-fade-in">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 h-px bg-white/6" />
      <span className="text-[11px] text-zinc-700">
        or
      </span>
      <div className="flex-1 h-px bg-white/6" />
    </div>
  );
}

function SocialButtons({
  config,
  onSocial,
}: {
  config: AuthConfig;
  onSocial: (provider: "google" | "github" | "discord") => void;
}) {
  const providers = [
    { id: "google" as const, icon: <GoogleIcon />, label: "Google", enabled: config.providers.google },
    { id: "github" as const, icon: <GitHubIcon />, label: "GitHub", enabled: config.providers.github },
    { id: "discord" as const, icon: <DiscordIcon />, label: "Discord", enabled: config.providers.discord },
  ].filter((provider) => provider.enabled);

  return (
    <div className="space-y-2.5">
      {providers.map((provider) => (
        <button
          key={provider.id}
          type="button"
          onClick={() => onSocial(provider.id)}
          className="w-full flex items-center justify-center gap-2.5 border border-white/[0.08] rounded-md py-2.5 px-4 text-sm text-zinc-400 hover:text-white hover:border-white/[0.16] transition-colors duration-150"
        >
          {provider.icon}
          <span>Continue with {provider.label}</span>
        </button>
      ))}
    </div>
  );
}
