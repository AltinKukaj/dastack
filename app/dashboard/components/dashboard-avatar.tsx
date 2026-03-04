"use client";

import Image from "next/image";

interface DashboardAvatarProps {
  image?: string | null;
  name?: string | null;
  email?: string | null;
  size?: "sm" | "lg";
}

export function DashboardAvatar({
  image,
  name,
  email,
  size = "sm",
}: DashboardAvatarProps) {
  const dimension = size === "lg" ? 48 : 28;

  if (image) {
    return (
      <Image
        src={image}
        alt={name ?? "Avatar"}
        width={dimension}
        height={dimension}
        className="rounded border border-neutral-800 object-cover"
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded border border-neutral-800 font-[family-name:var(--font-geist-mono)] text-neutral-500 ${
        size === "lg" ? "size-12 text-sm" : "size-7 text-[10px]"
      }`}
    >
      {(name?.[0] ?? email?.[0] ?? "?").toUpperCase()}
    </div>
  );
}
