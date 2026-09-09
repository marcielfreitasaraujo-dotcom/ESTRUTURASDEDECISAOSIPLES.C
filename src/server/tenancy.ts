import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ForbiddenError } from "@/lib/errors";

const TENANT_SCOPED_MODELS = new Set([
  "TenantMembership",
  "BusinessHour",
  "TenantPaymentMethod",
  "Category",
  "Product",
  "ProductVariant",
  "PizzaSize",
  "PizzaFlavor",
  "PizzaFlavorPrice",
  "Crust",
  "AddonGroup",
  "Addon",
  "Combo",
  "Customer",
  "CustomerAddress",
  "Cart",
  "CartItem",
  "Order",
  "OrderItem",
  "OrderStatusHistory",
  "Payment",
  "DeliveryZone",
  "Driver",
  "Delivery",
  "Coupon",
  "Promotion",
  "LoyaltyAccount",
  "LoyaltyTransaction",
  "InventoryItem",
  "StockMovement",
  "Recipe",
  "Expense",
  "Revenue",
  "Notification",
  "AuditLog",
  "AnalyticsEvent",
]);

type ArgsWithWhere = { where?: Record<string, unknown>; data?: unknown };

function injectTenant<T extends ArgsWithWhere>(model: string, operation: string, args: T, tenantId: string): T {
  if (!TENANT_SCOPED_MODELS.has(model)) return args;

  if (operation === "create") {
    const data = { ...(args.data as object), tenantId };
    return { ...args, data };
  }

  if (operation === "createMany") {
    const data = args.data;
    if (Array.isArray(data)) {
      return { ...args, data: data.map((row) => ({ ...(row as object), tenantId })) };
    }
    return { ...args, data: { ...(data as object), tenantId } };
  }

  return {
    ...args,
    where: { AND: [{ tenantId }, args.where ?? {}] },
  };
}

export function createTenantPrisma(tenantId: string) {
  if (!tenantId) {
    throw new ForbiddenError("Estabelecimento não selecionado.");
  }

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const nextArgs = injectTenant(model, operation, args as ArgsWithWhere, tenantId);
          return query(nextArgs as typeof args);
        },
      },
    },
  });
}

export type TenantPrisma = ReturnType<typeof createTenantPrisma>;

export function assertTenantId(recordTenantId: string | null | undefined, expected: string) {
  if (!recordTenantId || recordTenantId !== expected) {
    throw new ForbiddenError("Tenant A não pode acessar Tenant B.");
  }
}

export function tenantWhere(tenantId: string): Prisma.ProductWhereInput {
  return { tenantId };
}
