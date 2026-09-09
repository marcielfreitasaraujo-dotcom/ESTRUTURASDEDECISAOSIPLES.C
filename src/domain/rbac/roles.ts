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

export const ROLE_PERMISSIONS: Record<TenantRole, readonly Permission[]> = {
  OWNER: ALL.filter((permission) => permission !== PERMISSIONS.PLATFORM_ADMIN),
  MANAGER: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.CATALOG_READ,
    PERMISSIONS.CATALOG_WRITE,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.ORDER_CANCEL,
    PERMISSIONS.KITCHEN_READ,
    PERMISSIONS.KITCHEN_UPDATE,
    PERMISSIONS.DELIVERY_READ,
    PERMISSIONS.DELIVERY_UPDATE,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_WRITE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_WRITE,
    PERMISSIONS.TEAM_READ,
    PERMISSIONS.TEAM_WRITE,
    PERMISSIONS.FINANCE_READ,
    PERMISSIONS.FINANCE_WRITE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_WRITE,
  ],
  CASHIER: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.CATALOG_READ,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_WRITE,
    PERMISSIONS.SETTINGS_READ,
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

export const ROLES_MANAGER_CAN_ASSIGN: TenantRole[] = ["CASHIER", "WAITER", "KITCHEN", "DELIVERY", "STAFF"];

export function rolesActorCanAssign(actorRole: TenantRole): TenantRole[] {
  if (actorRole === "OWNER") return [...TENANT_ROLES];
  if (actorRole === "MANAGER") return ROLES_MANAGER_CAN_ASSIGN;
  return [];
}

export function canAssignTenantRole(actorRole: TenantRole, targetRole: TenantRole): boolean {
  return rolesActorCanAssign(actorRole).includes(targetRole);
}

export function canManageTenantMember(actorRole: TenantRole, targetRole: TenantRole): boolean {
  if (actorRole === "OWNER") return true;
  if (actorRole === "MANAGER") return ROLES_MANAGER_CAN_ASSIGN.includes(targetRole);
  return false;
}

export function canSetPlatformRole(actorRole: PlatformRole, targetRole: PlatformRole): boolean {
  if (actorRole === "SUPER_ADMIN") return true;
  if (actorRole === "PLATFORM_ADMIN") return targetRole === "USER";
  return false;
}
