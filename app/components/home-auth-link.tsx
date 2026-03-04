"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface HomeAuthLinkProps {
  initialVisible: boolean;
}

export function HomeAuthLink({ initialVisible }: HomeAuthLinkProps) {
  const [visible, setVisible] = useState(initialVisible);

  useEffect(() => {
    fetch("/api/features", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setVisible(Boolean(data?.auth)))
      .catch(() => {
        // Keep initial server-rendered value on request failure.
      });
  }, []);

  if (!visible) return null;

  return (
    <Link
      href="/auth"
      className="rounded-lg border border-neutral-800 px-4 py-1.5 text-[13px] text-neutral-400 transition hover:border-neutral-700 hover:text-white"
    >
      Sign in
    </Link>
  );
}
