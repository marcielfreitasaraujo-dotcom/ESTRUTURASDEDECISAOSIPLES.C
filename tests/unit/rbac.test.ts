import { describe, expect, it } from "vitest";
import { hasPermission, isPlatformAdmin } from "@/domain/rbac/roles";
import { PERMISSIONS } from "@/domain/rbac/permissions";

describe("RBAC", () => {
  it("OWNER gerencia o estabelecimento e CASHIER não altera o cardápio", () => {
    expect(hasPermission("OWNER", PERMISSIONS.SETTINGS_WRITE)).toBe(true);
    expect(hasPermission("CASHIER", PERMISSIONS.CATALOG_WRITE)).toBe(false);
    expect(hasPermission("KITCHEN", PERMISSIONS.KITCHEN_UPDATE)).toBe(true);
    expect(hasPermission("DELIVERY", PERMISSIONS.ORDER_CANCEL)).toBe(false);
  });

  it("não usa e-mail hardcoded: SUPER_ADMIN é um papel", () => {
    expect(isPlatformAdmin("SUPER_ADMIN")).toBe(true);
    expect(isPlatformAdmin("USER")).toBe(false);
  });
});
