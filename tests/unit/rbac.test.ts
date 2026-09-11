import { describe, expect, it } from "vitest";
import { canAssignTenantRole, canManageTenantMember, canSetPlatformRole, hasPermission, isPlatformAdmin } from "@/domain/rbac/roles";
import { PERMISSIONS } from "@/domain/rbac/permissions";

describe("RBAC", () => {
  it("gerente gerencia a loja e o caixa não altera cardápio nem equipe", () => {
    expect(hasPermission("OWNER", PERMISSIONS.SETTINGS_WRITE)).toBe(true);
    expect(hasPermission("MANAGER", PERMISSIONS.TEAM_WRITE)).toBe(true);
    expect(hasPermission("MANAGER", PERMISSIONS.CATALOG_WRITE)).toBe(true);
    expect(hasPermission("MANAGER", PERMISSIONS.FINANCE_WRITE)).toBe(true);
    expect(hasPermission("CASHIER", PERMISSIONS.CATALOG_WRITE)).toBe(false);
    expect(hasPermission("CASHIER", PERMISSIONS.TEAM_WRITE)).toBe(false);
    expect(hasPermission("CASHIER", PERMISSIONS.FINANCE_WRITE)).toBe(false);
    expect(hasPermission("CASHIER", PERMISSIONS.FINANCE_READ)).toBe(false);
    expect(hasPermission("CASHIER", PERMISSIONS.TEAM_READ)).toBe(false);
    expect(hasPermission("CASHIER", PERMISSIONS.ORDER_CREATE)).toBe(true);
    expect(hasPermission("WAITER", PERMISSIONS.ORDER_CREATE)).toBe(true);
    expect(hasPermission("WAITER", PERMISSIONS.ORDER_UPDATE)).toBe(false);
    expect(hasPermission("DELIVERY", PERMISSIONS.DELIVERY_UPDATE)).toBe(true);
  });

  it("proprietário e gerente têm o mesmo acesso da loja, sem criar admin", () => {
    expect(hasPermission("OWNER", PERMISSIONS.FINANCE_WRITE)).toBe(true);
    expect(hasPermission("MANAGER", PERMISSIONS.FINANCE_WRITE)).toBe(true);
    expect(canAssignTenantRole("OWNER", "CASHIER")).toBe(true);
    expect(canAssignTenantRole("OWNER", "MANAGER")).toBe(true);
    expect(canAssignTenantRole("MANAGER", "CASHIER")).toBe(true);
    expect(canAssignTenantRole("OWNER", "OWNER")).toBe(false);
    expect(canManageTenantMember("OWNER", "CASHIER")).toBe(true);
    expect(canManageTenantMember("OWNER", "OWNER")).toBe(false);
    expect(canAssignTenantRole("MANAGER", "OWNER")).toBe(false);
    expect(canManageTenantMember("MANAGER", "OWNER")).toBe(false);
    expect(canManageTenantMember("MANAGER", "CASHIER")).toBe(true);
    expect(canManageTenantMember("OWNER", "OWNER", "SUPER_ADMIN")).toBe(true);
    expect(canAssignTenantRole("OWNER", "CASHIER", "SUPER_ADMIN")).toBe(true);
    expect(canSetPlatformRole("SUPER_ADMIN", "USER")).toBe(true);
    expect(canSetPlatformRole("PLATFORM_ADMIN", "SUPER_ADMIN")).toBe(false);
    expect(isPlatformAdmin("SUPER_ADMIN")).toBe(true);
    expect(isPlatformAdmin("USER")).toBe(false);
  });

  it("não usa e-mail hardcoded: SUPER_ADMIN é um papel", () => {
    expect(isPlatformAdmin("SUPER_ADMIN")).toBe(true);
    expect(isPlatformAdmin("USER")).toBe(false);
  });
});
