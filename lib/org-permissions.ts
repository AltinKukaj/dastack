/**
 * Organization RBAC helpers.
 *
 * Defines the role hierarchy and provides simple permission checks.
 * This keeps role logic in one place instead of scattering string
 * comparisons throughout route components — per the REC blueprint.
 */

/**
 * Organization roles, ordered by privilege level (highest first).
 *
 * _Scaffolding_ — exported for template users to build custom
 * role-based UI or middleware. Not currently consumed by built-in code.
 */
export const ORG_ROLES = ["owner", "admin", "member"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

/**
 * Check if a role has at least the same privilege as the required role.
 *
 * Hierarchy: owner > admin > member
 *
 * _Scaffolding_ — exported for template users to build custom
 * role-based guards. Not currently consumed by built-in code.
 */
export function hasMinRole(userRole: string, requiredRole: OrgRole): boolean {
    const userIndex = ORG_ROLES.indexOf(userRole as OrgRole);
    const requiredIndex = ORG_ROLES.indexOf(requiredRole);

    // If the role is not recognized, deny
    if (userIndex === -1) return false;

    // Lower index = higher privilege
    return userIndex <= requiredIndex;
}

/**
 * Permission action types.
 */
export type OrgAction =
    | "org:update"
    | "org:delete"
    | "member:invite"
    | "member:remove"
    | "member:update-role"
    | "invitation:cancel"
    | "settings:view"
    | "settings:edit";

/**
 * Role → allowed actions mapping.
 */
const ROLE_PERMISSIONS: Record<OrgRole, Set<OrgAction>> = {
    owner: new Set([
        "org:update",
        "org:delete",
        "member:invite",
        "member:remove",
        "member:update-role",
        "invitation:cancel",
        "settings:view",
        "settings:edit",
    ]),
    admin: new Set([
        "org:update",
        "member:invite",
        "member:remove",
        "member:update-role",
        "invitation:cancel",
        "settings:view",
        "settings:edit",
    ]),
    member: new Set(["settings:view"]),
};

/**
 * Check if a role has a specific permission.
 */
export function canPerform(role: string, action: OrgAction): boolean {
    const perms = ROLE_PERMISSIONS[role as OrgRole];
    if (!perms) return false;
    return perms.has(action);
}
