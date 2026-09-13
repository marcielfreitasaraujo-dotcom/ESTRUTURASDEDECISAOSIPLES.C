import { isPlatformAdmin, isStoreGerente, type PlatformRole, type TenantRole } from "@/domain/rbac/roles";

export function postLoginPath(input: {
  platformRole: PlatformRole;
  tenantRole: TenantRole | null;
}): string {
  if (isPlatformAdmin(input.platformRole)) return "/admin";
  switch (input.tenantRole) {
    case "CASHIER":
      return "/caixa";
    case "WAITER":
    case "STAFF":
      return "/garcom";
    case "KITCHEN":
      return "/app/cozinha";
    case "DELIVERY":
      return "/entrega";
    default:
      return "/app";
  }
}

export function storeStaffHomeHref(input: {
  platformRole: PlatformRole | null;
  tenantRole: TenantRole | null;
}): string | null {
  if (!input.platformRole) return null;
  if (isPlatformAdmin(input.platformRole) || isStoreGerente(input.tenantRole)) {
    return postLoginPath({ platformRole: input.platformRole, tenantRole: input.tenantRole });
  }
  return null;
}
