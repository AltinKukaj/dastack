"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";
import { APP_NAME } from "@/lib/config";
import type { StripeBillingReadiness } from "@/lib/features";
import { plans, type Plan } from "@/lib/plans";

interface SubscriptionSummary {
  id: string;
  plan: string;
  status: string | null;
  stripeSubscriptionId: string | null;
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className="mt-0.5 size-3.5 shrink-0 text-zinc-500"
      aria-hidden="true"
    >
      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
    </svg>
  );
}

function PlanCard({
  plan,
  annual,
  session,
  loading,
  checkoutEnabled,
  currentPlanSlug,
  onSubscribe,
}: {
  plan: Plan;
  annual: boolean;
  session: { user: { id: string } } | null;
  loading: string | null;
  checkoutEnabled: boolean;
  currentPlanSlug: string | null;
  onSubscribe: (slug: string) => void;
}) {
  const price = annual ? plan.annualPrice : plan.monthlyPrice;
  const isLoggedIn = !!session;
  const isBusy = loading === plan.slug;
  const isFree = plan.slug === "free";
  const isCurrentPlan = currentPlanSlug === plan.slug;

  const cardClasses = `animate-fade-in relative flex flex-col rounded-md border p-5 sm:p-6 transition-colors ${
    plan.highlighted
      ? "border-white/[0.1] bg-white/[0.04]"
      : "border-white/[0.06] bg-white/[0.02]"
  }`;

  const secondaryButtonClasses =
    "flex w-full items-center justify-center rounded-md border border-white/[0.08] py-2.5 text-sm font-medium text-zinc-400 transition-colors duration-150 hover:border-white/[0.16] hover:text-white disabled:cursor-not-allowed disabled:opacity-50";

  const primaryButtonClasses = `w-full rounded-md py-2.5 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
    plan.highlighted
      ? "bg-white text-black hover:opacity-85"
      : "border border-white/[0.08] text-zinc-400 hover:border-white/[0.16] hover:text-white"
  }`;

  return (
    <div className={cardClasses}>
      {plan.badge && (
        <span className="absolute -top-2.5 left-4 rounded-md bg-white px-2.5 py-0.5 text-[11px] font-semibold text-black">
          {plan.badge}
        </span>
      )}

      <div>
        <p className="text-[11px] font-medium text-zinc-500">{plan.name}</p>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-3xl font-semibold tracking-tight text-white tabular-nums">
            ${price}
          </span>
          {plan.monthlyPrice > 0 && (
            <span className="text-sm text-zinc-600">/{annual ? "yr" : "mo"}</span>
          )}
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
          {plan.description}
        </p>
      </div>

      <div className="my-5 h-px bg-white/[0.06]" />

      <ul className="flex-1 space-y-2.5">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2.5 text-[13px] text-zinc-400"
          >
            <CheckIcon />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {isFree ? (
          <Link
            href={isLoggedIn ? "/dashboard" : "/login?tab=sign-up"}
            className={secondaryButtonClasses}
          >
            {isLoggedIn ? "Go to dashboard" : plan.cta}
          </Link>
        ) : !checkoutEnabled ? (
          <button type="button" disabled className={secondaryButtonClasses}>
            Stripe setup required
          </button>
        ) : isCurrentPlan ? (
          <button type="button" disabled className={secondaryButtonClasses}>
            Current plan
          </button>
        ) : isLoggedIn ? (
          <button
            type="button"
            onClick={() => onSubscribe(plan.slug)}
            disabled={isBusy}
            className={primaryButtonClasses}
          >
            {isBusy ? (
              <span className="flex items-center justify-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Redirecting...
              </span>
            ) : (
              `Upgrade to ${plan.name}`
            )}
          </button>
        ) : (
          <Link href="/login?tab=sign-up" className={primaryButtonClasses}>
            {plan.cta}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function PricingClient({
  billingReadiness,
}: {
  billingReadiness: StripeBillingReadiness;
}) {
  const [annual, setAnnual] = useState(false);
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [activeSub, setActiveSub] = useState<SubscriptionSummary | null>(null);

  useEffect(() => {
    if (!session) {
      setActiveSub(null);
      return;
    }

    let cancelled = false;

    async function loadSubscription() {
      try {
        const { data, error } = await authClient.subscription.list();
        if (cancelled || error) return;

        const subscriptions = (data as SubscriptionSummary[] | undefined) ?? [];
        const activeSubscription =
          subscriptions.find(
            (subscription) =>
              subscription.status === "active" ||
              subscription.status === "trialing",
          ) ?? null;

        setActiveSub(activeSubscription);
      } catch {
        if (!cancelled) {
          setActiveSub(null);
        }
      }
    }

    void loadSubscription();

    return () => {
      cancelled = true;
    };
  }, [session]);

  const handleSubscribe = async (slug: string) => {
    setLoading(slug);
    setError("");

    if (!billingReadiness.checkoutEnabled) {
      setError(
        "Stripe is connected, but checkout is disabled until you run `pnpm stripe:sync` and restart the server.",
      );
      setLoading(null);
      return;
    }

    try {
      const { error } = await authClient.subscription.upgrade({
        plan: slug,
        successUrl: "/dashboard/billing?success=true",
        cancelUrl: "/pricing",
        annual,
        ...(activeSub?.stripeSubscriptionId
          ? {
              subscriptionId: activeSub.stripeSubscriptionId,
              returnUrl: "/dashboard/billing",
            }
          : {}),
      });

      if (error) {
        setError(error.message ?? "Could not start checkout for that plan.");
      }
    } catch {
      setError("Could not start checkout for that plan.");
    } finally {
      setLoading(null);
    }
  };

  if (!billingReadiness.stripeConfigured) {
    return (
      <div className="min-h-dvh bg-[#09090b] font-sans text-zinc-100">
        <header className="animate-fade-in border-b border-white/[0.04]">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
            <Link
              href="/"
              className="text-[13px] font-semibold tracking-tight text-white"
            >
              {APP_NAME}
            </Link>
          </div>
        </header>

        <main className="px-5 sm:px-8">
          <div className="mx-auto max-w-md animate-fade-in py-20">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-8">
              <h2 className="text-lg font-medium text-white">
                Payments not configured
              </h2>
              <p className="mt-2 text-[13px] text-zinc-500">
                Set these in your{" "}
                <code className="rounded bg-zinc-800/50 px-1.5 py-0.5 text-[12px] text-white">
                  .env
                </code>{" "}
                (or in your host&apos;s environment / dashboard for production), then restart or redeploy.
              </p>
              <div className="mt-5 space-y-2 text-left">
                {[
                  "STRIPE_SECRET_KEY=sk_...",
                  "STRIPE_WEBHOOK_SECRET=whsec_...",
                  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...",
                ].map((value) => (
                  <code
                    key={value}
                    className="flex rounded-md border border-white/[0.06] px-4 py-2 font-mono text-[12px] text-zinc-500"
                  >
                    {value}
                  </code>
                ))}
              </div>
              <Link
                href="/"
                className="mt-6 inline-block text-[13px] text-zinc-600 transition-colors hover:text-white"
              >
                Back home
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#09090b] font-sans text-zinc-100">
      <header className="animate-fade-in border-b border-white/[0.04]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="text-[13px] font-semibold tracking-tight text-white"
          >
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-5">
            <Link
              href="/"
              className="hidden text-[12px] text-zinc-600 transition-colors duration-150 hover:text-white sm:inline"
            >
              Home
            </Link>
            {session ? (
              <Link
                href="/dashboard"
                className="text-[12px] text-zinc-500 transition-colors duration-150 hover:text-white"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-[12px] text-zinc-500 transition-colors duration-150 hover:text-white"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="px-5 sm:px-8">
        <div className="mx-auto max-w-4xl py-14 sm:py-20">
          <div className="animate-fade-in text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Simple, transparent pricing
            </h1>
            <p className="mx-auto mt-3 max-w-md text-[13px] text-zinc-500">
              Start free. Upgrade when you need more. No hidden fees, cancel
              anytime.
            </p>
          </div>

          <div className="animate-fade-in mt-8 flex items-center justify-center">
            <div className="inline-flex items-center gap-3 rounded-md border border-white/[0.06] bg-white/[0.02] p-1 pl-4">
              <span
                className={`text-sm font-medium transition-colors duration-150 ${
                  !annual ? "text-white" : "text-zinc-600"
                }`}
              >
                Monthly
              </span>
              <button
                type="button"
                onClick={() => setAnnual(!annual)}
                aria-label="Toggle annual billing"
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${
                  annual ? "bg-white" : "bg-zinc-800"
                }`}
              >
                <span
                  className={`inline-block size-3.5 rounded-full shadow-sm transition-transform duration-200 ${
                    annual ? "translate-x-[18px] bg-black" : "translate-x-[3px] bg-white"
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium transition-colors duration-150 ${
                  annual ? "text-white" : "text-zinc-600"
                }`}
              >
                Annual
              </span>
              <span className="rounded-md border border-white/[0.06] bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-zinc-400">
                Save ~17%
              </span>
            </div>
          </div>

          {!billingReadiness.checkoutEnabled && (
            <div className="mx-auto mt-6 max-w-2xl rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[12px] text-zinc-300">
              Stripe is connected, but paid checkout is disabled until plan IDs
              are generated for this account. Run{" "}
              <code className="rounded bg-zinc-800/50 px-1.5 py-0.5 text-[11px] text-white">
                pnpm stripe:sync
              </code>
              , restart the server, and keep{" "}
              <code className="rounded bg-zinc-800/50 px-1.5 py-0.5 text-[11px] text-white">
                pnpm stripe:poll
              </code>{" "}
              running locally if subscriptions remain incomplete.
            </div>
          )}

          {error && (
            <div className="mx-auto mt-6 max-w-md rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-center text-[12px] text-zinc-300">
              {error}
            </div>
          )}

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.slug}
                plan={plan}
                annual={annual}
                session={session}
                loading={loading}
                checkoutEnabled={billingReadiness.checkoutEnabled}
                currentPlanSlug={activeSub?.plan ?? null}
                onSubscribe={handleSubscribe}
              />
            ))}
          </div>

          <p className="mt-10 text-center text-[12px] text-zinc-600">
            All plans include SSL, daily backups, and 99.9% uptime.
          </p>
        </div>
      </main>
    </div>
  );
}
