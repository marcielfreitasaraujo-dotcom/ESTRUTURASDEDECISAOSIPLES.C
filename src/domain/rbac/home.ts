import { isPlatformAdmin, type PlatformRole, type TenantRole } from "@/domain/rbac/roles";

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
