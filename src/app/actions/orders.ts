"use server";

import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { requireAnyPermission } from "@/server/context";
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
      ? [PERMISSIONS.KITCHEN_UPDATE]
      : toStatus === "OUT_FOR_DELIVERY" || toStatus === "DELIVERED"
        ? [PERMISSIONS.DELIVERY_UPDATE, PERMISSIONS.ORDER_UPDATE]
        : toStatus === "CANCELLED"
          ? [PERMISSIONS.ORDER_CANCEL, PERMISSIONS.ORDER_UPDATE]
          : [PERMISSIONS.ORDER_UPDATE];
  try {
    const ctx = await requireAnyPermission(permission);
    await changeOrderStatus({
      tenantId: ctx.tenantId,
      orderId,
      toStatus,
      userId: ctx.userId,
    });
    revalidatePath("/app/pedidos");
    revalidatePath("/app/cozinha");
    revalidatePath("/caixa");
    revalidatePath("/entrega");
  } catch (error) {
    throw new Error(publicErrorMessage(error).message);
  }
}
