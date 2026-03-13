/** Organization page — feature-gated server component that fetches org list and renders the org dashboard. */
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-server";
import { isOrganizationsEnabled } from "@/lib/features";
import { createCaller } from "@/lib/trpc/server";
import { OrgDashboard } from "./org-dashboard";

export default async function OrganizationPage() {
    if (!isOrganizationsEnabled()) {
        redirect("/dashboard");
    }

    const session = await requireAuth();
    const trpc = await createCaller();

    const organizations = await trpc.organizations.list();

    return (
        <OrgDashboard
            organizations={organizations}
            userId={session.user.id}
        />
    );
}
