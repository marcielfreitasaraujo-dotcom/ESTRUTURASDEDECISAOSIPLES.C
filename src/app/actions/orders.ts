"use server";

import { revalidatePath } from "next/cache";
import { requireTenantPermission } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { changeOrderStatus } from "@/server/services/orders";
import type { OrderStatus } from "@/domain/ordering/status";
import { publicErrorMessage } from "@/lib/errors";

export async function updateOrderStatusAction(orderId: string, toStatus: OrderStatus) {
  try {
    const permission = toStatus === "PREPARING" || toStatus === "READY"
      ? PERMISSIONS.KITCHEN_UPDATE
      : PERMISSIONS.ORDER_UPDATE;
    const ctx = await requireTenantPermission(permission);
    await changeOrderStatus({
      tenantId: ctx.tenantId,
      orderId,
      toStatus,
      userId: ctx.userId,
    });
    revalidatePath("/app/pedidos");
    revalidatePath("/app/cozinha");
    return { ok: true };
  } catch (error) {
    return { error: publicErrorMessage(error).message };
  }
}
