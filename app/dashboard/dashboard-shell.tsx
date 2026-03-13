/** Dashboard shell — sidebar, top bar, mobile drawer, org switcher, and user dropdown. */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { APP_NAME } from "@/lib/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Settings,
  CreditCard,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
  Building2,
  FolderOpen,
} from "lucide-react";
import { OrgSwitcher } from "@/components/org-switcher";
import { useState, useEffect, useCallback } from "react";

interface Props {
  userName: string;
  userEmail: string;
  emailVerified: boolean;
  userImage?: string;
  paymentsEnabled?: boolean;
  organizationsEnabled?: boolean;
  uploadsEnabled?: boolean;
  children: React.ReactNode;
}

function getNavItems(paymentsEnabled: boolean, organizationsEnabled: boolean, uploadsEnabled: boolean) {
  const items = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];
  if (organizationsEnabled) {
    items.push({ href: "/dashboard/organization", label: "Organization", icon: Building2 });
  }
  if (uploadsEnabled) {
    items.push({ href: "/dashboard/files", label: "Files", icon: FolderOpen });
  }
  if (paymentsEnabled) {
    items.push({ href: "/dashboard/billing", label: "Billing", icon: CreditCard });
  }
  return items;
}

function ProfileAvatar({ src, name, size = 32 }: { src?: string; name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover border border-white/[0.06]"
        style={{ width: size, height: size }}
        referrerPolicy="no-referrer"
        onError={(e) => {
          // If the image fails to load, hide it and show the fallback
          const target = e.currentTarget;
          const parent = target.parentElement;
          target.style.display = "none";
          if (parent) {
            const fallback = parent.querySelector("[data-fallback]") as HTMLElement | null;
            if (fallback) fallback.style.display = "flex";
          }
        }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

export function DashboardShell({
  userName,
  userEmail,
  emailVerified,
  userImage,
  paymentsEnabled = true,
  organizationsEnabled = false,
  uploadsEnabled = false,
  children,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mobileOpen]);

  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    router.push("/");
  }, [router]);

  const navItems = getNavItems(paymentsEnabled, organizationsEnabled, uploadsEnabled);

  // Get readable page title from pathname
  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Overview";
    if (pathname.startsWith("/dashboard/billing")) return "Billing";
    if (pathname.startsWith("/dashboard/files")) return "Files";
    if (pathname.startsWith("/dashboard/organization")) return "Organization";
    if (pathname === "/dashboard/settings") return "Profile";
    if (pathname.includes("/settings/security")) return "Security";
    if (pathname.includes("/settings/passkeys")) return "Passkeys";
    if (pathname.includes("/settings/sessions")) return "Sessions";
    if (pathname.includes("/settings/danger")) return "Danger Zone";
    return "Dashboard";
  };

  const renderNav = (isMobile: boolean) => (
    <nav className="flex-1 px-1.5 py-2.5 space-y-px">
      {navItems.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={isMobile ? () => setMobileOpen(false) : undefined}
            className={`group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors duration-150 ${active
              ? "bg-white/[0.07] text-white"
              : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
              }`}
            title={collapsed && !isMobile ? item.label : undefined}
          >
            <Icon
              className={`size-[15px] shrink-0 transition-colors duration-150 ${active ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
                }`}
            />
            {(!collapsed || isMobile) && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  const renderUserMenu = (isMobile: boolean) => (
    <div className="border-t border-white/[0.06] p-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-white/[0.04] outline-none ${collapsed && !isMobile ? "justify-center" : ""
              }`}
          >
            <ProfileAvatar src={userImage} name={userName} size={22} />
            {(!collapsed || isMobile) && (
              <div className="flex-1 text-left min-w-0">
                <p className="text-[12px] text-white truncate">{userName}</p>
                <p className="text-[10px] text-zinc-600 truncate">{userEmail}</p>
              </div>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-56">
          <div className="px-2 py-2">
            <p className="text-sm text-white">{userName}</p>
            <p className="text-[12px] text-zinc-500 font-mono truncate">{userEmail}</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <div
                className={`size-1.5 rounded-full ${emailVerified ? "bg-zinc-400" : "bg-zinc-600"
                  }`}
              />
              <span className="text-[11px] text-zinc-500">
                {emailVerified ? "Verified" : "Unverified"}
              </span>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={handleSignOut}
            className="text-zinc-400 focus:text-white cursor-pointer"
          >
            <LogOut className="size-3.5 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-[#09090b] text-zinc-100 font-sans">
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-white/[0.06] bg-[#09090b] transition-[width] duration-200 ease-out ${collapsed ? "w-[56px]" : "w-[200px]"
          }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 h-[44px] shrink-0">
          <div className="flex size-5.5 items-center justify-center rounded bg-white text-black">
            <span className="text-[10px] font-bold tracking-tight">D</span>
          </div>
          {!collapsed && (
            <span className="text-[12px] font-semibold tracking-tight text-white">
              {APP_NAME}
            </span>
          )}
        </div>

        {organizationsEnabled && (
          <div className="border-b border-white/[0.06]">
            <OrgSwitcher collapsed={collapsed} />
          </div>
        )}

        {renderNav(false)}

        {/* Collapse toggle */}
        <div className="px-1.5 pb-1">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors duration-150"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="size-3.5" />
            ) : (
              <>
                <PanelLeftClose className="size-3.5" />
                <span className="text-[10px]">Collapse</span>
              </>
            )}
          </button>
        </div>

        {renderUserMenu(false)}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col bg-[#09090b] border-r border-white/[0.06] transition-transform duration-200 ease-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-3 h-[44px] shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex size-5.5 items-center justify-center rounded bg-white text-black">
              <span className="text-[10px] font-bold tracking-tight">D</span>
            </div>
            <span className="text-[12px] font-semibold text-white">{APP_NAME}</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Close menu"
          >
            <X className="size-3.5" />
          </button>
        </div>
        {organizationsEnabled && (
          <div className="border-b border-white/[0.06]">
            <OrgSwitcher />
          </div>
        )}
        {renderNav(true)}
        {renderUserMenu(true)}
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Topbar */}
        <header className="flex items-center justify-between border-b border-white/[0.06] bg-[#09090b] px-4 sm:px-5 h-[44px] shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label="Open menu"
            >
              <Menu className="size-3.5" />
            </button>
            <span className="text-[12px] font-medium text-zinc-400 hidden md:inline">
              {getPageTitle()}
            </span>
            {/* Mobile logo */}
            <div className="md:hidden flex items-center gap-2">
              <div className="flex size-5.5 items-center justify-center rounded bg-white text-black">
                <span className="text-[10px] font-bold tracking-tight">D</span>
              </div>
              <span className="text-[12px] font-semibold text-white">{APP_NAME}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className={`size-1.5 rounded-full ${emailVerified ? "bg-zinc-400" : "bg-zinc-600"}`}
            />
            <span className="text-[10px] text-zinc-600 hidden sm:inline">
              {emailVerified ? "Verified" : "Unverified"}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1040px] px-4 py-4 sm:px-5 sm:py-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
