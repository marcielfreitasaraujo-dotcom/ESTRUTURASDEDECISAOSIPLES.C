import { prisma } from "@/lib/db";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { assertTransition, type OrderStatus } from "@/domain/ordering/status";
import { writeAudit } from "@/server/audit";
import { getWhatsAppProvider } from "@/server/providers/whatsapp";
import { getPrintProvider } from "@/server/providers/print";

export async function listOrdersByStatus(tenantId: string) {
  return prisma.order.findMany({
    where: { tenantId, status: { not: "CANCELLED" } },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getKitchenQueue(tenantId: string, now = new Date()) {
  const orders = await prisma.order.findMany({
    where: { tenantId, status: { in: ["CONFIRMED", "PREPARING"] } },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });
  return orders.map((order) => ({
    ...order,
    elapsedMinutes: Math.max(0, Math.round((now.getTime() - order.createdAt.getTime()) / 60000)),
  }));
}

export async function changeOrderStatus(input: {
  tenantId: string;
  orderId: string;
  toStatus: OrderStatus;
  userId?: string;
}) {
  const order = await prisma.order.findFirst({
    where: { id: input.orderId, tenantId: input.tenantId },
  });
  if (!order) throw new NotFoundError("Pedido não encontrado.");
  assertTransition(order.status, input.toStatus);

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.order.update({
      where: { id: order.id },
      data: {
        status: input.toStatus,
        confirmedAt: input.toStatus === "CONFIRMED" ? new Date() : order.confirmedAt,
        preparingAt: input.toStatus === "PREPARING" ? new Date() : order.preparingAt,
        readyAt: input.toStatus === "READY" ? new Date() : order.readyAt,
        deliveredAt: input.toStatus === "DELIVERED" ? new Date() : order.deliveredAt,
        cancelledAt: input.toStatus === "CANCELLED" ? new Date() : order.cancelledAt,
      },
    });
    await tx.orderStatusHistory.create({
      data: {
        tenantId: input.tenantId,
        orderId: order.id,
        fromStatus: order.status,
        toStatus: input.toStatus,
        changedById: input.userId,
      },
    });
    return next;
  });

  if (input.toStatus === "CANCELLED") {
    await writeAudit({
      action: "ORDER_CANCELLED",
      entity: "Order",
      entityId: order.id,
      tenantId: input.tenantId,
      userId: input.userId,
      metadata: { from: order.status },
    });
  }

  await getWhatsAppProvider().send({
    to: order.customerPhone,
    text: `Pedido #${order.publicCode}: status atualizado para ${input.toStatus}.`,
  });

  if (input.toStatus === "CONFIRMED") {
    await getPrintProvider().print({
      type: "KITCHEN",
      tenantId: input.tenantId,
      payload: { orderId: order.id },
    });
  }

  return updated;
}

export async function getOrderForTenant(tenantId: string, publicCode: string) {
  const order = await prisma.order.findFirst({
    where: { tenantId, publicCode },
    include: { items: true, statusHistory: true },
  });
  if (!order) throw new NotFoundError("Pedido não encontrado.");
  return order;
}

export async function assertNoCrossTenantOrderAccess(actorTenantId: string, orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.tenantId !== actorTenantId) {
    throw new ForbiddenError("Tenant A não pode acessar Tenant B.");
  }
  return order;
}
