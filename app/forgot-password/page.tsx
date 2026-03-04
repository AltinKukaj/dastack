"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
          <span className="size-5 animate-spin rounded-full border-2 border-neutral-800 border-t-white" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}

function ForgotPasswordContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setError(null);
    setLoading(true);

    try {
      const result = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: "/reset-password",
      });

      if (result.error) {
        throw new Error(result.error.message ?? "Failed to send reset email.");
      }

      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 font-[family-name:var(--font-geist-sans)]">
      <div className="w-full max-w-sm">
        <div className="animate-fade-in mb-10 text-center">
          <Link
            href="/"
            className="font-[family-name:var(--font-geist-mono)] text-[13px] tracking-tight text-white"
          >
            dastack
          </Link>
        </div>

        <div className="animate-slide-up">
          {sent ? (
            <div className="flex flex-col items-center gap-5 py-4 text-center">
              <div className="flex size-10 items-center justify-center rounded border border-neutral-800">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="size-5 text-white"
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
                <p className="mt-1.5 text-[13px] text-neutral-500">
                  If an account with{" "}
                  <span className="text-neutral-300">{email}</span> exists, we
                  sent a password reset link.
                </p>
              </div>
              <Link
                href="/sign-in"
                className="rounded-lg border border-neutral-800/60 px-4 py-2 text-xs text-neutral-500 transition hover:text-white"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div>
                <h1 className="font-[family-name:var(--font-geist-mono)] text-xl tracking-tight text-white">
                  Forgot your password?
                </h1>
                <p className="mt-1.5 text-[13px] text-neutral-600">
                  Enter your email and we&apos;ll send a reset link.
                </p>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs text-neutral-600"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full border-b border-neutral-800 bg-transparent px-0 py-2.5 text-sm text-white placeholder:text-neutral-700 outline-none transition focus:border-neutral-600"
                />
              </div>

              <button
                type="button"
                disabled={loading || !email.trim()}
                onClick={handleSubmit}
                className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-neutral-400 border-t-neutral-950" />
                    Sending...
                  </span>
                ) : (
                  "Send reset link"
                )}
              </button>

              {error && (
                <p className="border-l-2 border-red-800 pl-3 text-sm text-red-300">
                  {error}
                </p>
              )}

              <p className="text-center text-[11px] text-neutral-700">
                Remember your password?{" "}
                <Link
                  href="/sign-in"
                  className="text-neutral-500 transition-colors hover:text-white"
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
