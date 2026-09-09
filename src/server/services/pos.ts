import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { quotePizza } from "@/domain/catalog/pizza-pricing";
import { calculateCheckoutTotals } from "@/domain/ordering/checkout";
import { writeAudit } from "@/server/audit";
import type { FulfillmentType, PaymentMethod, Prisma } from "@prisma/client";

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

  const lines: {
    productId: string | null;
    name: string;
    quantity: number;
    unitPriceCents: number;
    notes?: string;
    customization?: Prisma.InputJsonValue;
  }[] = [];

  for (const item of input.items) {
    if (item.quantity < 1) continue;
    if (item.kind === "PRODUCT") {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, tenantId: input.tenantId, active: true, archived: false },
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
      where: { id: item.sizeId, tenantId: input.tenantId, active: true },
      include: { flavorPrices: true },
    });
    if (!size) throw new NotFoundError("Tamanho não encontrado.");
    const flavors = await prisma.pizzaFlavor.findMany({
      where: { id: { in: item.flavorIds }, tenantId: input.tenantId, active: true },
      include: { prices: true },
    });
    if (flavors.length === 0) throw new Error("Selecione ao menos um sabor.");
    const crust = item.crustId
      ? await prisma.crust.findFirst({ where: { id: item.crustId, tenantId: input.tenantId, active: true } })
      : null;
    const addons = item.addonIds?.length
      ? await prisma.addon.findMany({ where: { id: { in: item.addonIds }, tenantId: input.tenantId, active: true } })
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
