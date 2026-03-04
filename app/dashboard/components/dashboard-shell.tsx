"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardAvatar } from "./dashboard-avatar";

const navItems = [
  { label: "Overview", href: "/dashboard" },
  { label: "Billing", href: "/dashboard/billing" },
  { label: "Settings", href: "/dashboard/settings" },
];

interface DashboardShellProps {
  sectionLabel: string;
  stripeEnabled: boolean;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  headerActions?: ReactNode;
  children: ReactNode;
}

export function DashboardShell({
  sectionLabel,
  stripeEnabled,
  user,
  headerActions,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const displayName = user.name ?? "User";

  return (
    <div className="flex min-h-screen bg-[#09090b] font-[family-name:var(--font-geist-sans)] text-white">
      <aside className="hidden w-48 shrink-0 border-r border-neutral-800/40 lg:flex lg:flex-col">
        <div className="px-5 py-5">
          <Link
            href="/"
            className="font-[family-name:var(--font-geist-mono)] text-[13px] tracking-tight text-white"
          >
            dastack
          </Link>
        </div>

        <nav className="flex-1 px-2 py-2">
          <ul className="space-y-0.5">
            {navItems
              .filter(
                (item) => item.href !== "/dashboard/billing" || stripeEnabled,
              )
              .map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block py-2 text-[13px] transition-colors ${
                        active
                          ? "border-l-2 border-white pl-[14px] font-medium text-white"
                          : "pl-4 text-neutral-600 hover:text-neutral-300"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </nav>

        <div className="border-t border-neutral-800/40 p-3">
          <div className="flex items-center gap-2.5 px-2 py-1">
            <DashboardAvatar
              image={user.image}
              name={user.name}
              email={user.email}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">
                {displayName}
              </p>
              <p className="truncate text-[10px] text-neutral-700">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="border-b border-neutral-800/40">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <Link
                href="/"
                className="font-[family-name:var(--font-geist-mono)] text-[13px] lg:hidden"
              >
                dastack
              </Link>
              <span className="hidden text-[13px] text-neutral-600 lg:block">
                {sectionLabel}
              </span>
            </div>
            {headerActions ? (
              <div className="flex items-center gap-3">{headerActions}</div>
            ) : null}
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
