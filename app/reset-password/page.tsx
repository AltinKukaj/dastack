"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
          <span className="size-5 animate-spin rounded-full border-2 border-neutral-800 border-t-white" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 font-[family-name:var(--font-geist-sans)]">
        <div className="w-full max-w-sm text-center">
          <p className="font-[family-name:var(--font-geist-mono)] text-sm text-white">
            Invalid reset link
          </p>
          <p className="mt-1.5 text-[13px] text-neutral-600">
            This password reset link is invalid or has expired.
          </p>
          <Link
            href="/forgot-password"
            className="mt-5 inline-block rounded-lg border border-neutral-800/60 px-4 py-2 text-xs text-neutral-500 transition hover:text-white"
          >
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await authClient.resetPassword({
        newPassword,
        token,
      });

      if (result.error) {
        throw new Error(result.error.message ?? "Failed to reset password.");
      }

      setSuccess(true);
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
          {success ? (
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
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-[family-name:var(--font-geist-mono)] text-sm text-white">
                  Password updated
                </p>
                <p className="mt-1.5 text-[13px] text-neutral-500">
                  You can now sign in with your new password.
                </p>
              </div>
              <Link
                href="/sign-in"
                className="rounded-lg bg-white px-5 py-2 text-sm font-medium text-black transition hover:bg-neutral-200"
              >
                Sign in
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div>
                <h1 className="font-[family-name:var(--font-geist-mono)] text-xl tracking-tight text-white">
                  Choose a new password
                </h1>
                <p className="mt-1.5 text-[13px] text-neutral-600">
                  Enter a strong password you haven&apos;t used before.
                </p>
              </div>

              <div>
                <label
                  htmlFor="new-password"
                  className="mb-1.5 block text-xs text-neutral-600"
                >
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border-b border-neutral-800 bg-transparent px-0 py-2.5 text-sm text-white placeholder:text-neutral-700 outline-none transition focus:border-neutral-600"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-new-password"
                  className="mb-1.5 block text-xs text-neutral-600"
                >
                  Confirm new password
                </label>
                <input
                  id="confirm-new-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
                  className="w-full border-b border-neutral-800 bg-transparent px-0 py-2.5 text-sm text-white placeholder:text-neutral-700 outline-none transition focus:border-neutral-600"
                />
              </div>

              <button
                type="button"
                disabled={loading || !newPassword || !confirmPassword}
                onClick={handleReset}
                className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-neutral-400 border-t-neutral-950" />
                    Resetting...
                  </span>
                ) : (
                  "Reset password"
                )}
              </button>

              {error && (
                <p className="border-l-2 border-red-800 pl-3 text-sm text-red-300">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
