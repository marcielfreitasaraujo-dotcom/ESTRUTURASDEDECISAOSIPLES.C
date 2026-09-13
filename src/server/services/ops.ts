import { prisma } from "@/lib/db";
import type { CouponType, DriverStatus } from "@prisma/client";

export async function listDeliveryOps(tenantId: string) {
  const [zones, drivers, queue] = await Promise.all([
    prisma.deliveryZone.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
    prisma.driver.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
    prisma.order.findMany({
      where: {
        tenantId,
        fulfillment: "DELIVERY",
        status: { in: ["READY", "OUT_FOR_DELIVERY"] },
      },
      include: { items: true, delivery: { include: { driver: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  return { zones, drivers, queue };
}

export async function upsertZone(input: {
  tenantId: string;
  id?: string;
  name: string;
  feeCents: number;
  minOrderCents: number;
}) {
  if (input.id) {
    return prisma.deliveryZone.update({
      where: { id: input.id },
      data: { name: input.name, feeCents: input.feeCents, minOrderCents: input.minOrderCents },
    });
  }
  return prisma.deliveryZone.create({
    data: {
      tenantId: input.tenantId,
      name: input.name,
      feeCents: input.feeCents,
      minOrderCents: input.minOrderCents,
    },
  });
}

export async function upsertDriver(input: {
  tenantId: string;
  name: string;
  phone: string;
  status?: DriverStatus;
}) {
  return prisma.driver.create({
    data: {
      tenantId: input.tenantId,
      name: input.name,
      phone: input.phone,
      status: input.status ?? "AVAILABLE",
    },
  });
}

export async function assignDelivery(input: {
  tenantId: string;
  orderId: string;
  driverId: string;
  userId: string;
}) {
  const order = await prisma.order.findFirst({
    where: { id: input.orderId, tenantId: input.tenantId, fulfillment: "DELIVERY" },
  });
  if (!order) throw new Error("Pedido de entrega não encontrado.");
  const driver = await prisma.driver.findFirst({
    where: { id: input.driverId, tenantId: input.tenantId },
  });
  if (!driver) throw new Error("Entregador não encontrado.");

  await prisma.$transaction([
    prisma.delivery.upsert({
      where: { orderId: order.id },
      update: { driverId: driver.id, assignedAt: new Date() },
      create: {
        tenantId: input.tenantId,
        orderId: order.id,
        driverId: driver.id,
        feeCents: order.deliveryFeeCents,
        assignedAt: new Date(),
      },
    }),
    prisma.driver.update({ where: { id: driver.id }, data: { status: "BUSY" } }),
  ]);
}

export async function listCoupons(tenantId: string) {
  return prisma.coupon.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
}

export async function createCoupon(input: {
  tenantId: string;
  code: string;
  type: CouponType;
  value: number;
  minSubtotalCents: number;
}) {
  return prisma.coupon.create({
    data: {
      tenantId: input.tenantId,
      code: input.code.toUpperCase().trim(),
      type: input.type,
      value: input.value,
      minSubtotalCents: input.minSubtotalCents,
    },
  });
}

export async function toggleCoupon(tenantId: string, id: string) {
  const coupon = await prisma.coupon.findFirst({ where: { id, tenantId } });
  if (!coupon) throw new Error("Cupom não encontrado.");
  return prisma.coupon.update({ where: { id: coupon.id }, data: { active: !coupon.active } });
}
