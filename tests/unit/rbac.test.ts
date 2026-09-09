import { describe, expect, it } from "vitest";
import { canAssignTenantRole, canManageTenantMember, canSetPlatformRole, hasPermission, isPlatformAdmin } from "@/domain/rbac/roles";
import { PERMISSIONS } from "@/domain/rbac/permissions";

describe("RBAC", () => {
  it("OWNER gerencia o estabelecimento e CASHIER não altera o cardápio", () => {
    expect(hasPermission("OWNER", PERMISSIONS.SETTINGS_WRITE)).toBe(true);
    expect(hasPermission("CASHIER", PERMISSIONS.CATALOG_WRITE)).toBe(false);
    expect(hasPermission("WAITER", PERMISSIONS.ORDER_CREATE)).toBe(true);
    expect(hasPermission("WAITER", PERMISSIONS.ORDER_UPDATE)).toBe(false);
    expect(hasPermission("KITCHEN", PERMISSIONS.KITCHEN_UPDATE)).toBe(true);
    expect(hasPermission("STAFF", PERMISSIONS.ORDER_CREATE)).toBe(true);
    expect(hasPermission("STAFF", PERMISSIONS.FINANCE_READ)).toBe(false);
    expect(hasPermission("MANAGER", PERMISSIONS.TEAM_WRITE)).toBe(true);
    expect(hasPermission("MANAGER", PERMISSIONS.FINANCE_WRITE)).toBe(true);
  });

  it("dono gerencia funcionários e gerente não mexe em dono", () => {
    expect(canAssignTenantRole("OWNER", "CASHIER")).toBe(true);
    expect(canAssignTenantRole("OWNER", "OWNER")).toBe(true);
    expect(canManageTenantMember("OWNER", "CASHIER")).toBe(true);
    expect(canAssignTenantRole("MANAGER", "OWNER")).toBe(false);
    expect(canManageTenantMember("MANAGER", "OWNER")).toBe(false);
    expect(canManageTenantMember("MANAGER", "CASHIER")).toBe(true);
    expect(canSetPlatformRole("SUPER_ADMIN", "USER")).toBe(true);
    expect(canSetPlatformRole("PLATFORM_ADMIN", "SUPER_ADMIN")).toBe(false);
  });

  it("não usa e-mail hardcoded: SUPER_ADMIN é um papel", () => {
    expect(isPlatformAdmin("SUPER_ADMIN")).toBe(true);
    expect(isPlatformAdmin("USER")).toBe(false);
  });
});
