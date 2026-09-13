import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { publicAppUrl } from "@/lib/env";
import { writeAudit } from "@/server/audit";
import { NullWhatsAppProvider, type WhatsAppProvider } from "@/server/providers/whatsapp";
import {
  buildStoreWhatsAppOrder,
  buildWhatsAppMessage,
  eventForStatus,
  formatDeliveryAddress,
  trackingLink,
  type TrackingEvent,
} from "@/domain/ordering/tracking";
import { FULFILLMENT_LABELS, PAYMENT_METHOD_LABELS } from "@/domain/ordering/status";
import { digitsOnly } from "@/lib/phone";
import type { OrderStatus } from "@/domain/ordering/status";

const TEST_PLACEHOLDER = "Número de teste configurável nas configurações da loja.";

export function getWhatsAppProvider(): WhatsAppProvider {
  return new NullWhatsAppProvider();
}

export function trackingWhatsAppDigits(value: string | null | undefined): string {
  return digitsOnly(value ?? "");
}

export async function dispatchOrderWhatsApp(input: {
  tenantId: string;
  orderId?: string;
  event: TrackingEvent;
  to: string;
  publicCode: string;
  totalCents: number;
  estimatedMinutes: number;
  storeName: string;
  slug: string;
  token: string;
  enabled: boolean;
  destination: string | null;
  address?: string | null;
  body?: string;
}) {
  const to = trackingWhatsAppDigits(input.destination) || trackingWhatsAppDigits(input.to);
  const body =
    input.body ??
    buildWhatsAppMessage({
      event: input.event,
      storeName: input.storeName,
      publicCode: input.publicCode,
      totalLabel: formatBRL(input.totalCents),
      estimatedMinutes: input.estimatedMinutes,
      link: trackingLink(publicAppUrl(), input.slug, input.token),
      address: input.address,
    });

  if (!input.enabled || !to) {
    await prisma.whatsAppDispatch.create({
      data: {
        tenantId: input.tenantId,
        orderId: input.orderId,
        event: input.event,
        to: to || "nao-configurado",
        body,
        status: "SKIPPED",
        error: input.enabled ? "Número de WhatsApp não configurado." : "Envio de WhatsApp desligado.",
      },
    });
    return { status: "SKIPPED" as const };
  }

  const row = await prisma.whatsAppDispatch.create({
    data: {
      tenantId: input.tenantId,
      orderId: input.orderId,
      event: input.event,
      to,
      body,
      status: "QUEUED",
    },
  });

  try {
    await getWhatsAppProvider().send({ to, text: body });
    await prisma.whatsAppDispatch.update({
      where: { id: row.id },
      data: { status: "SENT" },
    });
    await writeAudit({
      action: "UPDATE",
      entity: "WhatsAppDispatch",
      entityId: row.id,
      tenantId: input.tenantId,
      metadata: { event: input.event, orderId: input.orderId, to },
    });
    return { status: "SENT" as const, body, to };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha no envio.";
    await prisma.whatsAppDispatch.update({
      where: { id: row.id },
      data: { status: "FAILED", error: message },
    });
    return { status: "FAILED" as const, error: message };
  }
}

export async function notifyOrderStatusWhatsApp(input: {
  tenantId: string;
  orderId: string;
  status: OrderStatus;
  rejected?: boolean;
}) {
  const order = await prisma.order.findFirst({
    where: { id: input.orderId, tenantId: input.tenantId },
    include: { tenant: true },
  });
  if (!order) return;
  const address = formatDeliveryAddress({
    street: order.street,
    number: order.addressNumber,
    complement: order.complement,
    neighborhood: order.neighborhood,
    city: order.city,
    state: order.state,
    reference: order.reference,
  });
  await dispatchOrderWhatsApp({
    tenantId: order.tenantId,
    orderId: order.id,
    event: eventForStatus(input.status, input.rejected ?? order.rejected),
    to: order.customerPhone,
    publicCode: order.publicCode,
    totalCents: order.totalCents,
    estimatedMinutes: order.estimatedMinutes,
    storeName: order.tenant.name,
    slug: order.tenant.slug,
    token: order.trackingToken,
    enabled: order.tenant.trackingWhatsappEnabled && order.tenant.trackingNotifyEnabled,
    destination: order.customerPhone,
    address,
  });
}

export function storeWhatsAppNumber(tenant: { trackingWhatsappNumber?: string | null; whatsapp?: string | null }) {
  return trackingWhatsAppDigits(tenant.trackingWhatsappNumber) || trackingWhatsAppDigits(tenant.whatsapp);
}

export function storeNewOrderWhatsAppText(order: {
  publicCode: string;
  customerName: string;
  customerPhone: string;
  fulfillment: keyof typeof FULFILLMENT_LABELS;
  paymentMethod: keyof typeof PAYMENT_METHOD_LABELS;
  totalCents: number;
  estimatedMinutes: number;
  street?: string | null;
  addressNumber?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  reference?: string | null;
  notes?: string | null;
  trackingToken: string;
  items: { quantity: number; name: string }[];
  tenant: { name: string; slug: string };
}) {
  return buildStoreWhatsAppOrder({
    storeName: order.tenant.name,
    publicCode: order.publicCode,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    fulfillmentLabel: FULFILLMENT_LABELS[order.fulfillment] ?? order.fulfillment,
    paymentLabel: PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod,
    totalLabel: formatBRL(order.totalCents),
    estimatedMinutes: order.estimatedMinutes,
    address: formatDeliveryAddress({
      street: order.street,
      number: order.addressNumber,
      complement: order.complement,
      neighborhood: order.neighborhood,
      city: order.city,
      state: order.state,
      reference: order.reference,
    }),
    items: order.items,
    notes: order.notes,
    link: trackingLink(publicAppUrl(), order.tenant.slug, order.trackingToken),
  });
}

export async function notifyStoreNewOrderWhatsApp(input: { tenantId: string; orderId: string }) {
  const order = await prisma.order.findFirst({
    where: { id: input.orderId, tenantId: input.tenantId },
    include: { tenant: true, items: { select: { quantity: true, name: true } } },
  });
  if (!order) return;
  const to = storeWhatsAppNumber(order.tenant);
  const body = storeNewOrderWhatsAppText(order);
  await dispatchOrderWhatsApp({
    tenantId: order.tenantId,
    orderId: order.id,
    event: "PEDIDO_RECEBIDO",
    to: to || order.customerPhone,
    publicCode: order.publicCode,
    totalCents: order.totalCents,
    estimatedMinutes: order.estimatedMinutes,
    storeName: order.tenant.name,
    slug: order.tenant.slug,
    token: order.trackingToken,
    enabled: order.tenant.trackingWhatsappEnabled,
    destination: to,
    body,
    address: formatDeliveryAddress({
      street: order.street,
      number: order.addressNumber,
      complement: order.complement,
      neighborhood: order.neighborhood,
      city: order.city,
      state: order.state,
      reference: order.reference,
    }),
  });
}

export async function sendTrackingTestMessage(input: {
  tenantId: string;
  userId: string;
  to?: string;
}) {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: input.tenantId } });
  const to = trackingWhatsAppDigits(input.to || tenant.trackingWhatsappNumber);
  if (!to) {
    throw new Error(`Informe o número do WhatsApp. ${TEST_PLACEHOLDER}`);
  }
  const sample = await prisma.order.findFirst({
    where: { tenantId: input.tenantId },
    orderBy: { createdAt: "desc" },
    select: { publicCode: true, trackingToken: true, totalCents: true, estimatedMinutes: true, id: true },
  });
  return dispatchOrderWhatsApp({
    tenantId: tenant.id,
    orderId: sample?.id,
    event: "PEDIDO_RECEBIDO",
    to,
    publicCode: sample?.publicCode ?? "1025",
    totalCents: sample?.totalCents ?? 8300,
    estimatedMinutes: sample?.estimatedMinutes ?? tenant.estimatedMinutes,
    storeName: tenant.name,
    slug: tenant.slug,
    token: sample?.trackingToken ?? "teste",
    enabled: true,
    destination: to,
  });
}

export async function listWhatsAppDispatches(tenantId: string | null, take = 40) {
  return prisma.whatsAppDispatch.findMany({
    where: tenantId ? { tenantId } : undefined,
    orderBy: { createdAt: "desc" },
    take,
    include: { order: { select: { publicCode: true } } },
  });
}
