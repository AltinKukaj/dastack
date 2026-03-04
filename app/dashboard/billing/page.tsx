"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";
import { getClientFeatureFlags } from "@/lib/feature-flags-client";
import { hasPermission } from "@/lib/permissions";
import { DashboardShell } from "../components/dashboard-shell";

const statusColors: Record<string, string> = {
  active: "border-neutral-600 text-white",
  trialing: "border-neutral-700 text-neutral-300",
  canceled: "border-red-900/50 text-red-400",
  past_due: "border-neutral-700 text-neutral-400",
  incomplete: "border-neutral-800 text-neutral-600",
  incomplete_expired: "border-neutral-800 text-neutral-600",
  unpaid: "border-red-900/50 text-red-400",
  paused: "border-neutral-800 text-neutral-600",
};

interface Subscription {
  id: string;
  plan: string;
  status: string | null;
  stripeSubscriptionId: string | null;
  periodStart: Date | string | null | undefined;
  periodEnd: Date | string | null | undefined;
  cancelAtPeriodEnd: boolean | null;
  cancelAt: Date | string | null | undefined;
  canceledAt: Date | string | null | undefined;
  seats: number | null;
  trialStart: Date | string | null | undefined;
  trialEnd: Date | string | null | undefined;
  billingInterval: string | null;
  limits?: Record<string, number> | null;
}

export default function BillingPage() {
  const { data: session, isPending } = useSession();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subLoading, setSubLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [stripeEnabled, setStripeEnabled] = useState<boolean | null>(null);
  const [billingMsg, setBillingMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  useEffect(() => {
    getClientFeatureFlags()
      .then((data) => setStripeEnabled(data.stripe ?? false))
      .catch(() => setStripeEnabled(false));
  }, []);

  useEffect(() => {
    if (!session) return;
    const fetchSubs = async () => {
      setSubLoading(true);
      try {
        const { data } = await authClient.subscription.list();
        setSubscriptions((data as Subscription[]) ?? []);
      } catch {
        setBillingMsg({
          type: "err",
          text: "Could not load subscription data. Please refresh and try again.",
        });
      } finally {
        setSubLoading(false);
      }
    };
    fetchSubs();
  }, [session]);

  const activeSub = subscriptions.find(
    (s) => s.status === "active" || s.status === "trialing",
  );
  const roleValue = (session?.user as Record<string, unknown> | undefined)
    ?.role;
  const canManageBilling = hasPermission(roleValue, "billing:manage");

  const openBillingPortal = async () => {
    setBillingMsg(null);
    setPortalLoading(true);
    try {
      const { error } = await authClient.subscription.billingPortal({
        returnUrl: "/dashboard/billing",
      });
      if (error) {
        setBillingMsg({
          type: "err",
          text: error.message ?? "Could not open billing portal.",
        });
      }
    } catch {
      setBillingMsg({
        type: "err",
        text: "Could not open billing portal.",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCancel = async (sub: Subscription) => {
    if (!sub.stripeSubscriptionId) return;

    setBillingMsg(null);
    setCancelLoading(sub.id);
    try {
      const { error } = await authClient.subscription.cancel({
        subscriptionId: sub.stripeSubscriptionId,
        returnUrl: "/dashboard/billing",
      });
      if (error) {
        throw new Error(error.message ?? "Could not cancel subscription.");
      }

      const { data } = await authClient.subscription.list();
      setSubscriptions((data as Subscription[]) ?? []);
      setBillingMsg({
        type: "ok",
        text: "Cancellation requested successfully.",
      });
      setCancelConfirmId(null);
    } catch (err: unknown) {
      setBillingMsg({
        type: "err",
        text:
          err instanceof Error ? err.message : "Could not cancel subscription.",
      });
    } finally {
      setCancelLoading(null);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <span className="size-5 animate-spin rounded-full border-2 border-neutral-800 border-t-white" />
      </div>
    );
  }

  return (
    <DashboardShell
      sectionLabel="Billing"
      stripeEnabled={stripeEnabled ?? false}
      user={{
        image: session?.user.image,
        name: session?.user.name,
        email: session?.user.email,
      }}
      headerActions={
        <Link
          href="/dashboard"
          className="rounded-lg border border-neutral-800/60 px-3 py-1.5 text-xs text-neutral-600 transition hover:text-white"
        >
          Back to overview
        </Link>
      }
    >
      <main className="mx-auto w-full max-w-3xl px-6 py-8">
        {stripeEnabled === false ? (
          <div className="animate-fade-in rounded-xl border border-neutral-800/60 p-8 text-center">
            <h3 className="font-[family-name:var(--font-geist-mono)] text-lg text-white">
              Stripe not configured
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              Add your Stripe keys to <code className="text-white">.env</code>{" "}
              to enable billing.
            </p>
          </div>
        ) : (
          <div className="animate-fade-in space-y-6">
            {/* Current Plan */}
            <section>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-neutral-600">Current Plan</p>
                  <h1 className="mt-1 font-[family-name:var(--font-geist-mono)] text-2xl capitalize">
                    {subLoading ? (
                      <span className="inline-block h-7 w-20 animate-pulse rounded bg-neutral-800" />
                    ) : (
                      (activeSub?.plan ?? "Free")
                    )}
                  </h1>
                </div>
                {activeSub && (
                  <span
                    className={`rounded-md border px-2.5 py-0.5 text-[11px] font-medium capitalize ${statusColors[activeSub.status ?? "incomplete"]}`}
                  >
                    {activeSub.status}
                  </span>
                )}
              </div>

              <div className="mt-4 rounded-xl border border-neutral-800/60 p-5">
                {activeSub ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <DetailCard
                        label="Billing Cycle"
                        value={
                          activeSub.billingInterval === "year"
                            ? "Annual"
                            : "Monthly"
                        }
                      />
                      <DetailCard
                        label="Next Invoice"
                        value={
                          activeSub.periodEnd
                            ? new Date(activeSub.periodEnd).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                            : "-"
                        }
                      />
                      <DetailCard
                        label="Reference"
                        value={activeSub.stripeSubscriptionId?.slice(-8) ?? "-"}
                      />
                    </div>

                    {activeSub.cancelAtPeriodEnd && (
                      <div className="mt-4 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-xs text-neutral-400">
                        Cancels on{" "}
                        {activeSub.periodEnd
                          ? new Date(activeSub.periodEnd).toLocaleDateString()
                          : "-"}
                      </div>
                    )}

                    {billingMsg && (
                      <p
                        className={`mt-4 text-xs ${billingMsg.type === "ok" ? "text-neutral-400" : "text-red-400"}`}
                      >
                        {billingMsg.text}
                      </p>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2">
                      {canManageBilling ? (
                        <button
                          type="button"
                          onClick={openBillingPortal}
                          disabled={portalLoading}
                          className="rounded-lg bg-white px-4 py-2 text-xs font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50"
                        >
                          {portalLoading ? "Opening..." : "Manage Billing"}
                        </button>
                      ) : (
                        <span className="rounded-lg border border-neutral-800 px-3 py-2 text-xs text-neutral-500">
                          Billing is read-only for your role
                        </span>
                      )}
                      <Link
                        href="/pricing"
                        className="rounded-lg border border-neutral-800 px-4 py-2 text-xs font-medium text-neutral-400 transition hover:border-neutral-700 hover:text-white"
                      >
                        Upgrade Plan
                      </Link>
                      {canManageBilling &&
                        !activeSub.cancelAtPeriodEnd &&
                        (cancelConfirmId === activeSub.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleCancel(activeSub)}
                              disabled={cancelLoading === activeSub.id}
                              className="rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-2 text-xs font-medium text-red-300 transition hover:bg-red-950/40 disabled:opacity-50"
                            >
                              {cancelLoading === activeSub.id
                                ? "Canceling..."
                                : "Confirm cancel"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setCancelConfirmId(null)}
                              disabled={cancelLoading === activeSub.id}
                              className="rounded-lg border border-neutral-800 px-4 py-2 text-xs font-medium text-neutral-400 transition hover:border-neutral-700 hover:text-white disabled:opacity-50"
                            >
                              Keep plan
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setBillingMsg(null);
                              setCancelConfirmId(activeSub.id);
                            }}
                            disabled={!!cancelLoading}
                            className="rounded-lg border border-red-900/30 px-4 py-2 text-xs font-medium text-red-400/80 transition hover:bg-red-950/20 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-neutral-600">
                      You are currently on the free version.
                    </p>
                    <Link
                      href="/pricing"
                      className="rounded-lg bg-white px-4 py-2 text-xs font-medium text-black transition hover:bg-neutral-200"
                    >
                      Go Pro
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* History */}
            {subscriptions.length > 0 && (
              <section>
                <p className="text-xs text-neutral-600">History</p>
                <div className="mt-3 space-y-2">
                  {subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between rounded-lg border border-neutral-800/60 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium capitalize text-white">
                          {sub.plan}
                        </p>
                        <p className="mt-0.5 text-[11px] text-neutral-700">
                          {sub.periodStart
                            ? new Date(sub.periodStart).toLocaleDateString()
                            : "-"}{" "}
                          -{" "}
                          {sub.periodEnd
                            ? new Date(sub.periodEnd).toLocaleDateString()
                            : "-"}
                        </p>
                      </div>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-medium capitalize ${statusColors[sub.status ?? "incomplete"]}`}
                      >
                        {sub.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Dev Note */}
            {process.env.NODE_ENV === "development" && (
              <section className="rounded-lg border border-dashed border-neutral-800 p-5 opacity-60">
                <p className="text-xs text-neutral-500">Development Note</p>
                <p className="mt-1.5 text-xs text-neutral-600">
                  If subscription status is stuck in{" "}
                  <span className="text-white">incomplete</span>, run the local
                  Stripe poller in a second terminal:
                  <br />
                  <code className="mt-2 block rounded-lg bg-neutral-900 p-2 text-white">
                    bun stripe:poll
                  </code>
                  <span className="mt-2 block">
                    You can still use Stripe CLI webhooks as an alternative.
                  </span>
                </p>
              </section>
            )}
          </div>
        )}
      </main>
    </DashboardShell>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-neutral-600">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}
