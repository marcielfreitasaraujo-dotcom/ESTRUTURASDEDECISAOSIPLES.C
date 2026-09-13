import { describe, expect, it } from "vitest";
import { evaluateCoupon } from "@/domain/coupons/evaluate";

describe("evaluateCoupon", () => {
  const now = new Date("2026-09-09T12:00:00Z");

  it("aplica percentual só depois do mínimo", () => {
    const coupon = {
      code: "BEMVINDO10",
      type: "PERCENTAGE" as const,
      value: 10,
      minSubtotalCents: 4000,
      active: true,
      firstOrderOnly: true,
    };
    const denied = evaluateCoupon(coupon, {
      now,
      subtotalCents: 2000,
      deliveryFeeCents: 500,
      isFirstOrder: true,
    });
    expect(denied.ok).toBe(false);
    const ok = evaluateCoupon(coupon, {
      now,
      subtotalCents: 5000,
      deliveryFeeCents: 500,
      isFirstOrder: true,
    });
    expect(ok).toEqual({ ok: true, discountCents: 500, deliveryFeeCents: 500 });
  });

  it("zera taxa em FREE_DELIVERY", () => {
    const result = evaluateCoupon(
      {
        code: "FRETE",
        type: "FREE_DELIVERY",
        value: 0,
        minSubtotalCents: 0,
        active: true,
        firstOrderOnly: false,
      },
      { now, subtotalCents: 1000, deliveryFeeCents: 800, isFirstOrder: false },
    );
    expect(result).toEqual({ ok: true, discountCents: 0, deliveryFeeCents: 0 });
  });
});
