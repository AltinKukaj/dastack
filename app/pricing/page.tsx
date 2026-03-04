"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";
import { plans } from "@/lib/plans";

interface Subscription {
  id: string;
  plan: string;
  status: string | null;
  stripeSubscriptionId: string | null;
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);
  const [stripeEnabled, setStripeEnabled] = useState<boolean | null>(null);
  const [activeSub, setActiveSub] = useState<Subscription | null>(null);

  useEffect(() => {
    fetch("/api/features")
      .then((r) => r.json())
      .then((data) => setStripeEnabled(data.stripe ?? false))
      .catch(() => setStripeEnabled(false));
  }, []);

  useEffect(() => {
    if (!session) return;
    const fetchSubs = async () => {
      try {
        const { data } = await authClient.subscription.list();
        const subs = (data as Subscription[]) ?? [];
        const active = subs.find(
          (s) => s.status === "active" || s.status === "trialing",
        );
        setActiveSub(active ?? null);
      } catch {
        // no active subscription
      }
    };
    fetchSubs();
  }, [session]);

  const handleSubscribe = async (planKey: string) => {
    setLoading(planKey);
    try {
      const upgradePayload: {
        plan: string;
        successUrl: string;
        cancelUrl: string;
        annual: boolean;
        subscriptionId?: string;
        returnUrl?: string;
      } = {
        plan: planKey,
        successUrl: "/dashboard/billing?success=true",
        cancelUrl: "/pricing",
        annual,
      };

      if (activeSub?.stripeSubscriptionId) {
        upgradePayload.subscriptionId = activeSub.stripeSubscriptionId;
        upgradePayload.returnUrl = "/dashboard/billing";
      }

      const { error } = await authClient.subscription.upgrade(upgradePayload);
      if (error) alert(error.message);
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] font-[family-name:var(--font-geist-sans)] text-white">
      <header className="border-b border-neutral-800/40 bg-[#09090b]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="font-[family-name:var(--font-geist-mono)] text-[13px] tracking-tight text-white"
          >
            dastack
          </Link>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/AltinKukaj/dastack#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden text-[13px] text-neutral-500 transition-colors hover:text-white sm:inline"
            >
              Docs
            </a>
            {session ? (
              <Link
                href="/dashboard"
                className="rounded-lg border border-neutral-800 px-4 py-1.5 text-[13px] font-medium text-neutral-400 transition hover:border-neutral-700 hover:text-white"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className="rounded-lg border border-neutral-800 px-4 py-1.5 text-[13px] text-neutral-400 transition hover:border-neutral-700 hover:text-white"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="px-6 py-16">
        {stripeEnabled === null ? (
          <div className="flex justify-center py-32">
            <span className="size-5 animate-spin rounded-full border-2 border-neutral-800 border-t-white" />
          </div>
        ) : stripeEnabled === false ? (
          <div className="animate-fade-in mx-auto max-w-md text-center">
            <h1 className="font-[family-name:var(--font-geist-mono)] text-2xl tracking-tight">
              Stripe is not configured
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm text-neutral-500">
              Add your Stripe credentials to{" "}
              <code className="rounded bg-neutral-800/50 px-1.5 py-0.5 text-xs text-white">
                .env
              </code>{" "}
              and restart the server.
            </p>
            <div className="mt-6 space-y-2 text-left">
              {[
                "STRIPE_SECRET_KEY=sk_live_...",
                "STRIPE_WEBHOOK_SECRET=whsec_...",
                "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...",
              ].map((v) => (
                <code
                  key={v}
                  className="flex rounded-lg border border-neutral-800 px-4 py-2 font-[family-name:var(--font-geist-mono)] text-xs text-neutral-500"
                >
                  {v}
                </code>
              ))}
            </div>
            <Link
              href="/"
              className="mt-6 inline-block text-sm text-neutral-600 transition hover:text-white"
            >
              Back home
            </Link>
          </div>
        ) : (
          <>
            <div className="animate-fade-in mx-auto max-w-xl text-center">
              <h1 className="font-[family-name:var(--font-geist-mono)] text-3xl tracking-tight sm:text-4xl">
                Simple pricing
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm text-neutral-500">
                One plan for every stage. No hidden fees. Upgrade or cancel any
                time.
              </p>

              <div className="mt-8 inline-flex items-center gap-3 rounded-lg border border-neutral-800 p-1 pl-4">
                <span
                  className={`text-sm font-medium transition-colors ${!annual ? "text-white" : "text-neutral-600"}`}
                >
                  Monthly
                </span>
                <button
                  id="billing-toggle"
                  type="button"
                  onClick={() => setAnnual(!annual)}
                  aria-label="Toggle annual billing"
                  className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border transition-colors ${annual ? "border-neutral-600 bg-white" : "border-neutral-700 bg-neutral-800"}`}
                >
                  <span
                    className={`inline-block size-4 rounded-full shadow transition-transform ${annual ? "translate-x-5 bg-black" : "translate-x-1 bg-neutral-400"}`}
                  />
                </button>
                <span
                  className={`text-sm font-medium transition-colors ${annual ? "text-white" : "text-neutral-600"}`}
                >
                  Annual
                </span>
                <span className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-[11px] font-medium text-neutral-300">
                  Save ~17%
                </span>
              </div>
            </div>

            <div className="mx-auto mt-10 grid max-w-4xl gap-4 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.key}
                  className={`relative flex flex-col rounded-xl border p-6 transition ${
                    plan.highlighted
                      ? "border-neutral-700 bg-neutral-900"
                      : "border-neutral-800 bg-neutral-950"
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-2.5 left-4 rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-black">
                      {plan.badge}
                    </span>
                  )}

                  <div>
                    <p className="text-xs font-medium text-neutral-500">
                      {plan.name}
                    </p>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl font-semibold tabular-nums text-white">
                        ${annual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-sm text-neutral-600">
                        /{annual ? "yr" : "mo"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-neutral-500">
                      {plan.description}
                    </p>
                  </div>

                  <div className="my-5 h-px bg-neutral-800" />

                  <ul className="flex-1 space-y-2">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-sm text-neutral-400"
                      >
                        <svg
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className="mt-0.5 size-3.5 shrink-0 text-neutral-600"
                          aria-hidden="true"
                        >
                          <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    {plan.key === "enterprise" ? (
                      <a
                        id={`subscribe-${plan.key}`}
                        href="mailto:sales@create.dagrate.xyz"
                        className={`block w-full text-center rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                          plan.highlighted
                            ? "bg-white text-black hover:bg-neutral-200"
                            : "border border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white"
                        }`}
                      >
                        {plan.cta}
                      </a>
                    ) : session ? (
                      <button
                        id={`subscribe-${plan.key}`}
                        type="button"
                        onClick={() => handleSubscribe(plan.key)}
                        disabled={loading === plan.key}
                        className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          plan.highlighted
                            ? "bg-white text-black hover:bg-neutral-200"
                            : "border border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white"
                        }`}
                      >
                        {loading === plan.key ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Redirecting...
                          </span>
                        ) : (
                          plan.cta
                        )}
                      </button>
                    ) : (
                      <Link
                        id={`subscribe-${plan.key}-sign-in`}
                        href="/sign-in"
                        className={`block w-full rounded-lg px-4 py-2.5 text-center text-sm font-medium transition ${
                          plan.highlighted
                            ? "bg-white text-black hover:bg-neutral-200"
                            : "border border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white"
                        }`}
                      >
                        {plan.cta}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="mx-auto mt-10 max-w-md text-center text-xs text-neutral-600">
              All plans include SSL, daily backups, and 99.9% uptime. Need a
              custom deal?{" "}
              <a
                href="mailto:sales@create.dagrate.xyz"
                className="text-neutral-500 hover:text-white"
              >
                Contact us
              </a>
              .
            </p>
          </>
        )}
      </main>
    </div>
  );
}
