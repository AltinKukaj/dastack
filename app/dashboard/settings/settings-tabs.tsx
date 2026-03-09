/** Settings tab bar — icon-mapped navigation links with active-state styling. */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  FolderOpen,
  Fingerprint,
  LaptopMinimal,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export type SettingsTab = {
  href: string;
  icon: "danger" | "files" | "passkeys" | "profile" | "security" | "sessions";
  label: string;
};

const ICONS = {
  danger: AlertTriangle,
  files: FolderOpen,
  passkeys: Fingerprint,
  profile: UserRound,
  security: ShieldCheck,
  sessions: LaptopMinimal,
} as const;

export function SettingsTabs({ tabs }: { tabs: SettingsTab[] }) {
  const pathname = usePathname();

  return (
    <div className="tab-bar overflow-x-auto scrollbar-none">
      {tabs.map((tab) => {
        const active = tab.href === "/dashboard/settings"
          ? pathname === "/dashboard/settings"
          : pathname.startsWith(tab.href);
        const Icon = ICONS[tab.icon];
        const isDanger = tab.href.includes("danger");

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`tab-item shrink-0 ${active
              ? isDanger
                ? "border-zinc-400 text-zinc-300"
                : "tab-active"
              : "tab-inactive"
              }`}
          >
            <Icon className="size-3.5" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
