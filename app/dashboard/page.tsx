"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authDebugClient } from "@/lib/auth-debug-client";
import { signOut, useSession } from "@/lib/auth-client";
import { getClientFeatureFlags } from "@/lib/feature-flags-client";
import { useAppStore } from "@/lib/store";
import { trpc } from "@/lib/trpc";
import { DashboardShell } from "./components/dashboard-shell";

const quickActions = [
  {
    label: "Billing & Stripe",
    description: "Manage your subscription, view plans, and configure Stripe.",
    href: "/dashboard/billing",
  },
  {
    label: "Account settings",
    description: "Review the placeholder profile and security surfaces.",
    href: "/dashboard/settings",
  },
  {
    label: "Documentation",
    description: "Open the starter README and replace the product layer next.",
    href: "https://github.com/AltinKukaj/dastack#readme",
    external: true,
  },
];

const setupSteps = [
  { label: "Authentication configured", done: true },
  { label: "Database connection added", done: true },
  { label: "Stripe integration scaffolded", done: true },
  { label: "Configure Stripe price IDs", done: false },
  { label: "Build your first tRPC route", done: false },
  { label: "Replace dashboard placeholders", done: false },
];

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [stripeEnabled, setStripeEnabled] = useState(false);

  const commandOpen = useAppStore((s) => s.commandOpen);
  const toggleCommand = useAppStore((s) => s.toggleCommand);

  const { data: helloData } = trpc.example.hello.useQuery(
    { name: session?.user.name?.split(" ")[0] || "User" },
    { enabled: !!session },
  );

  useEffect(() => {
    authDebugClient("dashboard.client.feature_load.start");
    getClientFeatureFlags()
      .then((data) => {
        authDebugClient("dashboard.client.feature_load.success", data);
        setStripeEnabled(data.stripe ?? false);
      })
      .catch((error) => {
        authDebugClient("dashboard.client.feature_load.error", {
          error: error instanceof Error ? error.message : String(error),
        });
      });
  }, []);

  useEffect(() => {
    authDebugClient("dashboard.client.session_state", {
      isPending,
      hasSession: !!session,
      userId: session?.user?.id ?? null,
      email: session?.user?.email ?? null,
    });
  }, [isPending, session]);

  const handleSignOut = async () => {
    authDebugClient("dashboard.sign_out.start");
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          authDebugClient("dashboard.sign_out.success.redirect", {
            redirectTo: "/sign-in",
          });
          router.push("/sign-in");
        },
      },
    });
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <span className="size-5 animate-spin rounded-full border-2 border-neutral-800 border-t-white" />
      </div>
    );
  }

  const displayName = session?.user.name ?? "User";
  const firstName = displayName.split(" ")[0];

  const stats = [
    { label: "Total users", value: "1", note: "+1 today" },
    { label: "Active sessions", value: "1", note: "Current session" },
    {
      label: "tRPC Greeting",
      value: helloData?.greeting ? "OK" : "-",
      note: helloData?.greeting ?? "Connecting tRPC...",
    },
    { label: "Uptime", value: "100%", note: "All systems healthy" },
  ];

  return (
    <DashboardShell
      sectionLabel="Overview"
      stripeEnabled={stripeEnabled}
      user={{
        image: session?.user.image,
        name: session?.user.name,
        email: session?.user.email,
      }}
      headerActions={
        <>
          <button
            type="button"
            onClick={toggleCommand}
            className={`rounded-lg border px-3 py-1.5 text-xs transition ${
              commandOpen
                ? "border-neutral-600 bg-neutral-800 text-white"
                : "border-neutral-800/60 text-neutral-600 hover:text-white"
            }`}
          >
            {commandOpen ? "Command: ON" : "Command: OFF"}
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border border-neutral-800/60 px-3 py-1.5 text-xs text-neutral-600 transition hover:text-white"
          >
            Sign out
          </button>
        </>
      }
    >
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="animate-fade-in mx-auto max-w-4xl">
          <h1 className="font-[family-name:var(--font-geist-mono)] text-2xl tracking-tight">
            Welcome back{firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Your current metrics and next steps.
          </p>

          <div className="mt-8 divide-y divide-neutral-800/40">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="animate-slide-up flex items-baseline justify-between py-3.5"
                style={{ animationDelay: `${150 + i * 70}ms` }}
              >
                <span className="text-sm text-neutral-500">{stat.label}</span>
                <div className="flex items-baseline gap-4">
                  <span className="font-[family-name:var(--font-geist-mono)] text-sm text-white">
                    {stat.value}
                  </span>
                  <span className="text-[11px] text-neutral-700">
                    {stat.note}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-10 xl:grid-cols-2">
            <section>
              <h2 className="text-[13px] font-medium text-neutral-400">
                Next moves
              </h2>
              <div className="mt-4 space-y-0 divide-y divide-neutral-800/40">
                {quickActions
                  .filter(
                    (a) => a.href !== "/dashboard/billing" || stripeEnabled,
                  )
                  .map((action, i) => {
                    const inner = (
                      <>
                        <p className="text-sm text-white transition-transform group-hover:translate-x-1">
                          {action.label}
                        </p>
                        <p className="mt-0.5 text-[12px] text-neutral-700">
                          {action.description}
                        </p>
                      </>
                    );
                    return action.external ? (
                      <a
                        key={action.label}
                        href={action.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block py-3.5 animate-slide-up"
                        style={{ animationDelay: `${500 + i * 80}ms` }}
                      >
                        {inner}
                      </a>
                    ) : (
                      <Link
                        key={action.label}
                        href={action.href}
                        className="group block py-3.5 animate-slide-up"
                        style={{ animationDelay: `${500 + i * 80}ms` }}
                      >
                        {inner}
                      </Link>
                    );
                  })}
              </div>
            </section>

            <section>
              <h2 className="text-[13px] font-medium text-neutral-400">
                Checklist
              </h2>
              <div className="mt-4 space-y-0 divide-y divide-neutral-800/40">
                {setupSteps
                  .filter(
                    (step) =>
                      stripeEnabled ||
                      !step.label.toLowerCase().includes("stripe"),
                  )
                  .map((step, index) => (
                    <div
                      key={step.label}
                      className="flex items-center gap-3 py-3 animate-slide-up"
                      style={{ animationDelay: `${600 + index * 60}ms` }}
                    >
                      <span
                        className={`flex size-5 shrink-0 items-center justify-center rounded font-[family-name:var(--font-geist-mono)] text-[10px] ${
                          step.done
                            ? "bg-white text-black"
                            : "border border-neutral-800 text-neutral-700"
                        }`}
                      >
                        {step.done ? (
                          <svg
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            className="size-3"
                            aria-hidden="true"
                          >
                            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span
                        className={`text-sm ${step.done ? "text-neutral-500" : "text-white"}`}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
              </div>
            </section>
          </div>

          {commandOpen && (
            <div className="animate-fade-in mt-8 border-l-2 border-neutral-600 pl-4 py-3">
              <p className="font-[family-name:var(--font-geist-mono)] text-xs text-neutral-400">
                Zustand State Active
              </p>
              <p className="mt-1.5 text-sm text-neutral-600">
                The command palette state is{" "}
                <span className="text-white">enabled</span>. Use this to trigger
                modals or flyouts from anywhere in the component tree.
              </p>
            </div>
          )}
        </div>
      </main>
    </DashboardShell>
  );
}
