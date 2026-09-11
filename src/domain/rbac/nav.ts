import { PERMISSIONS, type Permission } from "@/domain/rbac/permissions";
import { hasPermission, isPlatformAdmin, isStoreGerente, type PlatformRole, type TenantRole } from "@/domain/rbac/roles";

export type NavItem = { href: string; label: string; permission?: Permission };

export type NavGroup = { id: string; label: string; items: NavItem[] };

const NAV_ROOTS = ["/app", "/caixa", "/admin", "/garcom", "/entrega"];

export function navItemActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (NAV_ROOTS.includes(href)) return false;
  return pathname.startsWith(`${href}/`);
}

export const PLATFORM_NAV: NavItem[] = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/tenants", label: "Estabelecimentos" },
  { href: "/admin/users", label: "Usuários" },
  { href: "/admin/plans", label: "Planos" },
  { href: "/admin/audit", label: "Auditoria" },
  { href: "/app", label: "Loja" },
  { href: "/caixa", label: "Caixa" },
];

export const TENANT_NAV_GROUPS: NavGroup[] = [
  {
    id: "inicio",
    label: "",
    items: [
      { href: "/app", label: "Dashboard", permission: PERMISSIONS.DASHBOARD_READ },
      { href: "/caixa", label: "PDV", permission: PERMISSIONS.ORDER_UPDATE },
    ],
  },
  {
    id: "operacao",
    label: "Operação",
    items: [
      { href: "/app/pedidos", label: "Pedidos", permission: PERMISSIONS.ORDER_READ },
      { href: "/app/salao", label: "Mesas", permission: PERMISSIONS.ORDER_CREATE },
      { href: "/app/cozinha", label: "Cozinha", permission: PERMISSIONS.KITCHEN_READ },
      { href: "/app/entregas", label: "Entregas", permission: PERMISSIONS.DELIVERY_READ },
      { href: "/entrega", label: "Motoboy", permission: PERMISSIONS.DELIVERY_UPDATE },
    ],
  },
  {
    id: "vendas",
    label: "Vendas",
    items: [
      { href: "/garcom", label: "Novo pedido", permission: PERMISSIONS.ORDER_CREATE },
      { href: "/app/clientes", label: "Clientes", permission: PERMISSIONS.CUSTOMER_READ },
      { href: "/app/cupons", label: "Cupons", permission: PERMISSIONS.CATALOG_WRITE },
    ],
  },
  {
    id: "cardapio",
    label: "Cardápio",
    items: [
      { href: "/app/cardapio", label: "Produtos", permission: PERMISSIONS.CATALOG_WRITE },
    ],
  },
  {
    id: "estoque",
    label: "Estoque",
    items: [{ href: "/app/estoque", label: "Estoque", permission: PERMISSIONS.INVENTORY_READ }],
  },
  {
    id: "financeiro",
    label: "Financeiro",
    items: [
      { href: "/app/caixas", label: "Central de caixas", permission: PERMISSIONS.CASH_CONFER },
      { href: "/app/caixas/relatorios", label: "Relatórios de caixa", permission: PERMISSIONS.CASH_CONFER },
      { href: "/app/financeiro", label: "Lançamentos", permission: PERMISSIONS.FINANCE_READ },
      { href: "/app/relatorios", label: "Relatórios", permission: PERMISSIONS.FINANCE_READ },
    ],
  },
  {
    id: "gestao",
    label: "Gestão",
    items: [
      { href: "/app/equipe", label: "Usuários e operadores", permission: PERMISSIONS.TEAM_READ },
      { href: "/app/caixas/terminais", label: "Terminais", permission: PERMISSIONS.CASH_CONFER },
      { href: "/app/auditoria", label: "Auditoria", permission: PERMISSIONS.SETTINGS_READ },
      { href: "/app/configuracoes", label: "Loja", permission: PERMISSIONS.SETTINGS_READ },
    ],
  },
];

export const TENANT_FOOTER_NAV: NavItem[] = [
  { href: "/app/configuracoes", label: "Configurações", permission: PERMISSIONS.SETTINGS_READ },
  { href: "/app/ajuda", label: "Ajuda" },
];

export const CAIXA_NAV_GROUPS: NavGroup[] = [
  {
    id: "main",
    label: "",
    items: [
      { href: "/caixa", label: "Início" },
      { href: "/caixa/pdv", label: "PDV" },
      { href: "/caixa/pedidos", label: "Pedidos" },
      { href: "/caixa/pagamentos", label: "Pagamentos" },
      { href: "/caixa/mesas", label: "Mesas" },
      { href: "/caixa/clientes", label: "Clientes" },
    ],
  },
  {
    id: "meu-caixa",
    label: "Meu caixa",
    items: [
      { href: "/caixa/movimentacoes", label: "Movimentações" },
      { href: "/caixa/sangria", label: "Sangria" },
      { href: "/caixa/suprimento", label: "Suprimento" },
      { href: "/caixa/despesa", label: "Despesa" },
      { href: "/caixa/conferencia", label: "Conferência" },
      { href: "/caixa/fechamento", label: "Fechamento" },
    ],
  },
  {
    id: "resumo",
    label: "Resumo",
    items: [
      { href: "/caixa/turno", label: "Meu turno" },
      { href: "/caixa/historico", label: "Histórico" },
    ],
  },
];

export const CAIXA_FOOTER_NAV: NavItem[] = [{ href: "/caixa/conta", label: "Minha conta" }];

const TENANT_NAV: NavItem[] = uniqueNav(TENANT_NAV_GROUPS.flatMap((group) => group.items));

function uniqueNav(items: NavItem[]): NavItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

function allowed(role: TenantRole, item: NavItem) {
  return !item.permission || hasPermission(role, item.permission);
}

export function navForUser(input: {
  platformRole: PlatformRole;
  tenantRole: TenantRole | null;
  surface?: "app" | "admin" | "caixa" | "garcom" | "entrega";
}): NavItem[] {
  if (input.surface === "admin" || isPlatformAdmin(input.platformRole)) {
    if (input.surface === "admin" || !input.tenantRole) return PLATFORM_NAV;
  }
  if (input.surface === "caixa") {
    const items = CAIXA_NAV_GROUPS.flatMap((group) => group.items);
    if (isStoreGerente(input.tenantRole) || isPlatformAdmin(input.platformRole)) {
      items.push({ href: "/caixa/estoque", label: "Estoque" });
      items.push({ href: "/app/equipe", label: "Equipe" });
      items.push({ href: "/app/cardapio", label: "Cardápio" });
      items.push({ href: "/app", label: "Painel" });
    }
    return uniqueNav(items);
  }
  if (input.surface === "garcom") {
    return [{ href: "/garcom", label: "Comandas" }];
  }
  if (input.surface === "entrega") {
    return [
      { href: "/entrega", label: "Fila" },
      { href: "/entrega/pedidos", label: "Pedidos" },
    ];
  }
  if (!input.tenantRole) return [];
  return TENANT_NAV.filter((item) => allowed(input.tenantRole!, item));
}

export function groupedNavForUser(input: {
  platformRole: PlatformRole;
  tenantRole: TenantRole | null;
  storefrontHref?: string;
}): NavGroup[] {
  if (!input.tenantRole && !isPlatformAdmin(input.platformRole)) return [];
  const role = input.tenantRole;
  const groups = TENANT_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => (role ? allowed(role, item) : true)),
  })).filter((group) => group.items.length > 0);

  if (input.storefrontHref && role && hasPermission(role, PERMISSIONS.CATALOG_WRITE)) {
    return groups.map((group) =>
      group.id === "cardapio"
        ? {
            ...group,
            items: [...group.items, { href: input.storefrontHref!, label: "Cardápio digital" }],
          }
        : group,
    );
  }
  return groups;
}

export function groupedCaixaNavForUser(input: {
  platformRole: PlatformRole;
  tenantRole: TenantRole | null;
}): NavGroup[] {
  const groups = CAIXA_NAV_GROUPS.map((group) => ({ ...group, items: [...group.items] }));
  if (isStoreGerente(input.tenantRole) || isPlatformAdmin(input.platformRole)) {
    groups.push({
      id: "gestao",
      label: "Gestão",
      items: [
        { href: "/app/caixas", label: "Central de conferência" },
        { href: "/caixa/estoque", label: "Estoque" },
        { href: "/app/equipe", label: "Equipe" },
        { href: "/app/cardapio", label: "Cardápio" },
        { href: "/app", label: "Painel" },
      ],
    });
  }
  return groups;
}

export function footerNavForUser(tenantRole: TenantRole | null): NavItem[] {
  if (!tenantRole) return [{ href: "/app/ajuda", label: "Ajuda" }];
  return TENANT_FOOTER_NAV.filter((item) => allowed(tenantRole, item));
}

export function mobileTabNav(input: {
  surface?: "app" | "admin" | "caixa" | "garcom" | "entrega";
  items: NavItem[];
  groups?: NavGroup[];
}): NavItem[] {
  if (input.surface === "entrega") {
    return [
      { href: "/entrega", label: "Fila" },
      { href: "/entrega/pedidos", label: "Pedidos" },
    ];
  }
  if (input.surface === "garcom") {
    return [{ href: "/garcom", label: "Comandas" }];
  }
  if (input.surface === "caixa") {
    return uniqueNav(input.groups?.[0]?.items ?? input.items).slice(0, 5);
  }
  if (input.surface === "admin") {
    return uniqueNav(input.items).slice(0, 4);
  }
  const preferred = [
    { href: "/app", label: "Início" },
    { href: "/app/pedidos", label: "Pedidos" },
    { href: "/app/salao", label: "Mesas" },
    { href: "/caixa", label: "PDV" },
    { href: "/app/equipe", label: "Equipe" },
  ];
  const flat = uniqueNav(input.groups?.flatMap((group) => group.items) ?? input.items);
  return preferred
    .map((tab) => {
      const match = flat.find((item) => item.href === tab.href);
      return match ? { ...match, label: tab.label } : null;
    })
    .filter((item): item is NavItem => Boolean(item));
}
