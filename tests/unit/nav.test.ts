import { describe, expect, it } from "vitest";
import { mobileTabNav, navForUser, navItemActive } from "@/domain/rbac/nav";

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
    expect(hrefs("CASHIER")).not.toContain("/app/auditoria");
    expect(hrefs("KITCHEN")).toEqual(["/app/pedidos", "/app/cozinha"]);
    expect(hrefs("DELIVERY")).toContain("/entrega");
    expect(hrefs("DELIVERY")).not.toContain("/caixa");
    expect(hrefs("WAITER")).toContain("/garcom");
    expect(hrefs("WAITER")).not.toContain("/caixa");
  });

  it("mostra o menu operacional do caixa, sem estoque nem gestão", () => {
    const caixa = navForUser({ platformRole: "USER", tenantRole: "CASHIER", surface: "caixa" }).map(
      (item) => item.href,
    );
    expect(caixa).toContain("/caixa");
    expect(caixa).toContain("/caixa/pdv");
    expect(caixa).toContain("/caixa/pagamentos");
    expect(caixa).toContain("/caixa/clientes");
    expect(caixa).toContain("/caixa/despesa");
    expect(caixa).not.toContain("/app/clientes");
    expect(caixa).toContain("/caixa/fechamento");
    expect(caixa).not.toContain("/caixa/estoque");
    expect(caixa).not.toContain("/app/equipe");
    expect(caixa).not.toContain("/app/cardapio");
    const gerente = navForUser({ platformRole: "USER", tenantRole: "OWNER", surface: "caixa" }).map(
      (item) => item.href,
    );
    expect(gerente).toContain("/caixa/estoque");
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

  it("mostra o mesmo estilo de menu para o garçom, com comandas, mesas e pedidos", () => {
    const links = navForUser({ platformRole: "USER", tenantRole: "WAITER", surface: "garcom" }).map(
      (item) => item.href,
    );
    expect(links[0]).toBe("/garcom");
    expect(links).toContain("/app/salao");
    expect(links).toContain("/app/pedidos");
    expect(links).toContain("/app/clientes");
    expect(links).not.toContain("/caixa");
    expect(mobileTabNav({ surface: "garcom", items: [] }).map((item) => item.href)).toEqual([
      "/garcom",
      "/app/salao",
      "/app/pedidos",
      "/app/clientes",
    ]);
  });

  it("mantém o motoboy na fila e nos pedidos sem sair do celular", () => {
    const links = navForUser({ platformRole: "USER", tenantRole: "DELIVERY", surface: "entrega" }).map(
      (item) => item.href,
    );
    expect(links).toEqual(["/entrega", "/entrega/pedidos"]);
    expect(mobileTabNav({ surface: "entrega", items: [] }).map((item) => item.href)).toEqual([
      "/entrega",
      "/entrega/pedidos",
    ]);
  });

  it("marca só a rota certa como ativa", () => {
    expect(navItemActive("/entrega", "/entrega")).toBe(true);
    expect(navItemActive("/entrega/pedidos", "/entrega")).toBe(false);
    expect(navItemActive("/caixa/pdv", "/caixa")).toBe(false);
    expect(navItemActive("/caixa/pdv", "/caixa/pdv")).toBe(true);
    expect(navItemActive("/app/pedidos", "/app")).toBe(false);
  });
});
