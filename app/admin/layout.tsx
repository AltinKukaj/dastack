import { requireAdmin } from "@/lib/auth-server";
import { isAdminPanelEnabled } from "@/lib/features";
import { APP_NAME } from "@/lib/config";
/** Admin layout — feature-gated and admin-role-gated wrapper with a standalone admin header. */
import { notFound } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isAdminPanelEnabled()) {
    notFound();
  }

  await requireAdmin();

  return (
    <div className="min-h-dvh bg-[#09090b] text-zinc-100 font-sans">
      <header className="border-b border-white/[0.06] px-6 h-[48px] flex items-center gap-3">
        <div className="flex size-6 items-center justify-center rounded-md bg-white/[0.06] text-white">
          <span className="text-[11px] font-bold">A</span>
        </div>
        <span className="text-[13px] font-semibold text-white">
          {APP_NAME} Admin
        </span>
        <span className="text-[11px] text-zinc-600 ml-auto">
          Admin Panel
        </span>
      </header>
      <main className="mx-auto max-w-[1200px] px-6 py-6">{children}</main>
    </div>
  );
}
