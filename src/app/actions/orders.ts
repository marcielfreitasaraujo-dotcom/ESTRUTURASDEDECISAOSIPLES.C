"use server";

import { revalidatePath } from "next/cache";
import { requireTenantPermission } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { changeOrderStatus } from "@/server/services/orders";
import type { OrderStatus } from "@/domain/ordering/status";
import { publicErrorMessage } from "@/lib/errors";

const STATUSES = new Set<OrderStatus>([
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
]);

export async function updateOrderStatusFormAction(formData: FormData) {
  const orderId = String(formData.get("orderId") || "");
  const toStatus = String(formData.get("toStatus") || "") as OrderStatus;
  if (!orderId || !STATUSES.has(toStatus)) {
    throw new Error("Pedido ou status inválido.");
  }
  const permission =
    toStatus === "PREPARING" || toStatus === "READY"
      ? PERMISSIONS.KITCHEN_UPDATE
      : PERMISSIONS.ORDER_UPDATE;
  try {
    const ctx = await requireTenantPermission(permission);
    await changeOrderStatus({
      tenantId: ctx.tenantId,
      orderId,
      toStatus,
      userId: ctx.userId,
    });
    revalidatePath("/app/pedidos");
    revalidatePath("/app/cozinha");
  } catch (error) {
    throw new Error(publicErrorMessage(error).message);
  }
}
