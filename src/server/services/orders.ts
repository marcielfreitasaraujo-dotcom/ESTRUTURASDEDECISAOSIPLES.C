import { prisma } from "@/lib/db";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { assertTransition, type OrderStatus } from "@/domain/ordering/status";
import { writeAudit } from "@/server/audit";
import { getPrintProvider } from "@/server/providers/print";
import { notifyOrderStatusWhatsApp } from "@/server/services/whatsapp";
import { staffDelayMeta } from "@/server/services/tracking";

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
    ...staffDelayMeta({
      status: order.status,
      createdAt: order.createdAt,
      estimatedMinutes: order.estimatedMinutes,
      fulfillment: order.fulfillment,
    }),
  }));
}

export async function changeOrderStatus(input: {
  tenantId: string;
  orderId: string;
  toStatus: OrderStatus;
  userId?: string;
  reason?: string;
  rejected?: boolean;
}) {
  const order = await prisma.order.findFirst({
    where: { id: input.orderId, tenantId: input.tenantId },
  });
  if (!order) throw new NotFoundError("Pedido não encontrado.");
  assertTransition(order.status, input.toStatus);

  const now = new Date();
  const rejected = Boolean(input.rejected && input.toStatus === "CANCELLED");
  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.order.update({
      where: { id: order.id },
      data: {
        status: input.toStatus,
        confirmedAt: input.toStatus === "CONFIRMED" ? now : order.confirmedAt,
        preparingAt: input.toStatus === "PREPARING" ? now : order.preparingAt,
        readyAt: input.toStatus === "READY" ? now : order.readyAt,
        outForDeliveryAt: input.toStatus === "OUT_FOR_DELIVERY" ? now : order.outForDeliveryAt,
        deliveredAt: input.toStatus === "DELIVERED" ? now : order.deliveredAt,
        cancelledAt: input.toStatus === "CANCELLED" ? now : order.cancelledAt,
        cancelReason: input.reason ?? order.cancelReason,
        rejected: rejected || order.rejected,
      },
    });
    await tx.orderStatusHistory.create({
      data: {
        tenantId: input.tenantId,
        orderId: order.id,
        fromStatus: order.status,
        toStatus: input.toStatus,
        changedById: input.userId,
        metadata: input.reason || rejected ? { reason: input.reason, rejected } : undefined,
      },
    });
    return next;
  });

  await writeAudit({
    action: input.toStatus === "CANCELLED" ? "ORDER_CANCELLED" : "UPDATE",
    entity: "Order",
    entityId: order.id,
    tenantId: input.tenantId,
    userId: input.userId,
    metadata: { from: order.status, to: input.toStatus, rejected },
  });

  if (input.toStatus === "CONFIRMED") {
    await getPrintProvider().print({
      type: "KITCHEN",
      tenantId: input.tenantId,
      payload: { orderId: order.id },
    });
  }

  await notifyOrderStatusWhatsApp({
    tenantId: input.tenantId,
    orderId: order.id,
    status: input.toStatus,
    rejected,
  }).catch(() => undefined);

  return updated;
}

export async function updateOrderEta(input: {
  tenantId: string;
  orderId: string;
  minutes: number;
  reason?: string;
  userId?: string;
}) {
  const minutes = Math.max(5, Math.min(180, Math.round(input.minutes)));
  const order = await prisma.order.findFirst({
    where: { id: input.orderId, tenantId: input.tenantId },
  });
  if (!order) throw new NotFoundError("Pedido não encontrado.");

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { estimatedMinutes: minutes, etaUpdatedAt: new Date() },
    });
    await tx.orderEtaChange.create({
      data: {
        tenantId: input.tenantId,
        orderId: order.id,
        previousMinutes: order.estimatedMinutes,
        nextMinutes: minutes,
        reason: input.reason,
        changedById: input.userId,
      },
    });
    await tx.orderStatusHistory.create({
      data: {
        tenantId: input.tenantId,
        orderId: order.id,
        fromStatus: order.status,
        toStatus: order.status,
        changedById: input.userId,
        metadata: { eta: { from: order.estimatedMinutes, to: minutes, reason: input.reason } },
      },
    });
  });

  await writeAudit({
    action: "UPDATE",
    entity: "Order",
    entityId: order.id,
    tenantId: input.tenantId,
    userId: input.userId,
    metadata: { etaFrom: order.estimatedMinutes, etaTo: minutes },
  });

  const { dispatchOrderWhatsApp } = await import("@/server/services/whatsapp");
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: input.tenantId } });
  await dispatchOrderWhatsApp({
    tenantId: tenant.id,
    orderId: order.id,
    event: "ETA_ATUALIZADA",
    to: order.customerPhone,
    publicCode: order.publicCode,
    totalCents: order.totalCents,
    estimatedMinutes: minutes,
    storeName: tenant.name,
    slug: tenant.slug,
    token: order.trackingToken,
    enabled: tenant.trackingWhatsappEnabled && tenant.trackingNotifyEnabled,
    destination: order.customerPhone,
  }).catch(() => undefined);

  return minutes;
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
