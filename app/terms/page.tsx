import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service - dastack",
  description: "Terms of Service for dastack.",
};

const sections = [
  {
    title: "Use of the Service",
    body: "You agree to use the service only for lawful purposes and in accordance with these terms. You are responsible for maintaining the confidentiality of your account credentials.",
  },
  {
    title: "Intellectual Property",
    body: "All content and functionality on this service are owned by us and protected by applicable intellectual property laws.",
  },
  {
    title: "Limitation of Liability",
    body: "To the fullest extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from your use of the service.",
  },
  {
    title: "Changes to Terms",
    body: "We may modify these terms at any time. Continued use of the service constitutes acceptance of the updated terms.",
  },
];

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-500">
            These terms govern use of this application.
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
