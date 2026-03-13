/** Password reset page — validates a token from the URL and lets the user set a new password. */
"use client";

import { Suspense, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type ResultLike = {
  error?: {
    message?: string;
  } | null;
};

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const errorCode = searchParams.get("error");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const pageError = useMemo(() => {
    if (errorCode === "INVALID_TOKEN") {
      return "This reset link is invalid or has expired. Request a new one from the login screen.";
    }

    return "";
  }, [errorCode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setError("Missing reset token. Request a new password reset email.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (newPassword.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    const result = (await authClient.resetPassword({
      token,
      newPassword,
    })) as ResultLike;

    setLoading(false);

    if (result.error) {
      setError(result.error.message ?? "We could not reset your password.");
      return;
    }

    setSuccess(true);
    router.push("/login?reset=success");
  };

  return (
    <div className="w-full max-w-md rounded-md border border-white/8 bg-white/[0.02] p-6 sm:p-8">
      <div className="mb-8">
        <Link
          href="/login"
          className="text-[13px] text-zinc-600 hover:text-zinc-300 transition-colors duration-200 font-mono"
        >
          Back to login
        </Link>
        <h1 className="mt-5 text-xl font-semibold text-white">
          Reset password
        </h1>
        <p className="mt-3 text-sm text-zinc-500 leading-relaxed">
          Choose a new password for your account, then sign in again on your devices.
        </p>
      </div>

      {pageError && (
        <p className="mb-4 rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-zinc-300">
          {pageError}
        </p>
      )}

      {!pageError && !success && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="new-password"
              className="mb-2 block text-[13px] text-zinc-500 font-mono"
            >
              New password
            </label>
            <input
              id="new-password"
              name="newPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              disabled={loading}
              className="w-full rounded-md border border-zinc-800/80 bg-transparent px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors duration-200 focus:border-white/40 disabled:opacity-40"
              placeholder="Min. 8 characters"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="mb-2 block text-[13px] text-zinc-500 font-mono"
            >
              Confirm password
            </label>
            <input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              disabled={loading}
              className="w-full rounded-md border border-zinc-800/80 bg-transparent px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors duration-200 focus:border-white/40 disabled:opacity-40"
              placeholder="Repeat your new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            {loading ? "Resetting..." : "Save new password"}
          </button>
        </form>
      )}

      {error && (
        <p className="mt-4 rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-center text-sm text-zinc-300">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-zinc-300">
          Your password has been updated. Redirecting you back to sign in.
        </p>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-zinc-100 flex items-center justify-center px-6 py-10">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
