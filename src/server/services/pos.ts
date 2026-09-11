import { prisma } from "@/lib/db";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { quotePizza } from "@/domain/catalog/pizza-pricing";
import { calculateCheckoutTotals } from "@/domain/ordering/checkout";
import { assertSalonTableNumber, normalizeTableCount } from "@/domain/floor/tables";
import { writeAudit } from "@/server/audit";
import type { FulfillmentType, OrderStatus, PaymentMethod, Prisma } from "@prisma/client";

export type StaffOrderItemInput =
  | { kind: "PRODUCT"; productId: string; quantity: number; notes?: string }
  | {
      kind: "PIZZA";
      sizeId: string;
      flavorIds: string[];
      crustId?: string;
      addonIds?: string[];
      quantity: number;
      notes?: string;
    };

type StaffOrderLine = {
  productId: string | null;
  name: string;
  quantity: number;
  unitPriceCents: number;
  notes?: string;
  customization?: Prisma.InputJsonValue;
};

export async function getTenantTableCount(tenantId: string) {
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: { tableCount: true },
  });
  return normalizeTableCount(tenant.tableCount);
}

async function buildStaffOrderLines(tenantId: string, items: StaffOrderItemInput[]): Promise<StaffOrderLine[]> {
  const lines: StaffOrderLine[] = [];

  for (const item of items) {
    if (item.quantity < 1) continue;
    if (item.kind === "PRODUCT") {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, tenantId, active: true, archived: false },
      });
      if (!product) throw new NotFoundError("Produto não encontrado.");
      const unitPriceCents = product.promotionalPriceCents ?? product.priceCents;
      lines.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPriceCents,
        notes: item.notes,
      });
      continue;
    }

    const size = await prisma.pizzaSize.findFirst({
      where: { id: item.sizeId, tenantId, active: true },
      include: { flavorPrices: true },
    });
    if (!size) throw new NotFoundError("Tamanho não encontrado.");
    const flavors = await prisma.pizzaFlavor.findMany({
      where: { id: { in: item.flavorIds }, tenantId, active: true },
      include: { prices: true },
    });
    if (flavors.length === 0) throw new Error("Selecione ao menos um sabor.");
    const crust = item.crustId
      ? await prisma.crust.findFirst({ where: { id: item.crustId, tenantId, active: true } })
      : null;
    const addons = item.addonIds?.length
      ? await prisma.addon.findMany({ where: { id: { in: item.addonIds }, tenantId, active: true } })
      : [];
    const quote = quotePizza({
      sizeName: size.name,
      maxFlavors: size.maxFlavors,
      basePriceCents: size.basePriceCents,
      pricingMode: size.pricingMode,
      flavors: flavors.map((flavor) => ({
        id: flavor.id,
        name: flavor.name,
        priceCents: flavor.prices.find((price) => price.sizeId === size.id)?.priceCents ?? 0,
      })),
      crustPriceCents: crust?.priceCents ?? 0,
      addons: addons.map((addon) => ({ id: addon.id, name: addon.name, priceCents: addon.priceCents, quantity: 1 })),
    });
    lines.push({
      productId: null,
      name: `Pizza ${size.name}`,
      quantity: item.quantity,
      unitPriceCents: quote.totalCents,
      notes: item.notes,
      customization: quote as unknown as Prisma.InputJsonValue,
    });
  }

  if (lines.length === 0) throw new Error("Inclua ao menos um item na comanda.");
  return lines;
}

export async function findOpenTableOrder(tenantId: string, tableNumber: string) {
  const open = await prisma.order.findMany({
    where: {
      tenantId,
      tableNumber,
      status: { notIn: ["DELIVERED", "CANCELLED"] },
    },
    include: { items: true, payments: true },
    orderBy: { createdAt: "asc" },
  });
  return open.find((order) => order.paymentStatus !== "PAID") ?? open[0] ?? null;
}

export async function createStaffOrder(input: {
  tenantId: string;
  userId: string;
  idempotencyKey: string;
  tableNumber?: string;
  customerName: string;
  customerPhone?: string;
  fulfillment: Extract<FulfillmentType, "DINE_IN" | "PICKUP">;
  paymentMethod: PaymentMethod;
  notes?: string;
  items: StaffOrderItemInput[];
  confirmImmediately?: boolean;
}) {
  const existing = await prisma.order.findUnique({
    where: { tenantId_idempotencyKey: { tenantId: input.tenantId, idempotencyKey: input.idempotencyKey } },
  });
  if (existing) return existing;

  const lines = await buildStaffOrderLines(input.tenantId, input.items);

  const totals = calculateCheckoutTotals({
    items: lines.map((line) => ({
      name: line.name,
      unitPriceCents: line.unitPriceCents,
      quantity: line.quantity,
    })),
    discountCents: 0,
    deliveryFeeCents: 0,
  });

  const last = await prisma.order.findFirst({
    where: { tenantId: input.tenantId },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const number = (last?.number ?? 1000) + 1;
  const status = input.confirmImmediately ? "CONFIRMED" : "PENDING";
  const digits = (input.customerPhone ?? "").replace(/\D/g, "");
  const customer =
    digits.length >= 10
      ? await prisma.customer.upsert({
          where: { tenantId_phone: { tenantId: input.tenantId, phone: digits } },
          update: { name: input.customerName },
          create: {
            tenantId: input.tenantId,
            name: input.customerName,
            phone: digits,
          },
        })
      : null;

  const order = await prisma.order.create({
    data: {
      tenantId: input.tenantId,
      number,
      publicCode: number.toString().padStart(4, "0"),
      customerId: customer?.id,
      status,
      fulfillment: input.fulfillment,
      tableNumber: input.tableNumber,
      customerName: input.customerName,
      customerPhone: input.customerPhone ?? "00000000",
      notes: input.notes,
      subtotalCents: totals.subtotalCents,
      discountCents: 0,
      deliveryFeeCents: 0,
      totalCents: totals.totalCents,
      paymentMethod: input.paymentMethod,
      paymentStatus: "PENDING",
      idempotencyKey: input.idempotencyKey,
      confirmedAt: input.confirmImmediately ? new Date() : null,
      items: {
        create: lines.map((line) => ({
          tenantId: input.tenantId,
          productId: line.productId,
          name: line.name,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
          totalCents: line.unitPriceCents * line.quantity,
          notes: line.notes,
          customization: line.customization,
        })),
      },
      statusHistory: {
        create: { tenantId: input.tenantId, toStatus: status, changedById: input.userId },
      },
      payments: {
        create: {
          tenantId: input.tenantId,
          provider: "manual",
          method: input.paymentMethod,
          status: "PENDING",
          amountCents: totals.totalCents,
        },
      },
    },
  });

  await prisma.analyticsEvent.create({
    data: {
      tenantId: input.tenantId,
      name: "ORDER_CREATED",
      payload: { orderId: order.id, source: "staff", tableNumber: input.tableNumber },
    },
  });
  await writeAudit({
    action: "CREATE",
    entity: "Order",
    entityId: order.id,
    tenantId: input.tenantId,
    userId: input.userId,
    metadata: { number: order.number, tableNumber: input.tableNumber, source: "staff" },
  });
  return order;
}

export async function addItemsToOpenOrder(input: {
  tenantId: string;
  userId: string;
  orderId: string;
  items: StaffOrderItemInput[];
  notes?: string;
}) {
  const order = await prisma.order.findFirst({
    where: { id: input.orderId, tenantId: input.tenantId, status: { notIn: ["DELIVERED", "CANCELLED"] } },
    include: { items: true },
  });
  if (!order) throw new NotFoundError("Comanda da mesa não encontrada.");

  const added = await buildStaffOrderLines(input.tenantId, input.items);
  const mergedItems = [
    ...order.items.map((item) => ({
      name: item.name,
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
    })),
    ...added.map((line) => ({
      name: line.name,
      unitPriceCents: line.unitPriceCents,
      quantity: line.quantity,
    })),
  ];
  const totals = calculateCheckoutTotals({
    items: mergedItems,
    discountCents: order.discountCents,
    deliveryFeeCents: order.deliveryFeeCents,
  });

  const reopenKitchen = order.status === "READY" || order.status === "OUT_FOR_DELIVERY";
  const nextStatus: OrderStatus = reopenKitchen ? "CONFIRMED" : order.status;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.orderItem.createMany({
      data: added.map((line) => ({
        tenantId: input.tenantId,
        orderId: order.id,
        productId: line.productId,
        name: line.name,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
        totalCents: line.unitPriceCents * line.quantity,
        notes: line.notes,
        customization: line.customization,
      })),
    });
    const next = await tx.order.update({
      where: { id: order.id },
      data: {
        subtotalCents: totals.subtotalCents,
        totalCents: totals.totalCents,
        paymentStatus: "PENDING",
        notes: [order.notes, input.notes].filter(Boolean).join(" · ") || order.notes,
        status: nextStatus,
        confirmedAt: order.confirmedAt ?? new Date(),
      },
    });
    await tx.payment.updateMany({
      where: { orderId: order.id, tenantId: input.tenantId },
      data: { status: "PENDING", amountCents: totals.totalCents },
    });
    if (reopenKitchen) {
      await tx.orderStatusHistory.create({
        data: {
          tenantId: input.tenantId,
          orderId: order.id,
          fromStatus: order.status,
          toStatus: nextStatus,
          changedById: input.userId,
        },
      });
    }
    return next;
  });

  await writeAudit({
    action: "UPDATE",
    entity: "Order",
    entityId: order.id,
    tenantId: input.tenantId,
    userId: input.userId,
    metadata: { addedItems: added.length, tableNumber: order.tableNumber, source: "staff-add" },
  });
  return updated;
}

export async function openOrAppendTableSale(input: {
  tenantId: string;
  userId: string;
  idempotencyKey: string;
  tableNumber: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  items: StaffOrderItemInput[];
}) {
  const tableCount = await getTenantTableCount(input.tenantId);
  const tableNumber = assertSalonTableNumber(input.tableNumber, tableCount);
  const open = await findOpenTableOrder(input.tenantId, tableNumber);
  if (open) {
    return addItemsToOpenOrder({
      tenantId: input.tenantId,
      userId: input.userId,
      orderId: open.id,
      items: input.items,
      notes: input.notes,
    });
  }
  return createStaffOrder({
    tenantId: input.tenantId,
    userId: input.userId,
    idempotencyKey: input.idempotencyKey,
    tableNumber,
    customerName: input.customerName?.trim() || `Mesa ${tableNumber}`,
    customerPhone: input.customerPhone,
    fulfillment: "DINE_IN",
    paymentMethod: input.paymentMethod,
    notes: input.notes,
    items: input.items,
    confirmImmediately: true,
  });
}

export async function settleTableOrders(input: { tenantId: string; userId: string; tableNumber: string }) {
  const tableCount = await getTenantTableCount(input.tenantId);
  const tableNumber = assertSalonTableNumber(input.tableNumber, tableCount);
  const open = await prisma.order.findMany({
    where: {
      tenantId: input.tenantId,
      tableNumber,
      status: { notIn: ["DELIVERED", "CANCELLED"] },
    },
  });
  if (open.length === 0) throw new ConflictError("Essa mesa já está livre.");

  await prisma.$transaction(async (tx) => {
    for (const order of open) {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          status: "DELIVERED",
          deliveredAt: new Date(),
        },
      });
      await tx.payment.updateMany({
        where: { orderId: order.id, tenantId: input.tenantId },
        data: { status: "PAID" },
      });
      await tx.orderStatusHistory.create({
        data: {
          tenantId: input.tenantId,
          orderId: order.id,
          fromStatus: order.status,
          toStatus: "DELIVERED",
          changedById: input.userId,
        },
      });
    }
  });

  await writeAudit({
    action: "UPDATE",
    entity: "Order",
    tenantId: input.tenantId,
    userId: input.userId,
    metadata: { tableNumber, settled: open.length, source: "cashier-settle" },
  });
  return open.length;
}

export async function markOrderPaid(input: { tenantId: string; orderId: string; userId: string }) {
  const order = await prisma.order.findFirst({ where: { id: input.orderId, tenantId: input.tenantId } });
  if (!order) throw new NotFoundError("Pedido não encontrado.");
  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID" },
    }),
    prisma.payment.updateMany({
      where: { orderId: order.id, tenantId: input.tenantId },
      data: { status: "PAID" },
    }),
  ]);
  await writeAudit({
    action: "UPDATE",
    entity: "Payment",
    entityId: order.id,
    tenantId: input.tenantId,
    userId: input.userId,
    metadata: { paymentStatus: "PAID" },
  });
}

export async function listOpenFloorOrders(tenantId: string) {
  return prisma.order.findMany({
    where: {
      tenantId,
      status: { notIn: ["DELIVERED", "CANCELLED"] },
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}

function startOfLocalDay() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

export async function summarizeCashDay(tenantId: string) {
  const from = startOfLocalDay();
  const orders = await prisma.order.findMany({
    where: { tenantId, createdAt: { gte: from }, status: { not: "CANCELLED" } },
    orderBy: { createdAt: "desc" },
  });
  const open = orders.filter((order) => order.status !== "DELIVERED");
  const unpaid = orders.filter((order) => order.paymentStatus !== "PAID");
  const paid = orders.filter((order) => order.paymentStatus === "PAID");
  const byMethod: Record<string, { count: number; totalCents: number }> = {};
  for (const order of paid) {
    const bucket = byMethod[order.paymentMethod] ?? { count: 0, totalCents: 0 };
    bucket.count += 1;
    bucket.totalCents += order.totalCents;
    byMethod[order.paymentMethod] = bucket;
  }
  return {
    from,
    orders,
    openCount: open.length,
    unpaidCount: unpaid.length,
    paidCount: paid.length,
    paidTotalCents: paid.reduce((sum, order) => sum + order.totalCents, 0),
    byMethod,
  };
}

export async function closeCashRegister(input: { tenantId: string; userId: string }) {
  const summary = await summarizeCashDay(input.tenantId);
  if (summary.unpaidCount > 0) {
    throw new ConflictError("Ainda há pedidos sem receber. Receba ou cancele antes de fechar o caixa.");
  }
  await writeAudit({
    action: "UPDATE",
    entity: "CashRegister",
    tenantId: input.tenantId,
    userId: input.userId,
    metadata: {
      closedAt: new Date().toISOString(),
      paidCount: summary.paidCount,
      paidTotalCents: summary.paidTotalCents,
    },
  });
  return summary;
}
