"use client";

import type { ReactNode } from "react";

export function Spinner({ dark }: { dark?: boolean }) {
  return (
    <span
      className={`size-4 animate-spin rounded-full border-2 ${dark ? "border-neutral-400 border-t-neutral-950" : "border-neutral-700 border-t-neutral-300"}`}
    />
  );
}

export function SocialButton({
  onClick,
  loading,
  icon,
  label,
}: {
  onClick: () => void;
  loading: boolean;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2.5 border border-neutral-800 rounded-lg px-4 py-2.5 text-[13px] text-neutral-400 transition hover:border-neutral-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? <Spinner /> : icon}
      {label}
    </button>
  );
}
