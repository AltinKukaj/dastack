import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "@/server/api/trpc";
import {
    getUserOrganizations,
    getOrgMembers,
    getOrgInvitations,
    getUserOrgRole,
} from "@/server/modules/organizations/org.service";
import { canPerform } from "@/lib/org-permissions";
import { invalidateOrganizationCaches } from "@/server/modules/cache/cache-invalidation.service";

/**
 * Resolve the caller's role in an organization, throwing if not a member.
 */
async function requireMembership(
    db: Parameters<typeof getUserOrgRole>[0],
    userId: string,
    organizationId: string,
) {
    const role = await getUserOrgRole(db, userId, organizationId);
    if (!role) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not a member of this organization",
        });
    }
    return role;
}

const orgInput = z.object({ organizationId: z.string() });

/**
 * Organizations router — server-side read helpers for org data.
 *
 * Write operations (create org, invite, accept, etc.) go through
 * Better Auth's organization plugin API directly from the client.
 * This router exposes rich read queries that the plugin doesn't
 * provide out of the box.
 */
export const organizationsRouter = router({
    /**
     * List all organizations the current user is a member of.
     */
    list: protectedProcedure.query(async ({ ctx }) => {
        return getUserOrganizations(ctx.db, ctx.session.user.id);
    }),

    /**
     * Get members of a specific organization.
     * Requires membership (settings:view).
     */
    members: protectedProcedure
        .input(orgInput)
        .query(async ({ ctx, input }) => {
            const role = await requireMembership(ctx.db, ctx.session.user.id, input.organizationId);
            if (!canPerform(role, "settings:view")) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Missing permission: settings:view" });
            }
            return getOrgMembers(ctx.db, input.organizationId);
        }),

    /**
     * Get pending invitations for an organization.
     * Requires admin or owner (member:invite).
     */
    invitations: protectedProcedure
        .input(orgInput)
        .query(async ({ ctx, input }) => {
            const role = await requireMembership(ctx.db, ctx.session.user.id, input.organizationId);
            if (!canPerform(role, "member:invite")) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Missing permission: member:invite" });
            }
            return getOrgInvitations(ctx.db, input.organizationId);
        }),

    /**
     * Get the current user's role in a specific organization.
     */
    myRole: protectedProcedure
        .input(orgInput)
        .query(async ({ ctx, input }) => {
            return getUserOrgRole(ctx.db, ctx.session.user.id, input.organizationId);
        }),

    invalidateCache: protectedProcedure
        .input(orgInput)
        .mutation(async ({ ctx, input }) => {
            await requireMembership(ctx.db, ctx.session.user.id, input.organizationId);
            await invalidateOrganizationCaches(input.organizationId, {
                membership: true,
                entitlements: false,
            });
            return { success: true };
        }),
});
