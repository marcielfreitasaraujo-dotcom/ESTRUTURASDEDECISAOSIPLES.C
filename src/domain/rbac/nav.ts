import { PERMISSIONS, type Permission } from "@/domain/rbac/permissions";
import { hasPermission, isPlatformAdmin, type PlatformRole, type TenantRole } from "@/domain/rbac/roles";

export type NavItem = { href: string; label: string; permission?: Permission };

export const PLATFORM_NAV: NavItem[] = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/tenants", label: "Estabelecimentos" },
  { href: "/admin/users", label: "Usuários" },
  { href: "/admin/plans", label: "Planos" },
  { href: "/admin/audit", label: "Auditoria" },
];

const TENANT_NAV: NavItem[] = [
  { href: "/app", label: "Painel", permission: PERMISSIONS.DASHBOARD_READ },
  { href: "/app/pedidos", label: "Pedidos", permission: PERMISSIONS.ORDER_READ },
  { href: "/app/cozinha", label: "Cozinha", permission: PERMISSIONS.KITCHEN_READ },
  { href: "/app/cardapio", label: "Cardápio", permission: PERMISSIONS.CATALOG_READ },
  { href: "/app/clientes", label: "Clientes", permission: PERMISSIONS.CUSTOMER_READ },
  { href: "/app/entregas", label: "Entregas", permission: PERMISSIONS.DELIVERY_READ },
  { href: "/app/cupons", label: "Cupons", permission: PERMISSIONS.CATALOG_WRITE },
  { href: "/app/estoque", label: "Estoque", permission: PERMISSIONS.INVENTORY_READ },
  { href: "/app/financeiro", label: "Financeiro", permission: PERMISSIONS.FINANCE_READ },
  { href: "/app/equipe", label: "Equipe", permission: PERMISSIONS.TEAM_READ },
  { href: "/app/configuracoes", label: "Loja", permission: PERMISSIONS.SETTINGS_READ },
  { href: "/caixa", label: "Caixa", permission: PERMISSIONS.ORDER_UPDATE },
  { href: "/garcom", label: "Garçom", permission: PERMISSIONS.ORDER_CREATE },
  { href: "/entrega", label: "Motoboy", permission: PERMISSIONS.DELIVERY_UPDATE },
];

export function navForUser(input: {
  platformRole: PlatformRole;
  tenantRole: TenantRole | null;
  surface?: "app" | "admin" | "caixa" | "garcom" | "entrega";
}): NavItem[] {
  if (input.surface === "admin" || isPlatformAdmin(input.platformRole)) {
    if (input.surface === "admin" || !input.tenantRole) return PLATFORM_NAV;
  }
  if (input.surface === "caixa") {
    return [
      { href: "/caixa", label: "PDV" },
      { href: "/caixa/estoque", label: "Estoque" },
      { href: "/app/pedidos", label: "Fila" },
      { href: "/app/clientes", label: "Clientes" },
    ];
  }
  if (input.surface === "garcom") {
    return [{ href: "/garcom", label: "Comandas" }];
  }
  if (input.surface === "entrega") {
    return [
      { href: "/entrega", label: "Entregas" },
      { href: "/app/pedidos", label: "Pedidos" },
    ];
  }
  if (!input.tenantRole) return [];
  return TENANT_NAV.filter((item) => !item.permission || hasPermission(input.tenantRole!, item.permission));
}
