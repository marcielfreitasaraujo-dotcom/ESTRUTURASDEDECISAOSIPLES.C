import { describe, expect, it } from "vitest";
import { calculateCheckoutTotals } from "@/domain/ordering/checkout";
import { canTransition } from "@/domain/ordering/status";

describe("checkout totals", () => {
  it("recalcula total no servidor", () => {
    const totals = calculateCheckoutTotals({
      items: [
        { name: "Pizza", quantity: 1, unitPriceCents: 6490 },
        { name: "Refri", quantity: 2, unitPriceCents: 1400 },
      ],
      discountCents: 500,
      deliveryFeeCents: 700,
    });
    expect(totals.subtotalCents).toBe(9290);
    expect(totals.totalCents).toBe(9490);
  });
});

describe("order transitions", () => {
  it("não entrega um pedido ainda pendente", () => {
    expect(canTransition("PENDING", "DELIVERED")).toBe(false);
    expect(canTransition("READY", "OUT_FOR_DELIVERY")).toBe(true);
  });
});
