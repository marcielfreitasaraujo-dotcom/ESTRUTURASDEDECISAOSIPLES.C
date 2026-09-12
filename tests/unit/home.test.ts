import { describe, expect, it } from "vitest";
import { postLoginPath, storeStaffHomeHref } from "@/domain/rbac/home";

describe("postLoginPath", () => {
  it("abre o app certo para cada papel", () => {
    expect(postLoginPath({ platformRole: "SUPER_ADMIN", tenantRole: null })).toBe("/admin");
    expect(postLoginPath({ platformRole: "USER", tenantRole: "CASHIER" })).toBe("/caixa");
    expect(postLoginPath({ platformRole: "USER", tenantRole: "WAITER" })).toBe("/garcom");
    expect(postLoginPath({ platformRole: "USER", tenantRole: "KITCHEN" })).toBe("/app/cozinha");
    expect(postLoginPath({ platformRole: "USER", tenantRole: "DELIVERY" })).toBe("/entrega");
    expect(postLoginPath({ platformRole: "USER", tenantRole: "STAFF" })).toBe("/garcom");
    expect(postLoginPath({ platformRole: "USER", tenantRole: "OWNER" })).toBe("/app");
  });

  it("só gerente e admin voltam do cardápio para o sistema", () => {
    expect(storeStaffHomeHref({ platformRole: null, tenantRole: null })).toBeNull();
    expect(storeStaffHomeHref({ platformRole: "USER", tenantRole: "CASHIER" })).toBeNull();
    expect(storeStaffHomeHref({ platformRole: "USER", tenantRole: "OWNER" })).toBe("/app");
    expect(storeStaffHomeHref({ platformRole: "USER", tenantRole: "MANAGER" })).toBe("/app");
    expect(storeStaffHomeHref({ platformRole: "SUPER_ADMIN", tenantRole: null })).toBe("/admin");
  });
});
