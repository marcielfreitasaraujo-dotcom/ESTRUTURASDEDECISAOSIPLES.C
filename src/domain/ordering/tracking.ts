import { randomBytes } from "node:crypto";
import type { FulfillmentType, OrderStatus } from "@/domain/ordering/status";

export const TRACKING_EVENTS = [
  "PEDIDO_RECEBIDO",
  "PEDIDO_CONFIRMADO",
  "PEDIDO_EM_PREPARO",
  "PEDIDO_PRONTO",
  "PEDIDO_SAIU_ENTREGA",
  "PEDIDO_ENTREGUE",
  "PEDIDO_CANCELADO",
  "PEDIDO_RECUSADO",
  "ETA_ATUALIZADA",
] as const;

export type TrackingEvent = (typeof TRACKING_EVENTS)[number];
export type DelayTone = "on_time" | "near" | "late";
export type TimelineState = "done" | "current" | "upcoming";

export type TrackingStep = {
  key: OrderStatus;
  label: string;
};

export function createTrackingToken(): string {
  return randomBytes(24).toString("base64url");
}

export function assertFulfillmentAllowed(
  fulfillment: FulfillmentType,
  flags: { trackingAllowPickup: boolean; trackingAllowDelivery: boolean },
) {
  if (fulfillment === "DELIVERY" && !flags.trackingAllowDelivery) {
    throw new Error("Esta loja não está aceitando entrega no momento.");
  }
  if (fulfillment === "PICKUP" && !flags.trackingAllowPickup) {
    throw new Error("Esta loja não está aceitando retirada no momento.");
  }
}

export function trackingSteps(fulfillment: FulfillmentType): TrackingStep[] {
  if (fulfillment === "DELIVERY") {
    return [
      { key: "PENDING", label: "Pedido recebido" },
      { key: "CONFIRMED", label: "Pedido confirmado" },
      { key: "PREPARING", label: "Em preparo" },
      { key: "READY", label: "Pedido pronto" },
      { key: "OUT_FOR_DELIVERY", label: "Saiu para entrega" },
      { key: "DELIVERED", label: "Entregue" },
    ];
  }
  return [
    { key: "PENDING", label: "Pedido recebido" },
    { key: "CONFIRMED", label: "Pedido confirmado" },
    { key: "PREPARING", label: "Em preparo" },
    { key: "READY", label: "Pronto para retirada" },
    { key: "DELIVERED", label: "Retirado" },
  ];
}

export function customerStatusLabel(
  status: OrderStatus,
  fulfillment: FulfillmentType,
  rejected = false,
): string {
  if (rejected || status === "CANCELLED") {
    return rejected ? "Não aceito" : "Cancelado";
  }
  if (status === "DELIVERED") {
    return fulfillment === "DELIVERY" ? "Entregue" : fulfillment === "PICKUP" ? "Retirado" : "Concluído";
  }
  if (status === "READY" && fulfillment !== "DELIVERY") return "Pronto para retirada";
  if (status === "OUT_FOR_DELIVERY") return "Saiu para entrega";
  if (status === "PREPARING") return "Em preparo";
  if (status === "CONFIRMED") return "Confirmado";
  if (status === "PENDING") return "Recebido";
  return "Pronto";
}

export function customerStatusHeadline(
  status: OrderStatus,
  fulfillment: FulfillmentType,
  rejected = false,
): string {
  if (rejected) return "Infelizmente o estabelecimento não conseguiu aceitar este pedido.";
  if (status === "CANCELLED") return "Este pedido foi cancelado pelo estabelecimento.";
  if (status === "DELIVERED") {
    return fulfillment === "DELIVERY" ? "Seu pedido foi entregue!" : "Pedido concluído. Obrigado por pedir com a gente!";
  }
  if (status === "OUT_FOR_DELIVERY") return "Seu pedido saiu para entrega!";
  if (status === "READY") {
    return fulfillment === "DELIVERY" ? "Seu pedido está pronto!" : "Seu pedido está pronto para retirada!";
  }
  if (status === "PREPARING") return "Seu pedido está sendo preparado.";
  if (status === "CONFIRMED") return "Seu pedido foi confirmado!";
  return "Recebemos seu pedido e já estamos enviando para o estabelecimento.";
}

export function statusNotification(status: OrderStatus, rejected = false): string | null {
  if (rejected) return "O estabelecimento não conseguiu aceitar este pedido.";
  if (status === "CONFIRMED") return "Seu pedido foi confirmado!";
  if (status === "PREPARING") return "Seu pedido entrou em preparo!";
  if (status === "READY") return "Seu pedido está pronto!";
  if (status === "OUT_FOR_DELIVERY") return "Seu pedido saiu para entrega!";
  if (status === "DELIVERED") return "Seu pedido foi entregue!";
  if (status === "CANCELLED") return "Seu pedido foi cancelado.";
  return null;
}

export function eventForStatus(status: OrderStatus, rejected = false): TrackingEvent {
  if (rejected) return "PEDIDO_RECUSADO";
  if (status === "CONFIRMED") return "PEDIDO_CONFIRMADO";
  if (status === "PREPARING") return "PEDIDO_EM_PREPARO";
  if (status === "READY") return "PEDIDO_PRONTO";
  if (status === "OUT_FOR_DELIVERY") return "PEDIDO_SAIU_ENTREGA";
  if (status === "DELIVERED") return "PEDIDO_ENTREGUE";
  if (status === "CANCELLED") return "PEDIDO_CANCELADO";
  return "PEDIDO_RECEBIDO";
}

export function isActiveOrderStatus(status: OrderStatus): boolean {
  return status !== "DELIVERED" && status !== "CANCELLED";
}

export function computeEta(createdAt: Date, estimatedMinutes: number): Date {
  return new Date(createdAt.getTime() + Math.max(1, estimatedMinutes) * 60_000);
}

export function remainingMinutes(eta: Date, now: Date): number {
  return Math.round((eta.getTime() - now.getTime()) / 60_000);
}

export function delayTone(input: {
  status: OrderStatus;
  createdAt: Date;
  estimatedMinutes: number;
  now?: Date;
}): DelayTone {
  if (!isActiveOrderStatus(input.status) || input.status === "READY" || input.status === "OUT_FOR_DELIVERY") {
    return "on_time";
  }
  const now = input.now ?? new Date();
  const eta = computeEta(input.createdAt, input.estimatedMinutes);
  const remaining = remainingMinutes(eta, now);
  if (remaining <= 0) return "late";
  if (remaining <= 5) return "near";
  return "on_time";
}

export function delayToneLabel(tone: DelayTone): string {
  if (tone === "late") return "Atrasado";
  if (tone === "near") return "Próximo do limite";
  return "Dentro do prazo";
}

export function isTrackingExpired(input: {
  status: OrderStatus;
  updatedAt: Date;
  historyDays: number;
  now?: Date;
}): boolean {
  if (isActiveOrderStatus(input.status)) return false;
  const now = input.now ?? new Date();
  const limit = input.historyDays * 86_400_000;
  return now.getTime() - input.updatedAt.getTime() > limit;
}

export function nextStaffStatus(status: OrderStatus, fulfillment: FulfillmentType): OrderStatus | null {
  if (status === "PENDING") return "CONFIRMED";
  if (status === "CONFIRMED") return "PREPARING";
  if (status === "PREPARING") return "READY";
  if (status === "READY") return fulfillment === "DELIVERY" ? "OUT_FOR_DELIVERY" : "DELIVERED";
  if (status === "OUT_FOR_DELIVERY") return "DELIVERED";
  return null;
}

export function nextStaffLabel(status: OrderStatus, fulfillment: FulfillmentType): string | null {
  const next = nextStaffStatus(status, fulfillment);
  if (!next) return null;
  if (status === "PENDING") return "Confirmar";
  if (status === "CONFIRMED") return "Iniciar preparo";
  if (status === "PREPARING") return "Pedido pronto";
  if (status === "READY") return fulfillment === "DELIVERY" ? "Saiu para entrega" : "Retirado";
  if (status === "OUT_FOR_DELIVERY") return "Entregue";
  return "Avançar";
}

export type TimelineItem = {
  key: OrderStatus;
  label: string;
  state: TimelineState;
  at: string | null;
};

const STATUS_RANK: Record<OrderStatus, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PREPARING: 2,
  READY: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
  CANCELLED: -1,
};

export function buildTimeline(input: {
  status: OrderStatus;
  fulfillment: FulfillmentType;
  rejected?: boolean;
  createdAt: Date;
  confirmedAt: Date | null;
  preparingAt: Date | null;
  readyAt: Date | null;
  outForDeliveryAt?: Date | null;
  deliveredAt: Date | null;
}): TimelineItem[] {
  const steps = trackingSteps(input.fulfillment);
  const currentRank = STATUS_RANK[input.status] ?? 0;
  const times: Partial<Record<OrderStatus, Date | null>> = {
    PENDING: input.createdAt,
    CONFIRMED: input.confirmedAt,
    PREPARING: input.preparingAt,
    READY: input.readyAt,
    OUT_FOR_DELIVERY: input.outForDeliveryAt ?? null,
    DELIVERED: input.deliveredAt,
  };
  if (input.status === "CANCELLED" || input.rejected) {
    return steps.map((step) => {
      const at = times[step.key] ?? null;
      return {
        ...step,
        state: at ? "done" : "upcoming",
        at: at ? at.toISOString() : null,
      };
    });
  }
  return steps.map((step) => {
    const rank = STATUS_RANK[step.key];
    let state: TimelineState = "upcoming";
    if (rank < currentRank) state = "done";
    else if (rank === currentRank) state = "current";
    const at = times[step.key] ?? (state === "current" ? new Date() : null);
    return {
      ...step,
      state,
      at: at ? at.toISOString() : null,
    };
  });
}

export function formatClockInZone(date: Date, timeZone = "America/Sao_Paulo"): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

export function trackingLink(baseUrl: string, slug: string, token: string): string {
  return `${baseUrl.replace(/\/$/, "")}/loja/${slug}/acompanhar/${token}`;
}

export function buildWhatsAppMessage(input: {
  event: TrackingEvent;
  storeName: string;
  publicCode: string;
  totalLabel: string;
  estimatedMinutes: number;
  link: string;
}): string {
  if (input.event === "ETA_ATUALIZADA") {
    return [
      `⏱️ Atualização — ${input.storeName}`,
      "",
      `Pedido #${input.publicCode}`,
      "Devido ao volume de pedidos, sua previsão foi atualizada.",
      `⏱️ Novo tempo estimado: ${input.estimatedMinutes} minutos`,
      "",
      "Acompanhe seu pedido:",
      input.link,
    ].join("\n");
  }
  if (input.event === "PEDIDO_RECUSADO") {
    return [
      `🍕 ${input.storeName}`,
      "",
      `Pedido #${input.publicCode}`,
      "Infelizmente o estabelecimento não conseguiu aceitar este pedido.",
    ].join("\n");
  }
  if (input.event === "PEDIDO_CANCELADO") {
    return [
      `🍕 ${input.storeName}`,
      "",
      `Pedido #${input.publicCode}`,
      "Este pedido foi cancelado pelo estabelecimento.",
      "",
      "Acompanhe:",
      input.link,
    ].join("\n");
  }
  const headlines: Record<TrackingEvent, string> = {
    PEDIDO_RECEBIDO: "Seu pedido foi recebido com sucesso!",
    PEDIDO_CONFIRMADO: "Seu pedido foi confirmado!",
    PEDIDO_EM_PREPARO: "Seu pedido entrou em preparo!",
    PEDIDO_PRONTO: "Seu pedido está pronto!",
    PEDIDO_SAIU_ENTREGA: "Seu pedido saiu para entrega!",
    PEDIDO_ENTREGUE: "Seu pedido foi entregue!",
    PEDIDO_CANCELADO: "Pedido cancelado",
    PEDIDO_RECUSADO: "Pedido não aceito",
    ETA_ATUALIZADA: "Previsão atualizada",
  };
  return [
    `🍕 Olá!`,
    "",
    headlines[input.event],
    "",
    `📦 Pedido: #${input.publicCode}`,
    `💰 Total: ${input.totalLabel}`,
    `⏱️ Tempo estimado: ${input.estimatedMinutes} minutos`,
    "",
    "Você pode acompanhar seu pedido pelo link:",
    input.link,
    "",
    `Obrigado por pedir com a gente! ❤️`,
  ].join("\n");
}

export function stageDurations(history: { toStatus: OrderStatus; createdAt: Date }[]): Record<string, number> {
  const sorted = [...history].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const result: Record<string, number> = {};
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index];
    const next = sorted[index + 1];
    result[current.toStatus] = Math.max(
      0,
      Math.round((next.createdAt.getTime() - current.createdAt.getTime()) / 60_000),
    );
  }
  return result;
}
