"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import type { StripeBillingReadiness } from "@/lib/features";
import { getPlanBySlug, plans } from "@/lib/plans";
import { useTRPC } from "@/lib/trpc/client";

type BillingCapabilities = {
  enabled: boolean;
  providers: {
    stripe: boolean;
  };
  defaultProvider: "stripe" | null;
  readiness: StripeBillingReadiness;
};

type SubscriptionSummary = {
  id: string;
  plan: string;
  status: string;
  provider: "stripe" | null;
  stripeSubscriptionId: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  referenceId: string;
};

type EntitlementSnapshot = {
  subjectId?: string;
  subjectType?: "user" | "organization";
  plan: string;
  limits: Record<string, { limit: number; used: number; remaining: number }>;
};

const STATUS_STYLES: Record<string, string> = {
  active: "border-white/[0.1] bg-white/[0.06] text-white",
  trialing: "border-white/[0.08] bg-white/[0.04] text-zinc-300",
  canceled: "border-white/[0.06] bg-white/[0.03] text-zinc-400",
  past_due: "border-white/[0.06] bg-white/[0.03] text-zinc-400",
  incomplete: "border-white/[0.06] bg-white/[0.03] text-zinc-500",
  incomplete_expired: "border-white/[0.06] bg-white/[0.03] text-zinc-500",
  unpaid: "border-white/[0.06] bg-white/[0.03] text-zinc-500",
  paused: "border-white/[0.06] bg-white/[0.03] text-zinc-500",
};

function formatDate(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_STYLES[status] ?? STATUS_STYLES.incomplete;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${colors}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function BillingPage() {
  const trpc = useTRPC();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const capabilitiesQuery = useQuery(trpc.billing.capabilities.queryOptions());
  const subscriptionsQuery = useQuery(trpc.billing.subscriptions.queryOptions());
  const entitlementsQuery = useQuery(trpc.billing.entitlements.queryOptions());

  const isLoading =
    capabilitiesQuery.isPending ||
    subscriptionsQuery.isPending ||
    entitlementsQuery.isPending;

  const capabilities = (capabilitiesQuery.data as BillingCapabilities | undefined) ?? {
    enabled: false,
    providers: { stripe: false },
    defaultProvider: null,
    readiness: {
      stripeConfigured: false,
      stripePlansReady: false,
      checkoutEnabled: false,
    },
  };
  const allSubs = (subscriptionsQuery.data as SubscriptionSummary[] | undefined) ?? [];
  const entitlements = entitlementsQuery.data as EntitlementSnapshot | undefined;
  const subscription =
    allSubs.find(
      (currentSubscription) =>
        currentSubscription.status === "active" ||
        currentSubscription.status === "trialing",
    ) ??
    allSubs[0] ??
    null;
  const pastSubs = allSubs.filter(
    (currentSubscription) =>
      currentSubscription.id !== subscription?.id &&
      (currentSubscription.status === "canceled" ||
        currentSubscription.status === "past_due"),
  );
  const checkoutEnabled = capabilities.readiness.checkoutEnabled;

  const refreshBilling = async () => {
    await Promise.all([
      subscriptionsQuery.refetch(),
      entitlementsQuery.refetch(),
      capabilitiesQuery.refetch(),
    ]);
  };

  const handlePortal = async () => {
    setError("");
    setNotice("");

    if (!checkoutEnabled) {
      setError(
        "Stripe is connected, but billing actions stay disabled until you run `pnpm stripe:sync` and restart the server.",
      );
      return;
    }

    setActionLoading("portal");
    try {
      const { error: portalError } = await authClient.subscription.billingPortal({
        returnUrl: "/dashboard/billing",
      });

      if (portalError) {
        setError(portalError.message ?? "Could not open the billing portal.");
      }
    } catch {
      setError("Could not open the billing portal.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpgrade = async (slug: string) => {
    setError("");
    setNotice("");

    if (!checkoutEnabled) {
      setError(
        "Stripe plans are not synced yet. Run `pnpm stripe:sync` and restart the server before upgrading.",
      );
      return;
    }

    setActionLoading(`upgrade-${slug}`);
    try {
      const { error: upgradeError } = await authClient.subscription.upgrade({
        plan: slug,
        annual: false,
        successUrl: "/dashboard/billing?success=true",
        cancelUrl: "/dashboard/billing",
        ...(subscription?.stripeSubscriptionId
          ? {
              subscriptionId: subscription.stripeSubscriptionId,
              returnUrl: "/dashboard/billing",
            }
          : {}),
      });

      if (upgradeError) {
        setError(upgradeError.message ?? "Could not start checkout for that plan.");
        return;
      }

      setNotice(
        subscription?.stripeSubscriptionId
          ? `Switching to ${slug}. Stripe may redirect you to confirm the change.`
          : `Starting checkout for ${slug}. Stripe may redirect you to complete payment.`,
      );
      await refreshBilling();
    } catch {
      setError("Could not start checkout for that plan.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!subscription?.stripeSubscriptionId) {
      setError("No Stripe subscription is attached to the current plan.");
      return;
    }

    setError("");
    setNotice("");
    setActionLoading("cancel");
    try {
      const { error: cancelError } = await authClient.subscription.cancel({
        subscriptionId: subscription.stripeSubscriptionId,
        returnUrl: "/dashboard/billing",
      });

      if (cancelError) {
        setError(cancelError.message ?? "Could not update the subscription.");
        return;
      }

      setNotice("Your subscription will cancel at the end of the current period.");
      await refreshBilling();
    } catch {
      setError("Could not update the subscription.");
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-5">
        <Header />
        <div className="panel p-8 text-center text-[13px] text-zinc-500">
          Loading billing information...
        </div>
      </div>
    );
  }

  if (!capabilities.enabled) {
    return (
      <div className="animate-fade-in space-y-5">
        <Header />
        <div className="panel py-14 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
            <svg
              className="size-5 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-[15px] font-medium text-white">
            Payments not configured
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[12px] text-zinc-500">
            Billing becomes available when Stripe is configured for this
            deployment.
          </p>
          <Link
            href="/pricing"
            className="mt-5 inline-block text-[12px] text-zinc-500 transition-colors hover:text-white"
          >
            View pricing plans
          </Link>
        </div>
      </div>
    );
  }

  const planMeta = subscription ? getPlanBySlug(subscription.plan) : null;

  return (
    <div className="animate-fade-in space-y-5">
      <Header />

      {!checkoutEnabled && (
        <div className="rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[12px] text-zinc-300">
          Stripe is connected, but checkout and portal access are disabled
          until plan IDs are synced for this account. Run{" "}
          <code className="rounded bg-zinc-800/50 px-1.5 py-0.5 text-[11px] text-white">
            pnpm stripe:sync
          </code>
          , restart the server, and use{" "}
          <code className="rounded bg-zinc-800/50 px-1.5 py-0.5 text-[11px] text-white">
            pnpm stripe:poll
          </code>{" "}
          locally if new subscriptions stay incomplete.
        </div>
      )}

      {notice && (
        <div className="rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[12px] text-zinc-300">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[12px] text-zinc-300">
          {error}
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <h2 className="heading-section">Current plan</h2>
        </div>
        <div className="panel-body">
          {subscription ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-semibold capitalize text-white">
                      {subscription.plan}
                    </h3>
                    <StatusBadge status={subscription.status} />
                  </div>
                  {planMeta && (
                    <p className="mt-1 text-[12px] text-zinc-500">
                      ${planMeta.monthlyPrice}/mo | {planMeta.limits.projects}{" "}
                      projects | {planMeta.limits.storage} GB storage
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handlePortal()}
                    disabled={!checkoutEnabled || actionLoading === "portal"}
                    className="btn-outline px-3 py-1.5 text-[12px] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading === "portal" && (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    )}
                    Manage billing
                  </button>
                  {subscription.status === "active" &&
                    !subscription.cancelAtPeriodEnd && (
                      <button
                        type="button"
                        onClick={() => void handleCancel()}
                        disabled={
                          actionLoading === "cancel" ||
                          !subscription.stripeSubscriptionId
                        }
                        className="btn-outline border-white/[0.08] px-3 py-1.5 text-[12px] text-zinc-400 hover:border-white/[0.16] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {actionLoading === "cancel" && (
                          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        )}
                        Cancel
                      </button>
                    )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <p className="text-[11px] text-zinc-500">Current period</p>
                  <p className="mt-1 text-[13px] text-white">
                    {formatDate(subscription.periodStart)} -{" "}
                    {formatDate(subscription.periodEnd)}
                  </p>
                </div>
                <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <p className="text-[11px] text-zinc-500">
                    {subscription.cancelAtPeriodEnd ? "Cancels on" : "Next renewal"}
                  </p>
                  <p className="mt-1 text-[13px] text-white">
                    {formatDate(subscription.periodEnd)}
                  </p>
                </div>
              </div>

              {subscription.cancelAtPeriodEnd && (
                <div className="rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[12px] text-zinc-300">
                  Your subscription will cancel at the end of the current
                  billing period.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[13px] text-zinc-500">
                No active subscription. Pick a plan to get started.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {plans
                  .filter((plan) => plan.slug !== "free")
                  .map((plan) => (
                    <button
                      key={plan.slug}
                      type="button"
                      onClick={() => void handleUpgrade(plan.slug)}
                      disabled={
                        !checkoutEnabled || actionLoading === `upgrade-${plan.slug}`
                      }
                      className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 text-left transition-colors duration-150 hover:border-white/[0.12] hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div>
                        <p className="text-[13px] font-medium text-white">
                          {plan.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-zinc-500">
                          ${plan.monthlyPrice}/mo
                          {plan.trialDays
                            ? ` | ${plan.trialDays}-day trial`
                            : ""}
                        </p>
                      </div>
                      {actionLoading === `upgrade-${plan.slug}` ? (
                        <Loader2 className="size-4 animate-spin text-zinc-400" />
                      ) : (
                        <svg
                          className="size-4 text-zinc-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m8.25 4.5 7.5 7.5-7.5 7.5"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
              </div>
              <Link
                href="/pricing"
                className="inline-block text-[12px] text-zinc-500 transition-colors hover:text-white"
              >
                Compare all plans
              </Link>
            </div>
          )}
        </div>
      </div>

      {entitlements && Object.keys(entitlements.limits).length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <h2 className="heading-section">Usage</h2>
          </div>
          <div className="panel-body space-y-3">
            {Object.entries(entitlements.limits).map(([key, value]) => {
              const isUnlimited = value.limit === -1;
              const percent = isUnlimited
                ? 0
                : Math.min((value.used / value.limit) * 100, 100);

              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] text-zinc-300">{key}</p>
                    <p className="text-[12px] text-zinc-500 tabular-nums">
                      {value.used} / {isUnlimited ? "unlimited" : value.limit}
                    </p>
                  </div>
                  {!isUnlimited && (
                    <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-white transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {subscription && (
        <div className="panel">
          <div className="panel-header">
            <h2 className="heading-section">Switch plan</h2>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {plans
              .filter((plan) => plan.slug !== "free")
              .map((plan) => {
                const isCurrent = subscription.plan === plan.slug;

                return (
                  <div
                    key={plan.slug}
                    className="flex items-center justify-between px-5 py-3.5"
                  >
                    <div>
                      <p className="text-[13px] font-medium text-white">
                        {plan.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-zinc-500">
                        ${plan.monthlyPrice}/mo
                      </p>
                    </div>
                    {isCurrent ? (
                      <span className="text-[11px] text-zinc-600">Current</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleUpgrade(plan.slug)}
                        disabled={
                          !checkoutEnabled || actionLoading === `upgrade-${plan.slug}`
                        }
                        className="text-[12px] text-zinc-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {actionLoading === `upgrade-${plan.slug}` ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          "Switch"
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {pastSubs.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <h2 className="heading-section">History</h2>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {pastSubs.map((pastSubscription) => (
              <div
                key={pastSubscription.id}
                className="flex items-center justify-between px-5 py-3.5"
              >
                <div>
                  <p className="text-[13px] capitalize text-white">
                    {pastSubscription.plan}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-600">
                    {formatDate(pastSubscription.periodStart)} -{" "}
                    {formatDate(pastSubscription.periodEnd)}
                  </p>
                </div>
                <StatusBadge status={pastSubscription.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {process.env.NODE_ENV === "development" && (
        <div className="rounded-md border border-dashed border-white/[0.08] px-4 py-3 text-[12px] text-zinc-400">
          If a new subscription stays in <span className="text-white">incomplete</span>,
          keep{" "}
          <code className="rounded bg-zinc-800/50 px-1.5 py-0.5 text-[11px] text-white">
            pnpm stripe:poll
          </code>{" "}
          running in a second terminal while testing locally.
        </div>
      )}
    </div>
  );
}

function Header() {
  return (
    <div>
      <p className="section-label">Billing</p>
      <h1 className="mt-1 heading-page">Subscription</h1>
    </div>
  );
}
