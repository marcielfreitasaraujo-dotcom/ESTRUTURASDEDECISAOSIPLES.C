import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { formatBRL } from "@/lib/money";
import { digitsOnly } from "@/lib/phone";
import { FULFILLMENT_LABELS, PAYMENT_METHOD_LABELS } from "@/domain/ordering/status";
import {
  buildTimeline,
  computeEta,
  createTrackingToken,
  customerStatusHeadline,
  customerStatusLabel,
  delayTone,
  delayToneLabel,
  isActiveOrderStatus,
  isTrackingExpired,
  remainingMinutes,
  stageDurations,
  type DelayTone,
} from "@/domain/ordering/tracking";
import type { FulfillmentType, OrderStatus } from "@/domain/ordering/status";

const PUBLIC_SELECT = {
  id: true,
  tenantId: true,
  number: true,
  publicCode: true,
  trackingToken: true,
  status: true,
  fulfillment: true,
  rejected: true,
  cancelReason: true,
  customerName: true,
  customerPhone: true,
  street: true,
  addressNumber: true,
  complement: true,
  neighborhood: true,
  city: true,
  state: true,
  postalCode: true,
  reference: true,
  notes: true,
  couponCode: true,
  subtotalCents: true,
  discountCents: true,
  deliveryFeeCents: true,
  totalCents: true,
  paymentMethod: true,
  estimatedMinutes: true,
  estimatedMinMinutes: true,
  estimatedMaxMinutes: true,
  etaUpdatedAt: true,
  createdAt: true,
  confirmedAt: true,
  preparingAt: true,
  readyAt: true,
  outForDeliveryAt: true,
  deliveredAt: true,
  cancelledAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      name: true,
      quantity: true,
      unitPriceCents: true,
      totalCents: true,
      notes: true,
      customization: true,
      product: { select: { imageUrl: true } },
    },
  },
  statusHistory: {
    select: { toStatus: true, createdAt: true, metadata: true },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

export type TrackingOrder = Awaited<ReturnType<typeof prisma.order.findFirst<{ select: typeof PUBLIC_SELECT }>>>;

export async function isPlatformTrackingEnabled() {
  const flags = await prisma.featureFlag.findMany({
    where: { key: "order_tracking", scope: { in: ["platform", "PLATFORM"] } },
  });
  if (flags.length === 0) return true;
  return flags.every((flag) => flag.enabled);
}

export async function tenantTrackingReady(tenantId: string) {
  const enabled = await isPlatformTrackingEnabled();
  if (!enabled) return false;
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { trackingEnabled: true },
  });
  return Boolean(tenant?.trackingEnabled);
}

export async function trackingFieldsForTenant(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      estimatedMinutes: true,
      trackingMinMinutes: true,
      trackingMaxMinutes: true,
    },
  });
  return {
    trackingToken: createTrackingToken(),
    estimatedMinutes: tenant?.estimatedMinutes ?? 40,
    estimatedMinMinutes: tenant?.trackingMinMinutes ?? 30,
    estimatedMaxMinutes: tenant?.trackingMaxMinutes ?? 45,
  };
}

function itemExtras(customization: unknown): { name: string; priceCents?: number }[] {
  if (!customization || typeof customization !== "object") return [];
  const record = customization as { quote?: { flavorNames?: unknown; addons?: unknown } };
  const extras: { name: string; priceCents?: number }[] = [];
  const flavors = record.quote?.flavorNames;
  if (Array.isArray(flavors)) {
    for (const flavor of flavors) {
      if (typeof flavor === "string" && flavor.trim()) extras.push({ name: flavor });
    }
  }
  const addons = record.quote && "addons" in (record.quote as object) ? (record.quote as { addons?: unknown }).addons : null;
  if (Array.isArray(addons)) {
    for (const addon of addons) {
      if (!addon || typeof addon !== "object") continue;
      const row = addon as { name?: unknown; priceCents?: unknown };
      if (typeof row.name === "string") {
        extras.push({
          name: row.name,
          priceCents: typeof row.priceCents === "number" ? row.priceCents : undefined,
        });
      }
    }
  }
  return extras;
}

export function toPublicTracking(input: {
  order: NonNullable<TrackingOrder>;
  tenant: {
    name: string;
    slug: string;
    phone: string | null;
    whatsapp: string | null;
    timezone: string;
    trackingHistoryDays: number;
    trackingNotifyEnabled: boolean;
  };
  now?: Date;
}) {
  const { order, tenant } = input;
  const now = input.now ?? new Date();
  if (isTrackingExpired({ status: order.status, updatedAt: order.updatedAt, historyDays: tenant.trackingHistoryDays, now })) {
    return { expired: true as const, publicCode: order.publicCode };
  }

  const eta = computeEta(order.createdAt, order.estimatedMinutes);
  const remaining = remainingMinutes(eta, now);
  const tone: DelayTone = delayTone({
    status: order.status,
    createdAt: order.createdAt,
    estimatedMinutes: order.estimatedMinutes,
    now,
  });
  const late = tone === "late" && isActiveOrderStatus(order.status) && order.status !== "READY" && order.status !== "OUT_FOR_DELIVERY";

  return {
    expired: false as const,
    slug: tenant.slug,
    storeName: tenant.name,
    storePhone: tenant.phone,
    storeWhatsapp: tenant.whatsapp,
    publicCode: order.publicCode,
    token: order.trackingToken,
    status: order.status,
    statusLabel: customerStatusLabel(order.status, order.fulfillment, order.rejected),
    headline: customerStatusHeadline(order.status, order.fulfillment, order.rejected),
    fulfillment: order.fulfillment,
    fulfillmentLabel: FULFILLMENT_LABELS[order.fulfillment] ?? order.fulfillment,
    rejected: order.rejected,
    cancelReason: order.rejected || order.status === "CANCELLED" ? order.cancelReason : null,
    paymentMethod: order.paymentMethod,
    paymentLabel: PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod,
    couponCode: order.couponCode,
    notes: order.notes,
    estimatedMinutes: order.estimatedMinutes,
    estimatedMinMinutes: order.estimatedMinMinutes,
    estimatedMaxMinutes: order.estimatedMaxMinutes,
    eta: eta.toISOString(),
    remainingMinutes: remaining,
    delayTone: tone,
    delayLabel: delayToneLabel(tone),
    late,
    lateMessage: late ? "Seu pedido está levando um pouco mais de tempo que o previsto." : null,
    etaUpdated: Boolean(order.etaUpdatedAt),
    createdAt: order.createdAt.toISOString(),
    confirmedAt: order.confirmedAt?.toISOString() ?? null,
    preparingAt: order.preparingAt?.toISOString() ?? null,
    readyAt: order.readyAt?.toISOString() ?? null,
    outForDeliveryAt: order.outForDeliveryAt?.toISOString() ?? null,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    address:
      order.fulfillment === "DELIVERY"
        ? {
            street: order.street,
            number: order.addressNumber,
            complement: order.complement,
            neighborhood: order.neighborhood,
            city: order.city,
            state: order.state,
            postalCode: order.postalCode,
            reference: order.reference,
          }
        : null,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      totalCents: item.totalCents,
      notes: item.notes,
      imageUrl: item.product?.imageUrl ?? null,
      extras: itemExtras(item.customization),
    })),
    totals: {
      subtotalCents: order.subtotalCents,
      deliveryFeeCents: order.deliveryFeeCents,
      discountCents: order.discountCents,
      totalCents: order.totalCents,
      subtotalLabel: formatBRL(order.subtotalCents),
      deliveryLabel: formatBRL(order.deliveryFeeCents),
      discountLabel: formatBRL(order.discountCents),
      totalLabel: formatBRL(order.totalCents),
    },
    timeline: buildTimeline({
      status: order.status,
      fulfillment: order.fulfillment,
      rejected: order.rejected,
      createdAt: order.createdAt,
      confirmedAt: order.confirmedAt,
      preparingAt: order.preparingAt,
      readyAt: order.readyAt,
      outForDeliveryAt: order.outForDeliveryAt,
      deliveredAt: order.deliveredAt,
    }),
    stageMinutes: stageDurations(order.statusHistory),
    notifyEnabled: tenant.trackingNotifyEnabled,
  };
}

export type PublicTracking = ReturnType<typeof toPublicTracking>;

export async function getOrderByTrackingToken(token: string, slug?: string) {
  const order = await prisma.order.findFirst({
    where: { trackingToken: token },
    select: PUBLIC_SELECT,
  });
  if (!order) throw new NotFoundError("Esse link de acompanhamento não é válido.");
  const tenant = await prisma.tenant.findUnique({
    where: { id: order.tenantId },
    select: {
      name: true,
      slug: true,
      phone: true,
      whatsapp: true,
      timezone: true,
      trackingEnabled: true,
      trackingHistoryDays: true,
      trackingNotifyEnabled: true,
      status: true,
    },
  });
  if (!tenant || tenant.status === "SUSPENDED") throw new NotFoundError("Esse link de acompanhamento não é válido.");
  if (slug && tenant.slug !== slug) throw new NotFoundError("Esse link de acompanhamento não é válido.");
  const platformOn = await isPlatformTrackingEnabled();
  if (!platformOn || !tenant.trackingEnabled) {
    throw new NotFoundError("Este acompanhamento não está mais disponível.");
  }
  return { order, tenant };
}

export async function lookupOrderByCode(input: { tenantId: string; publicCode: string; phone: string }) {
  const code = input.publicCode.replace(/\D/g, "").padStart(4, "0");
  const phone = digitsOnly(input.phone);
  const order = await prisma.order.findFirst({
    where: { tenantId: input.tenantId, publicCode: code },
    select: PUBLIC_SELECT,
  });
  if (!order) throw new NotFoundError("Não encontramos esse pedido.");
  const orderPhone = digitsOnly(order.customerPhone);
  if (!phone || orderPhone !== phone) {
    throw new NotFoundError("Não encontramos esse pedido.");
  }
  return order;
}

export async function findActiveOrderForPhone(tenantId: string, phone: string) {
  const digits = digitsOnly(phone);
  if (digits.length < 10) return null;
  return prisma.order.findFirst({
    where: {
      tenantId,
      customerPhone: { contains: digits.slice(-8) },
      status: { notIn: ["DELIVERED", "CANCELLED"] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      publicCode: true,
      trackingToken: true,
      status: true,
      fulfillment: true,
      estimatedMinutes: true,
      createdAt: true,
      rejected: true,
    },
  });
}

export async function listCustomerOrders(tenantId: string, phone: string) {
  const digits = digitsOnly(phone);
  if (digits.length < 10) return [];
  return prisma.order.findMany({
    where: {
      tenantId,
      customerPhone: { contains: digits.slice(-8) },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      publicCode: true,
      trackingToken: true,
      status: true,
      fulfillment: true,
      totalCents: true,
      createdAt: true,
      rejected: true,
    },
  });
}

export async function trackingBoardCounts(tenantId: string, now = new Date()) {
  const open = await prisma.order.findMany({
    where: { tenantId, status: { notIn: ["DELIVERED", "CANCELLED"] } },
    select: {
      status: true,
      fulfillment: true,
      createdAt: true,
      estimatedMinutes: true,
    },
  });
  const late = open.filter(
    (order) =>
      delayTone({
        status: order.status,
        createdAt: order.createdAt,
        estimatedMinutes: order.estimatedMinutes,
        now,
      }) === "late",
  ).length;
  return {
    received: open.filter((order) => order.status === "PENDING").length,
    preparing: open.filter((order) => order.status === "PREPARING" || order.status === "CONFIRMED").length,
    ready: open.filter((order) => order.status === "READY").length,
    delivering: open.filter((order) => order.status === "OUT_FOR_DELIVERY").length,
    late,
  };
}

export function staffDelayMeta(order: {
  status: OrderStatus;
  createdAt: Date;
  estimatedMinutes: number;
  fulfillment: FulfillmentType;
}) {
  const tone = delayTone(order);
  return {
    delayTone: tone,
    delayLabel: delayToneLabel(tone),
  };
}
