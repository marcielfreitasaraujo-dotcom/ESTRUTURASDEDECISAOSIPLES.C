import { describe, expect, it } from "vitest";
import {
  assertTendersCoverTotal,
  changeCents,
  differenceCents,
  differenceLabel,
  discountWithinLimit,
  expectedCashCents,
  splitEqually,
} from "@/domain/cash/math";

describe("caixa: dinheiro e conferência", () => {
  it("calcula o troco e recusa valor menor que o total", () => {
    expect(changeCents(8790, 10000)).toBe(1210);
    expect(() => changeCents(8790, 8000)).toThrow(/inferior ao total/);
  });

  it("fecha pagamento misto só quando a soma bate o total", () => {
    expect(() => assertTendersCoverTotal([{ amountCents: 4000 }, { amountCents: 6000 }], 10000)).not.toThrow();
    expect(() => assertTendersCoverTotal([{ amountCents: 4000 }], 10000)).toThrow(/fechar o total/);
  });

  it("divide a conta entre pessoas sem perder centavos", () => {
    expect(splitEqually(20000, 4)).toEqual([5000, 5000, 5000, 5000]);
    expect(splitEqually(10001, 2)).toEqual([5001, 5000]);
  });

  it("calcula dinheiro esperado e a diferença", () => {
    const expected = expectedCashCents({
      openingCents: 20000,
      cashSalesCents: 80000,
      supplyCents: 10000,
      sangriaCents: 20000,
      expenseCents: 5000,
    });
    expect(expected).toBe(85000);
    expect(differenceCents(85000, 85000)).toBe(0);
    expect(differenceLabel(0).kind).toBe("ok");
    expect(differenceLabel(-2000).kind).toBe("shortage");
    expect(differenceLabel(2000).kind).toBe("overage");
  });

  it("respeita o limite de desconto do caixa", () => {
    expect(discountWithinLimit(10000, 500, 5)).toBe(true);
    expect(discountWithinLimit(10000, 1000, 5)).toBe(false);
    expect(discountWithinLimit(10000, 100, 0)).toBe(false);
  });
});
