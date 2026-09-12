export const PERMISSIONS = {
  DASHBOARD_READ: "dashboard.read",
  CATALOG_READ: "catalog.read",
  CATALOG_WRITE: "catalog.write",
  ORDER_READ: "order.read",
  ORDER_CREATE: "order.create",
  ORDER_UPDATE: "order.update",
  ORDER_CANCEL: "order.cancel",
  KITCHEN_READ: "kitchen.read",
  KITCHEN_UPDATE: "kitchen.update",
  DELIVERY_READ: "delivery.read",
  DELIVERY_UPDATE: "delivery.update",
  CUSTOMER_READ: "customer.read",
  CUSTOMER_WRITE: "customer.write",
  SETTINGS_READ: "settings.read",
  SETTINGS_WRITE: "settings.write",
  TEAM_READ: "team.read",
  TEAM_WRITE: "team.write",
  FINANCE_READ: "finance.read",
  FINANCE_WRITE: "finance.write",
  INVENTORY_READ: "inventory.read",
  INVENTORY_WRITE: "inventory.write",
  CASH_READ: "cash.read",
  CASH_OPERATE: "cash.operate",
  CASH_EXPENSE: "cash.expense",
  CASH_DISCOUNT: "cash.discount",
  CASH_CONFER: "cash.confer",
  CASH_ADJUST: "cash.adjust",
  PLATFORM_ADMIN: "platform.admin",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);
