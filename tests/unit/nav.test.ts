import { describe, expect, it } from "vitest";
import { navForUser } from "@/domain/rbac/nav";

function hrefs(role: Parameters<typeof navForUser>[0]["tenantRole"]) {
  return navForUser({ platformRole: "USER", tenantRole: role, surface: "app" }).map((item) => item.href);
}

describe("navForUser", () => {
  it("mostra gestão completa para o gerente", () => {
    for (const role of ["OWNER", "MANAGER"] as const) {
      const links = hrefs(role);
      expect(links).toContain("/app/financeiro");
      expect(links).toContain("/app/equipe");
      expect(links).toContain("/app/configuracoes");
      expect(links).toContain("/app/salao");
      expect(links).toContain("/app/relatorios");
      expect(links).toContain("/app/auditoria");
      expect(links).toContain("/caixa");
      expect(links).toContain("/entrega");
    }
  });

  it("abre só o que o caixa, a cozinha e o motoboy podem ver", () => {
    expect(hrefs("CASHIER")).toContain("/caixa");
    expect(hrefs("CASHIER")).not.toContain("/app/financeiro");
    expect(hrefs("CASHIER")).not.toContain("/app/equipe");
    expect(hrefs("CASHIER")).not.toContain("/app/cardapio");
    expect(hrefs("CASHIER")).not.toContain("/app");
    expect(hrefs("KITCHEN")).toEqual(["/app/pedidos", "/app/cozinha"]);
    expect(hrefs("DELIVERY")).toContain("/entrega");
    expect(hrefs("DELIVERY")).not.toContain("/caixa");
    expect(hrefs("WAITER")).toContain("/garcom");
    expect(hrefs("WAITER")).not.toContain("/caixa");
  });

  it("mostra estoque na nav do caixa e fechamento só para o gerente", () => {
    const caixa = navForUser({ platformRole: "USER", tenantRole: "CASHIER", surface: "caixa" }).map(
      (item) => item.href,
    );
    expect(caixa).toEqual(["/caixa", "/caixa/estoque", "/app/pedidos", "/app/clientes"]);
    const gerente = navForUser({ platformRole: "USER", tenantRole: "OWNER", surface: "caixa" }).map(
      (item) => item.href,
    );
    expect(gerente).toContain("/caixa/fechamento");
    expect(gerente).toContain("/app/equipe");
    expect(gerente).toContain("/app/cardapio");
  });

  it("usa a nav da plataforma no admin", () => {
    const links = navForUser({ platformRole: "SUPER_ADMIN", tenantRole: null, surface: "admin" }).map(
      (item) => item.href,
    );
    expect(links).toEqual([
      "/admin",
      "/admin/tenants",
      "/admin/users",
      "/admin/plans",
      "/admin/audit",
      "/app",
      "/caixa",
    ]);
  });
});
