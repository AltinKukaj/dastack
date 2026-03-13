/** 404 Not Found page */
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0a0a0a] px-5 font-sans text-white">
      <div className="animate-fade-in w-full max-w-sm text-center">
        <p className="font-mono text-[11px] text-zinc-700">
          404
        </p>
        <h1 className="mt-4 text-lg font-semibold tracking-tight text-white">
          Page not found
        </h1>
        <p className="mt-2.5 text-[12px] leading-relaxed text-zinc-600">
          The page you requested does not exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="btn-outline text-[12px]"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
