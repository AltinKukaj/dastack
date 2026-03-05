"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { authDebugClient } from "@/lib/auth-debug-client";
import { getClientFeatureFlags } from "@/lib/feature-flags-client";
import { getSafeCallbackUrl } from "@/lib/safe-callback-url";
import { SignInForm } from "../components/sign-in-form";
import { SignUpForm } from "../components/sign-up-form";

type AuthTab = "sign-in" | "sign-up";

function getOauthErrorMessage(errorCode: string | null): string | null {
  if (!errorCode) return null;
  if (
    errorCode === "please_restart_the_process" ||
    errorCode === "state_not_found" ||
    errorCode === "state_mismatch"
  ) {
    return "Your social login session expired before callback validation. Please try again.";
  }
  return `Social sign-in failed (${errorCode.replace(/_/g, " ")}). Please try again.`;
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
  const oauthErrorMessage = getOauthErrorMessage(
    searchParams.get("oauthError") ?? searchParams.get("error"),
  );
  const initialTab =
    searchParams.get("tab") === "sign-up" ? "sign-up" : "sign-in";

  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [authEnabled, setAuthEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    authDebugClient("auth_page.init", {
      initialTab,
      callbackURL,
      oauthErrorMessage,
    });
    getClientFeatureFlags()
      .then((data) => {
        authDebugClient("auth_page.features.loaded", { data });
        if (!data.auth) {
          authDebugClient("auth_page.features.auth_disabled_redirect_home");
          router.replace("/");
        } else {
          setAuthEnabled(true);
        }
      })
      .catch((error) => {
        authDebugClient("auth_page.features.error_redirect_home", {
          error: error instanceof Error ? error.message : String(error),
        });
        router.replace("/");
      });
  }, [router, initialTab, callbackURL, oauthErrorMessage]);

  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const signInTabRef = useRef<HTMLButtonElement>(null);
  const signUpTabRef = useRef<HTMLButtonElement>(null);

  const updateIndicator = useCallback((tab: AuthTab) => {
    const ref = tab === "sign-in" ? signInTabRef : signUpTabRef;
    const container = tabContainerRef.current;
    if (ref.current && container) {
      const containerRect = container.getBoundingClientRect();
      const tabRect = ref.current.getBoundingClientRect();
      setIndicatorStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      });
    }
  }, []);

  useEffect(() => {
    updateIndicator(activeTab);
  }, [activeTab, updateIndicator]);

  useEffect(() => {
    const handleResize = () => updateIndicator(activeTab);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTab, updateIndicator]);

  const handleTabSwitch = (tab: AuthTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
  };

  if (!authEnabled) {
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
            <div
              ref={tabContainerRef}
              className="relative flex border-b border-neutral-800/40"
            >
              <div
                className="absolute bottom-0 h-px bg-white transition-all duration-300 ease-[cubic-bezier(0.65,0,0.35,1)]"
                style={{
                  left: `${indicatorStyle.left}px`,
                  width: `${indicatorStyle.width}px`,
                }}
              />

              <button
                ref={signInTabRef}
                type="button"
                onClick={() => handleTabSwitch("sign-in")}
                className={`relative pb-3 pr-6 text-sm font-medium transition-colors duration-200 ${activeTab === "sign-in" ? "text-white" : "text-neutral-600 hover:text-neutral-400"}`}
              >
                Sign in
              </button>
              <button
                ref={signUpTabRef}
                type="button"
                onClick={() => handleTabSwitch("sign-up")}
                className={`relative pb-3 px-6 text-sm font-medium transition-colors duration-200 ${activeTab === "sign-up" ? "text-white" : "text-neutral-600 hover:text-neutral-400"}`}
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
              {oauthErrorMessage && (
                <p className="mt-3 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-300">
                  {oauthErrorMessage}
                </p>
              )}
            </div>
          </div>

          <div className="relative">
            <div
              className={`transition-all duration-300 ease-out ${
                activeTab === "sign-in"
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 absolute inset-0 pointer-events-none -translate-y-1"
              }`}
            >
              {activeTab === "sign-in" && (
                <SignInForm callbackURL={callbackURL} />
              )}
            </div>
            <div
              className={`transition-all duration-300 ease-out ${
                activeTab === "sign-up"
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 absolute inset-0 pointer-events-none -translate-y-1"
              }`}
            >
              {activeTab === "sign-up" && (
                <SignUpForm callbackURL={callbackURL} />
              )}
            </div>
          </div>
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
