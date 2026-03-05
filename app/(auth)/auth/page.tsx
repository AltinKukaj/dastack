"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getClientFeatureFlags } from "@/lib/feature-flags-client";
import { getSafeCallbackUrl } from "@/lib/safe-callback-url";
import { SignInForm } from "../components/sign-in-form";
import { SignUpForm } from "../components/sign-up-form";

type AuthTab = "sign-in" | "sign-up";

function getOauthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  if (
    code === "please_restart_the_process" ||
    code === "state_not_found" ||
    code === "state_mismatch"
  ) {
    return "Your social login session expired. Please try again.";
  }
  return `Social sign-in failed (${code.replace(/_/g, " ")}). Please try again.`;
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
          <span className="size-5 animate-spin rounded-full border-2 border-neutral-800 border-t-white" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = getSafeCallbackUrl(
    searchParams.get("callbackUrl"),
    "/dashboard",
  );
  const oauthError = getOauthErrorMessage(
    searchParams.get("oauthError") ?? searchParams.get("error"),
  );
  const initialTab =
    searchParams.get("tab") === "sign-up" ? "sign-up" : "sign-in";

  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getClientFeatureFlags()
      .then((flags) => {
        if (!flags.auth) router.replace("/");
        else setReady(true);
      })
      .catch(() => router.replace("/"));
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <span className="size-5 animate-spin rounded-full border-2 border-neutral-800 border-t-white" />
      </div>
    );
  }

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
          <div className="mb-6">
            <div className="flex border-b border-neutral-800/40">
              <button
                type="button"
                onClick={() => setActiveTab("sign-in")}
                className={`relative pb-3 pr-6 text-sm font-medium transition-colors duration-200 ${activeTab === "sign-in" ? "text-white after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-white" : "text-neutral-600 hover:text-neutral-400"}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("sign-up")}
                className={`relative pb-3 px-6 text-sm font-medium transition-colors duration-200 ${activeTab === "sign-up" ? "text-white after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-white" : "text-neutral-600 hover:text-neutral-400"}`}
              >
                Sign up
              </button>
            </div>

            <div className="mt-6">
              <h2 className="font-[family-name:var(--font-geist-mono)] text-xl tracking-tight text-white">
                {activeTab === "sign-in" ? "Welcome back" : "Create account"}
              </h2>
              <p className="mt-1.5 text-[13px] text-neutral-600">
                {activeTab === "sign-in"
                  ? "Sign in with your credentials or a provider."
                  : "Fill in the details below to get started."}
              </p>
              {oauthError && (
                <p className="mt-3 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-300">
                  {oauthError}
                </p>
              )}
            </div>
          </div>

          {activeTab === "sign-in" ? (
            <SignInForm callbackURL={callbackURL} />
          ) : (
            <SignUpForm callbackURL={callbackURL} />
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-neutral-700">
          <Link href="/" className="transition-colors hover:text-white">
            Back home
          </Link>
        </p>
      </div>
    </div>
  );
}
