import { PERMISSIONS, type Permission } from "@/domain/rbac/permissions";

export const TENANT_ROLES = [
  "OWNER",
  "MANAGER",
  "CASHIER",
  "WAITER",
  "KITCHEN",
  "DELIVERY",
  "STAFF",
] as const;

export type TenantRole = (typeof TENANT_ROLES)[number];

export const PLATFORM_ROLES = ["SUPER_ADMIN", "PLATFORM_ADMIN", "USER"] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

const ALL = Object.values(PERMISSIONS);

const STORE_MANAGER_PERMISSIONS = ALL.filter((permission) => permission !== PERMISSIONS.PLATFORM_ADMIN);

export const ROLE_PERMISSIONS: Record<TenantRole, readonly Permission[]> = {
  OWNER: STORE_MANAGER_PERMISSIONS,
  MANAGER: STORE_MANAGER_PERMISSIONS,
  CASHIER: [
    PERMISSIONS.CATALOG_READ,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_WRITE,
    PERMISSIONS.CASH_READ,
    PERMISSIONS.CASH_OPERATE,
  ],
  WAITER: [
    PERMISSIONS.CATALOG_READ,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.CUSTOMER_READ,
  ],
  KITCHEN: [PERMISSIONS.KITCHEN_READ, PERMISSIONS.KITCHEN_UPDATE, PERMISSIONS.ORDER_READ],
  DELIVERY: [PERMISSIONS.DELIVERY_READ, PERMISSIONS.DELIVERY_UPDATE, PERMISSIONS.ORDER_READ],
  STAFF: [
    PERMISSIONS.CATALOG_READ,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.CUSTOMER_READ,
  ],
};

export function hasPermission(role: TenantRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function isPlatformAdmin(role: PlatformRole): boolean {
  return role === "SUPER_ADMIN" || role === "PLATFORM_ADMIN";
}

export const EMPLOYEE_ROLES: TenantRole[] = ["MANAGER", "CASHIER", "WAITER", "KITCHEN", "DELIVERY", "STAFF"];

export const ROLES_GERENTE_CAN_ASSIGN: TenantRole[] = [
  "MANAGER",
  "CASHIER",
  "WAITER",
  "KITCHEN",
  "DELIVERY",
  "STAFF",
];

export const ROLES_MANAGER_CAN_ASSIGN = ROLES_GERENTE_CAN_ASSIGN;

export function isStoreGerente(role: TenantRole | null): boolean {
  return role === "OWNER" || role === "MANAGER";
}

export function rolesActorCanAssign(actorRole: TenantRole, platformRole?: PlatformRole | null): TenantRole[] {
  if (platformRole && isPlatformAdmin(platformRole)) return [...TENANT_ROLES];
  if (isStoreGerente(actorRole)) return [...ROLES_GERENTE_CAN_ASSIGN];
  return [];
}

export function canAssignTenantRole(
  actorRole: TenantRole,
  targetRole: TenantRole,
  platformRole?: PlatformRole | null,
): boolean {
  return rolesActorCanAssign(actorRole, platformRole).includes(targetRole);
}

export function canManageTenantMember(
  actorRole: TenantRole,
  targetRole: TenantRole,
  platformRole?: PlatformRole | null,
): boolean {
  if (platformRole && isPlatformAdmin(platformRole)) return true;
  if (!isStoreGerente(actorRole)) return false;
  if (targetRole === "OWNER") return false;
  return ROLES_GERENTE_CAN_ASSIGN.includes(targetRole) || targetRole === "MANAGER";
}

export function canSetPlatformRole(actorRole: PlatformRole, targetRole: PlatformRole): boolean {
  if (actorRole === "SUPER_ADMIN") return true;
  if (actorRole === "PLATFORM_ADMIN") return targetRole === "USER";
  return false;
}

export function canEditPlatformUser(actorRole: PlatformRole, targetRole: PlatformRole): boolean {
  if (isPlatformAdmin(targetRole) && actorRole !== "SUPER_ADMIN") return false;
  return canSetPlatformRole(actorRole, targetRole) || (actorRole === "SUPER_ADMIN" && targetRole === "USER");
}
