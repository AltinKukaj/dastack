/** Dashboard overview — server component that fetches auth stats and recent sessions via tRPC. */
import { requireAuth } from "@/lib/auth-server";
import { isPaymentsEnabled } from "@/lib/features";
import { createCaller } from "@/lib/trpc/server";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardOverview() {
  const session = await requireAuth();
  const user = session.user as {
    id: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: boolean;
    twoFactorEnabled?: boolean | null;
    image?: string | null;
    createdAt?: string | Date;
  };

  const firstName = (user.name ?? "").split(" ")[0] || "there";

  // Use the server-side tRPC caller for typed data access
  const trpc = await createCaller();

  const [stats, recentSessions] = await Promise.all([
    trpc.auth.stats(),
    trpc.auth.recentSessions(),
  ]);

  return (
    <DashboardClient
      firstName={firstName}
      user={{
        name: user.name ?? "User",
        email: user.email ?? "",
        emailVerified: user.emailVerified ?? false,
        twoFactorEnabled: user.twoFactorEnabled ?? false,
        image: user.image ?? undefined,
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
      }}
      stats={stats}
      recentSessions={recentSessions}
      paymentsEnabled={isPaymentsEnabled()}
    />
  );
}
