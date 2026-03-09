/** Admin page — server component that fetches stats, report, users, and audit data for the dashboard. */
import { createCaller } from "@/lib/trpc/server";
import { AdminDashboard } from "./admin-dashboard";

export default async function AdminPage() {
  const trpc = await createCaller();
  const [stats, report, usersResult, auditResult] = await Promise.all([
    trpc.admin.stats(),
    trpc.admin.report(),
    trpc.admin.users({ limit: 20 }),
    trpc.admin.auditEvents({ limit: 12 }),
  ]);

  return (
    <AdminDashboard
      stats={stats}
      report={report}
      initialUsers={usersResult.users}
      totalUsers={usersResult.total}
      initialAuditEvents={auditResult.events}
      auditTotal={auditResult.total}
    />
  );
}
