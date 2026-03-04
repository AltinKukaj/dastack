import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-6 font-[family-name:var(--font-geist-sans)] text-white">
      <div className="animate-slide-up w-full max-w-md text-center">
        <p className="font-[family-name:var(--font-geist-mono)] text-[11px] tracking-[0.2em] text-neutral-700">
          404
        </p>
        <h1 className="mt-5 font-[family-name:var(--font-geist-mono)] text-3xl tracking-tight text-white">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-7 text-neutral-600">
          The page you requested does not exist or has been moved.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex rounded-lg border border-neutral-800 px-5 py-2.5 text-sm text-neutral-400 transition hover:border-neutral-700 hover:text-white"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
