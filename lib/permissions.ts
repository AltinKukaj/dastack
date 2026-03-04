import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

export const statements = {
  ...defaultStatements,
  dashboard: ["view"],
  billing: ["read", "manage"],
  settings: ["read", "manage"],
  project: ["create", "read", "update", "delete"],
} as const;

export const ac = createAccessControl(statements);

const userRole = ac.newRole({
  dashboard: ["view"],
  billing: ["read", "manage"],
  settings: ["read", "manage"],
  project: ["create", "read", "update"],
});

const managerRole = ac.newRole({
  dashboard: ["view"],
  billing: ["read", "manage"],
  settings: ["read", "manage"],
  project: ["create", "read", "update", "delete"],
  user: ["list"],
});

const supportRole = ac.newRole({
  dashboard: ["view"],
  billing: ["read"],
  settings: ["read"],
  user: ["list", "ban"],
});

const billingRole = ac.newRole({
  dashboard: ["view"],
  billing: ["read", "manage"],
  settings: ["read"],
});

const adminRole = ac.newRole({
  ...adminAc.statements,
  dashboard: ["view"],
  billing: ["read", "manage"],
  settings: ["read", "manage"],
  project: ["create", "read", "update", "delete"],
});

const ownerRole = ac.newRole({
  ...adminAc.statements,
  user: ["impersonate-admins", ...adminAc.statements.user],
  dashboard: ["view"],
  billing: ["read", "manage"],
  settings: ["read", "manage"],
  project: ["create", "read", "update", "delete"],
});

/**
 * Shared role definitions for Better Auth server + client admin plugins.
 */
export const roleDefinitions = {
  user: userRole,
  manager: managerRole,
  support: supportRole,
  billing: billingRole,
  admin: adminRole,
  owner: ownerRole,
} as const;

export type AppRole = keyof typeof roleDefinitions;

export const APP_ROLES: AppRole[] = [
  "user",
  "manager",
  "support",
  "billing",
  "admin",
  "owner",
];

export type AppPermission =
  | "dashboard:view"
  | "billing:read"
  | "billing:manage"
  | "settings:read"
  | "settings:manage"
  | "project:create"
  | "project:read"
  | "project:update"
  | "project:delete"
  | "user:list"
  | "user:ban"
  | "user:set-role";

const rolePermissions: Record<AppRole, readonly AppPermission[]> = {
  user: [
    "dashboard:view",
    "billing:read",
    "billing:manage",
    "settings:read",
    "settings:manage",
    "project:create",
    "project:read",
    "project:update",
  ],
  manager: [
    "dashboard:view",
    "billing:read",
    "billing:manage",
    "settings:read",
    "settings:manage",
    "project:create",
    "project:read",
    "project:update",
    "project:delete",
    "user:list",
  ],
  support: [
    "dashboard:view",
    "billing:read",
    "settings:read",
    "user:list",
    "user:ban",
  ],
  billing: [
    "dashboard:view",
    "billing:read",
    "billing:manage",
    "settings:read",
  ],
  admin: [
    "dashboard:view",
    "billing:read",
    "billing:manage",
    "settings:read",
    "settings:manage",
    "project:create",
    "project:read",
    "project:update",
    "project:delete",
    "user:list",
    "user:ban",
    "user:set-role",
  ],
  owner: [
    "dashboard:view",
    "billing:read",
    "billing:manage",
    "settings:read",
    "settings:manage",
    "project:create",
    "project:read",
    "project:update",
    "project:delete",
    "user:list",
    "user:ban",
    "user:set-role",
  ],
};

const roleSet = new Set<AppRole>(APP_ROLES);

function normalizeRole(rawRole: string): AppRole | null {
  const role = rawRole.trim() as AppRole;
  if (!roleSet.has(role)) return null;
  return role;
}

export function parseUserRoles(roleValue: unknown): AppRole[] {
  if (Array.isArray(roleValue)) {
    const parsed = roleValue
      .filter((v): v is string => typeof v === "string")
      .map(normalizeRole)
      .filter((v): v is AppRole => !!v);
    return parsed.length > 0 ? parsed : ["user"];
  }

  if (typeof roleValue !== "string") return ["user"];

  const parsed = roleValue
    .split(",")
    .map(normalizeRole)
    .filter((v): v is AppRole => !!v);

  return parsed.length > 0 ? parsed : ["user"];
}

export function hasRole(
  roleValue: unknown,
  required: AppRole | AppRole[],
): boolean {
  const assigned = parseUserRoles(roleValue);
  const requiredRoles = Array.isArray(required) ? required : [required];
  return requiredRoles.some((role) => assigned.includes(role));
}

export function hasPermission(
  roleValue: unknown,
  permission: AppPermission,
): boolean {
  const assigned = parseUserRoles(roleValue);
  return assigned.some((role) => rolePermissions[role].includes(permission));
}
