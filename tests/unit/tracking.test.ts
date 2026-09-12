import { describe, expect, it } from "vitest";
import {
  assertFulfillmentAllowed,
  buildTimeline,
  buildWhatsAppMessage,
  computeEta,
  createTrackingToken,
  customerStatusLabel,
  delayTone,
  isTrackingExpired,
  nextStaffStatus,
  remainingMinutes,
  trackingLink,
  trackingSteps,
} from "@/domain/ordering/tracking";

describe("token e timeline", () => {
  it("gera tokens únicos e sem caracteres perigosos na URL", () => {
    const tokens = new Set(Array.from({ length: 20 }, () => createTrackingToken()));
    expect(tokens.size).toBe(20);
    for (const token of tokens) {
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(token.length).toBeGreaterThan(20);
    }
  });

  it("esconde saída para entrega na retirada", () => {
    expect(trackingSteps("PICKUP").map((step) => step.key)).toEqual([
      "PENDING",
      "CONFIRMED",
      "PREPARING",
      "READY",
      "DELIVERED",
    ]);
    expect(trackingSteps("DELIVERY").map((step) => step.key)).toContain("OUT_FOR_DELIVERY");
    expect(customerStatusLabel("READY", "PICKUP")).toBe("Pronto para retirada");
    expect(customerStatusLabel("READY", "DELIVERY")).toBe("Pronto");
    expect(customerStatusLabel("CANCELLED", "DELIVERY", true)).toBe("Não aceito");
  });

  it("monta a timeline com o passo atual", () => {
    const createdAt = new Date("2026-09-12T12:00:00.000Z");
    const timeline = buildTimeline({
      status: "PREPARING",
      fulfillment: "DELIVERY",
      createdAt,
      confirmedAt: new Date("2026-09-12T12:02:00.000Z"),
      preparingAt: new Date("2026-09-12T12:05:00.000Z"),
      readyAt: null,
      outForDeliveryAt: null,
      deliveredAt: null,
    });
    expect(timeline.find((step) => step.key === "PREPARING")?.state).toBe("current");
    expect(timeline.find((step) => step.key === "CONFIRMED")?.state).toBe("done");
    expect(timeline.find((step) => step.key === "OUT_FOR_DELIVERY")?.state).toBe("upcoming");
  });
});

describe("tempo e atraso", () => {
  it("calcula ETA e minutos restantes", () => {
    const createdAt = new Date("2026-09-12T12:00:00.000Z");
    const eta = computeEta(createdAt, 40);
    expect(eta.toISOString()).toBe("2026-09-12T12:40:00.000Z");
    expect(remainingMinutes(eta, new Date("2026-09-12T12:10:00.000Z"))).toBe(30);
  });

  it("marca atraso perto e depois do prazo", () => {
    const createdAt = new Date("2026-09-12T12:00:00.000Z");
    expect(
      delayTone({
        status: "PREPARING",
        createdAt,
        estimatedMinutes: 40,
        now: new Date("2026-09-12T12:10:00.000Z"),
      }),
    ).toBe("on_time");
    expect(
      delayTone({
        status: "PREPARING",
        createdAt,
        estimatedMinutes: 40,
        now: new Date("2026-09-12T12:37:00.000Z"),
      }),
    ).toBe("near");
    expect(
      delayTone({
        status: "PREPARING",
        createdAt,
        estimatedMinutes: 40,
        now: new Date("2026-09-12T12:41:00.000Z"),
      }),
    ).toBe("late");
    expect(
      delayTone({
        status: "READY",
        createdAt,
        estimatedMinutes: 10,
        now: new Date("2026-09-12T13:00:00.000Z"),
      }),
    ).toBe("on_time");
  });

  it("expira só pedido finalizado depois do histórico", () => {
    expect(
      isTrackingExpired({
        status: "DELIVERED",
        updatedAt: new Date("2026-08-01T00:00:00.000Z"),
        historyDays: 14,
        now: new Date("2026-09-12T00:00:00.000Z"),
      }),
    ).toBe(true);
    expect(
      isTrackingExpired({
        status: "PREPARING",
        updatedAt: new Date("2026-08-01T00:00:00.000Z"),
        historyDays: 14,
        now: new Date("2026-09-12T00:00:00.000Z"),
      }),
    ).toBe(false);
  });
});

describe("equipe e WhatsApp", () => {
  it("avança retirada direto para entregue quando está pronto", () => {
    expect(nextStaffStatus("READY", "PICKUP")).toBe("DELIVERED");
    expect(nextStaffStatus("READY", "DELIVERY")).toBe("OUT_FOR_DELIVERY");
    expect(nextStaffStatus("OUT_FOR_DELIVERY", "DELIVERY")).toBe("DELIVERED");
  });

  it("monta a mensagem sem número hardcoded", () => {
    const message = buildWhatsAppMessage({
      event: "PEDIDO_CONFIRMADO",
      storeName: "Central da Pizza",
      publicCode: "1025",
      totalLabel: "R$ 83,00",
      estimatedMinutes: 40,
      link: trackingLink("https://app.exemplo", "central-da-pizza", "token-abc"),
    });
    expect(message).toContain("Pedido: #1025");
    expect(message).toContain("https://app.exemplo/loja/central-da-pizza/acompanhar/token-abc");
    expect(message).not.toMatch(/9991677463|91 9 9167/);
  });

  it("bloqueia retirada ou entrega desligada", () => {
    expect(() =>
      assertFulfillmentAllowed("DELIVERY", { trackingAllowPickup: true, trackingAllowDelivery: false }),
    ).toThrow(/entrega/);
    expect(() =>
      assertFulfillmentAllowed("PICKUP", { trackingAllowPickup: false, trackingAllowDelivery: true }),
    ).toThrow(/retirada/);
    expect(() =>
      assertFulfillmentAllowed("DINE_IN", { trackingAllowPickup: false, trackingAllowDelivery: false }),
    ).not.toThrow();
  });
});
