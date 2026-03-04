import { describe, expect, test } from "bun:test";
import { hasPermission, hasRole, parseUserRoles } from "../lib/permissions";

describe("permissions helpers", () => {
  test("defaults unknown roles to user", () => {
    expect(parseUserRoles(undefined)).toEqual(["user"]);
    expect(parseUserRoles("")).toEqual(["user"]);
    expect(parseUserRoles("unknown")).toEqual(["user"]);
  });

  test("parses comma-separated roles and filters unknown values", () => {
    expect(parseUserRoles("manager,unknown,billing")).toEqual([
      "manager",
      "billing",
    ]);
  });

  test("hasRole supports multiple required roles", () => {
    expect(hasRole("user,manager", ["admin", "manager"])).toBe(true);
    expect(hasRole("support", ["admin", "billing"])).toBe(false);
  });

  test("hasPermission checks granular permissions by role", () => {
    expect(hasPermission("billing", "billing:manage")).toBe(true);
    expect(hasPermission("support", "billing:manage")).toBe(false);
    expect(hasPermission("admin", "user:set-role")).toBe(true);
  });
});
