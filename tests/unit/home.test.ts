import { describe, expect, it } from "vitest";
import { postLoginPath } from "@/domain/rbac/home";

describe("postLoginPath", () => {
  it("abre o app certo para cada papel", () => {
    expect(postLoginPath({ platformRole: "SUPER_ADMIN", tenantRole: null })).toBe("/admin");
    expect(postLoginPath({ platformRole: "USER", tenantRole: "CASHIER" })).toBe("/caixa");
    expect(postLoginPath({ platformRole: "USER", tenantRole: "WAITER" })).toBe("/garcom");
    expect(postLoginPath({ platformRole: "USER", tenantRole: "KITCHEN" })).toBe("/app/cozinha");
    expect(postLoginPath({ platformRole: "USER", tenantRole: "OWNER" })).toBe("/app");
  });
});
