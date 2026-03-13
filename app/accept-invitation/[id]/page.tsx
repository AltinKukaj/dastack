import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isOrganizationsEnabled } from "@/lib/features";

/**
 * Accept an organization invitation.
 *
 * The invitation link contains the invitation ID in the URL.
 * When a user visits this page, we attempt to accept the invitation
 * via Better Auth's API and then redirect to the dashboard.
 */
export default async function AcceptInvitationPage(
    props: { params: Promise<{ id: string }> },
) {
    if (!isOrganizationsEnabled()) {
        redirect("/dashboard");
    }

    await requireAuth();
    const { id } = await props.params;
    const acceptInvitation = (
        auth.api as {
            acceptInvitation?: (input: {
                body: { invitationId: string };
                headers: Headers;
            }) => Promise<unknown>;
        }
    ).acceptInvitation;

    if (!acceptInvitation) {
        redirect("/dashboard");
    }

    try {
        await acceptInvitation({
            body: { invitationId: id },
            headers: await headers(),
        });
    } catch (error) {
        console.error("[org] Failed to accept invitation:", error);
        // Redirect to dashboard even on failure — the user will see
        // the appropriate state in the org UI
    }

    redirect("/dashboard");
}
