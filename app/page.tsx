import Link from "next/link";
import { getFeatureFlags } from "@/lib/features";

const stack = [
  { name: "Next.js", href: "https://nextjs.org" },
  { name: "React", href: "https://react.dev" },
  { name: "Bun", href: "https://bun.sh" },
  { name: "Prisma", href: "https://prisma.io" },
  { name: "Better Auth", href: "https://www.better-auth.com" },
  { name: "tRPC", href: "https://trpc.io" },
  { name: "Tailwind", href: "https://tailwindcss.com" },
  { name: "Zustand", href: "https://zustand.docs.pmnd.rs" },
  { name: "Biome", href: "https://biomejs.dev" },
  { name: "Zod", href: "https://zod.dev" },
];

const specs = [
  {
    label: "Auth",
    value: "Ready",
    detail: "Sessions, providers, protected routes",
  },
  { label: "API", value: "Typed", detail: "tRPC, Zod, end-to-end safety" },
  {
    label: "Stack",
    value: "Lean",
    detail: "Ship fast, cut back without rewrites",
  },
];

export default function Home() {
  const flags = getFeatureFlags();

  return (
    <div className="flex min-h-screen flex-col bg-[#09090b] font-[family-name:var(--font-geist-sans)] text-white">
      <header className="animate-fade-in fixed top-0 z-50 w-full bg-[#09090b]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="font-[family-name:var(--font-geist-mono)] text-[13px] tracking-tight">
            dastack
          </span>
          <nav className="flex items-center gap-5 sm:gap-6">
            <a
              href="https://github.com/AltinKukaj/dastack"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-neutral-600 transition-colors hover:text-white"
            >
              GitHub
            </a>
            {flags.stripe && (
              <Link
                href="/pricing"
                className="text-[13px] text-neutral-600 transition-colors hover:text-white"
              >
                Pricing
              </Link>
            )}
            <a
              href="https://github.com/AltinKukaj/dastack#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden text-[13px] text-neutral-600 transition-colors hover:text-white sm:inline"
            >
              Docs
            </a>
            {flags.auth && (
              <Link
                href="/auth"
                className="rounded-lg border border-neutral-800 px-4 py-1.5 text-[13px] text-neutral-400 transition hover:border-neutral-700 hover:text-white"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex flex-1 items-center px-6 pt-24 pb-12 lg:pt-0 lg:pb-0">
        <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          <div className="animate-slide-up flex flex-col justify-center">
            <p className="font-[family-name:var(--font-geist-mono)] text-[11px] tracking-[0.2em] text-neutral-600">
              NEXT.JS STARTER
            </p>
            <h1 className="mt-5 font-[family-name:var(--font-geist-mono)] text-[clamp(2.25rem,5.5vw,4.25rem)] leading-[1.08] tracking-tight">
              Build on
              <br />
              structure.
            </h1>
            <p className="animate-slide-up-delayed mt-6 max-w-md text-[15px] leading-7 text-neutral-400">
              Auth, data access, and a typed API surface, already wired. Start
              with sensible defaults and replace the product layer with your
              own.
            </p>
            <div className="animate-slide-up-delayed-2 mt-8 flex flex-wrap gap-3">
              {flags.auth ? (
                <Link
                  href="/auth"
                  className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200"
                >
                  Get started
                </Link>
              ) : (
                <a
                  href="https://github.com/AltinKukaj/dastack"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200"
                >
                  Get started
                </a>
              )}
              <a
                href="https://github.com/AltinKukaj/dastack"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-neutral-800 px-5 py-2.5 text-sm text-neutral-500 transition hover:border-neutral-700 hover:text-white"
              >
                GitHub
              </a>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div>
              {specs.map((spec, i) => (
                <div
                  key={spec.label}
                  className="animate-slide-up flex items-baseline justify-between border-b border-neutral-800/50 py-4 first:pt-0"
                  style={{ animationDelay: `${250 + i * 100}ms` }}
                >
                  <div>
                    <span className="font-[family-name:var(--font-geist-mono)] text-sm text-neutral-500">
                      {spec.label}
                    </span>
                    <p className="mt-0.5 text-[12px] text-neutral-700">
                      {spec.detail}
                    </p>
                  </div>
                  <span className="font-[family-name:var(--font-geist-mono)] text-sm text-white">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="animate-slide-up mt-8 font-[family-name:var(--font-geist-mono)] text-[13px] leading-7 text-neutral-700"
              style={{ animationDelay: "550ms" }}
            >
              <p>
                <span className="text-neutral-800">$</span> bun install
              </p>
              <p>
                <span className="text-neutral-800">$</span> bun db:generate
              </p>
              <p>
                <span className="text-neutral-800">$</span> bun dev
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-neutral-800/30 px-6 pb-8 pt-5">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            {stack.map((item, i) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="animate-fade-in text-[12px] text-neutral-700 transition-colors hover:text-white"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {item.name}
              </a>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-5 text-[11px] text-neutral-700">
            {flags.stripe && (
              <Link
                href="/pricing"
                className="transition-colors hover:text-white"
              >
                Pricing
              </Link>
            )}
            <Link href="/terms" className="transition-colors hover:text-white">
              Terms
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-white"
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
