/** Dashboard layout — auth-gated wrapper that passes session data and feature flags to the shell. */
import { requireAuth } from "@/lib/auth-server";
import { isPaymentsEnabled, isOrganizationsEnabled, isUploadsEnabled } from "@/lib/features";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <DashboardShell
      userName={session.user.name ?? "User"}
      userEmail={session.user.email}
      emailVerified={session.user.emailVerified}
      userImage={session.user.image ?? undefined}
      paymentsEnabled={isPaymentsEnabled()}
      organizationsEnabled={isOrganizationsEnabled()}
      uploadsEnabled={isUploadsEnabled()}
    >
      {children}
    </DashboardShell>
  );
}
