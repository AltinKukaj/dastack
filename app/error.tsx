/** Client-side error boundary — catches runtime errors and provides a retry button. */
"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0a0a0a] px-6 font-sans text-white">
      <div className="animate-fade-in w-full max-w-md text-center">
        <p className="font-mono text-[11px] text-zinc-700">
          500
        </p>
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-white">
          Something went wrong
        </h1>
        <p className="mt-3 text-[13px] text-zinc-600">
          An unexpected error occurred. Please try again.
        </p>
        <div className="mt-8">
          <button
            type="button"
            onClick={reset}
            className="btn-outline text-[13px]"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
