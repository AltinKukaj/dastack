import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - dastack",
  description: "Privacy Policy for dastack.",
};

const sections = [
  {
    title: "Information We Collect",
    body: "We collect information you provide directly, such as your email address when you sign in, and information automatically collected through cookies and session tokens.",
  },
  {
    title: "How We Use Your Information",
    body: "We use your information to provide and improve the service, authenticate your identity, and communicate with you about your account.",
  },
  {
    title: "Data Security",
    body: "We apply appropriate security measures to protect your personal information. No transmission or storage method is completely secure.",
  },
  {
    title: "Third-Party Services",
    body: "OAuth providers, payment processors, and other external services may process data under their own policies.",
  },
  {
    title: "Policy Changes",
    body: "We may update this policy over time. Changes become effective when the revised policy is posted on this page.",
  },
];

export default function PrivacyPage() {
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#09090b] font-[family-name:var(--font-geist-sans)] text-white">
      <header className="border-b border-neutral-800/40">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="font-[family-name:var(--font-geist-mono)] text-[13px] tracking-tight text-white"
          >
            dastack
          </Link>
          <Link
            href="/"
            className="text-[13px] text-neutral-600 transition-colors hover:text-white"
          >
            Back home
          </Link>
        </div>
      </header>

      <main className="animate-fade-in mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <div>
          <p className="font-[family-name:var(--font-geist-mono)] text-[11px] text-neutral-700">
            Last updated: {lastUpdated}
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-geist-mono)] text-2xl tracking-tight text-white sm:text-3xl">
            Privacy Policy
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-500">
            This policy explains how data is collected and used inside the
            application.
          </p>
        </div>

        <div className="mt-10 divide-y divide-neutral-800/40">
          {sections.map((section, index) => (
            <section key={section.title} className="py-6 first:pt-0">
              <div className="flex items-baseline gap-3">
                <span className="font-[family-name:var(--font-geist-mono)] text-[11px] tabular-nums text-neutral-700">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="text-sm font-medium text-white">
                  {section.title}
                </h2>
              </div>
              <p className="mt-2 pl-8 text-sm leading-7 text-neutral-600">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
