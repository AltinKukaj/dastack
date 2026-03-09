import Link from "next/link";

type LegalPlaceholderPageProps = {
  title: string;
  summary: string;
  items: string[];
};

export function LegalPlaceholderPage({
  title,
  summary,
  items,
}: LegalPlaceholderPageProps) {
  return (
    <div className="min-h-dvh bg-[#0a0a0a] px-5 py-12 font-sans text-zinc-100 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="text-[11px] text-zinc-600 transition-colors duration-200 hover:text-zinc-300 font-mono"
        >
          Home
        </Link>
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-white">
          {title}
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-zinc-400">{summary}</p>

        <div className="mt-6 rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[12px] text-zinc-400">
          This page is a starter-template placeholder. Replace it with product-specific legal copy before launch.
        </div>

        <div className="mt-8 space-y-3">
          {items.map((item) => (
            <section
              key={item}
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3.5"
            >
              <p className="text-[13px] leading-7 text-zinc-400">{item}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
