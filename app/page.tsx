/** Landing page — single-screen hero with specs and navigation. */
import Link from "next/link";
import { APP_NAME } from "@/lib/config";

const specs = [
  {
    label: "Auth",
    value: "Ready",
    detail: "Sessions, providers, passkeys, 2FA",
  },
  {
    label: "Payments",
    value: "Optional",
    detail: "Stripe auto-configured",
  },
  {
    label: "Database",
    value: "Prisma",
    detail: "PostgreSQL, typed schema, migrations",
  },
  {
    label: "Stack",
    value: "Lean",
    detail: "Ship fast, cut back without rewrites",
  },
];

const commands = ["pnpm install", "pnpm dlx prisma generate", "pnpm dev"];

const stack = [
  { label: "Next.js", href: "https://nextjs.org" },
  { label: "Better Auth", href: "https://better-auth.com" },
  { label: "Prisma", href: "https://prisma.io" },
  { label: "Stripe", href: "https://stripe.com" },
  { label: "Tailwind", href: "https://tailwindcss.com" },
  { label: "shadcn/ui", href: "https://ui.shadcn.com" },
];

export default function Home() {
  return (
    <div className="h-dvh w-full bg-[#0a0a0a] text-white font-sans overflow-hidden flex flex-col">
      {/* Nav */}
      <header className="animate-fade-in flex items-center justify-between px-5 py-4 sm:px-8 lg:px-12 shrink-0">
        <span className="text-[13px] font-semibold tracking-tight select-none">
          {APP_NAME}
        </span>
        <nav className="flex items-center gap-6">
          <Link
            href="/terms"
            className="text-[11px] font-mono text-zinc-700 hover:text-zinc-400 transition-colors duration-150 hidden sm:inline"
          >
            Terms
          </Link>
          <Link
            href="/pricing"
            className="text-[11px] font-mono text-zinc-600 hover:text-white transition-colors duration-150 hidden sm:inline"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-[11px] font-mono text-zinc-500 hover:text-white transition-colors duration-150"
          >
            Sign in
          </Link>
        </nav>
      </header>

      {/* Main content — fills remaining viewport */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        {/* Left: headline */}
        <div className="flex flex-col justify-center flex-1 px-5 sm:px-8 lg:px-12 py-6 lg:py-0">
          <div className="max-w-lg">
            <p className="animate-fade-in text-[11px] text-zinc-600">
              Open source starter stack
            </p>

            <h1 className="animate-fade-in mt-5 text-[clamp(2.5rem,8vw,5rem)] font-semibold leading-[0.9] tracking-[-0.04em] text-white">
              Ship
              <br />
              in minutes.
            </h1>

            <p className="animate-fade-in mt-6 text-[13px] text-zinc-500 max-w-xs leading-relaxed">
              Auth, payments, database. Everything you need to launch,
              nothing you need to rip out.
            </p>

            <div className="animate-fade-in mt-8 flex flex-wrap gap-3">
              <Link href="/login?tab=sign-up" className="btn-primary text-[13px]">
                Get started
              </Link>
              <Link href="/pricing" className="btn-outline text-[13px]">
                View plans
              </Link>
            </div>
          </div>
        </div>

        {/* Right: specs + terminal */}
        <div className="flex flex-col justify-center flex-1 px-5 pb-6 sm:px-8 lg:px-0 lg:pr-12 lg:pb-0">
          <div className="max-w-md lg:ml-auto">
            {/* Specs */}
            <div className="space-y-0">
              {specs.map((spec) => (
                <div
                  key={spec.label}
                  className="animate-fade-in flex items-baseline justify-between border-b border-white/[0.06] py-3"
                >
                  <div>
                    <span className="font-mono text-[12px] text-zinc-400">
                      {spec.label}
                    </span>
                    <p className="mt-0.5 text-[10px] text-zinc-700 leading-snug">
                      {spec.detail}
                    </p>
                  </div>
                  <span className="font-mono text-[12px] text-white">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Terminal */}
            <div className="animate-fade-in mt-4 rounded-md border border-white/[0.06] bg-white/[0.02] p-3.5">
              <div className="flex gap-1.5 mb-2.5">
                <span className="size-1.5 rounded-full bg-zinc-700" />
                <span className="size-1.5 rounded-full bg-zinc-700" />
                <span className="size-1.5 rounded-full bg-zinc-700" />
              </div>
              {commands.map((cmd) => (
                <p
                  key={cmd}
                  className="font-mono text-[11px] text-zinc-500 leading-relaxed"
                >
                  <span className="text-zinc-600">$</span> {cmd}
                </p>
              ))}
            </div>

            {/* Stack links */}
            <div className="animate-fade-in mt-4 flex flex-wrap gap-1.5">
              {stack.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-white/[0.06] px-2.5 py-0.5 rounded-md text-[10px] font-mono text-zinc-600 transition-colors duration-150 hover:border-white/[0.12] hover:text-zinc-300"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <footer className="animate-fade-in shrink-0 flex items-center justify-between px-5 sm:px-8 lg:px-12 py-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-5">
          <Link
            href="/login?tab=sign-up"
            className="text-[11px] text-zinc-600 hover:text-zinc-300 transition-colors duration-150"
          >
            Get started
          </Link>
          <Link
            href="/terms"
            className="text-[11px] text-zinc-700 hover:text-zinc-400 transition-colors duration-150 hidden sm:inline"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="text-[11px] text-zinc-700 hover:text-zinc-400 transition-colors duration-150 hidden sm:inline"
          >
            Privacy
          </Link>
        </div>
        <span className="text-[10px] font-mono text-zinc-800">v0.1.0</span>
      </footer>
    </div>
  );
}
