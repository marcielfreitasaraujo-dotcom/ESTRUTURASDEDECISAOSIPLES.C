"use server";

import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { requireAnyPermission } from "@/server/context";
import { changeOrderStatus, updateOrderEta } from "@/server/services/orders";
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

function revalidateOrders() {
  revalidatePath("/app/pedidos");
  revalidatePath("/app/cozinha");
  revalidatePath("/caixa");
  revalidatePath("/caixa/pedidos");
  revalidatePath("/entrega");
}

export async function updateOrderStatusFormAction(formData: FormData) {
  const orderId = String(formData.get("orderId") || "");
  const toStatus = String(formData.get("toStatus") || "") as OrderStatus;
  const rejected = String(formData.get("rejected") || "") === "1";
  const reason = String(formData.get("reason") || "") || undefined;
  if (!orderId || !STATUSES.has(toStatus)) {
    throw new Error("Pedido ou status inválido.");
  }
  const permission =
    toStatus === "PREPARING" || toStatus === "READY"
      ? [PERMISSIONS.KITCHEN_UPDATE]
      : toStatus === "OUT_FOR_DELIVERY" || toStatus === "DELIVERED"
        ? [PERMISSIONS.DELIVERY_UPDATE, PERMISSIONS.ORDER_UPDATE]
        : toStatus === "CANCELLED" && rejected
          ? [PERMISSIONS.ORDER_UPDATE, PERMISSIONS.ORDER_CANCEL]
          : toStatus === "CANCELLED"
            ? [PERMISSIONS.ORDER_CANCEL]
            : [PERMISSIONS.ORDER_UPDATE];
  try {
    const ctx = await requireAnyPermission(permission);
    await changeOrderStatus({
      tenantId: ctx.tenantId,
      orderId,
      toStatus,
      userId: ctx.userId,
      reason,
      rejected,
    });
    revalidateOrders();
  } catch (error) {
    throw new Error(publicErrorMessage(error).message);
  }
}

export async function updateOrderEtaFormAction(formData: FormData) {
  const orderId = String(formData.get("orderId") || "");
  const minutes = Number(formData.get("minutes") || 0);
  const reason = String(formData.get("reason") || "") || undefined;
  if (!orderId || !minutes) throw new Error("Informe o novo tempo.");
  try {
    const ctx = await requireAnyPermission([PERMISSIONS.ORDER_UPDATE, PERMISSIONS.KITCHEN_UPDATE]);
    await updateOrderEta({
      tenantId: ctx.tenantId,
      orderId,
      minutes,
      reason,
      userId: ctx.userId,
    });
    revalidateOrders();
  } catch (error) {
    throw new Error(publicErrorMessage(error).message);
  }
}
