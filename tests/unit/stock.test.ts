import { describe, expect, it } from "vitest";
import { clampStockQuantity, isSoldOut } from "@/domain/catalog/stock";

describe("isSoldOut", () => {
  it("marca esgotado quando available é false", () => {
    expect(isSoldOut({ available: false, trackInventory: false, stockQuantity: 12 })).toBe(true);
  });

  it("marca esgotado quando o estoque controlado chega a zero", () => {
    expect(isSoldOut({ available: true, trackInventory: true, stockQuantity: 0 })).toBe(true);
    expect(isSoldOut({ available: true, trackInventory: true, stockQuantity: null })).toBe(true);
  });

  it("mantém disponível sem controle de estoque ou com quantidade positiva", () => {
    expect(isSoldOut({ available: true, trackInventory: false, stockQuantity: null })).toBe(false);
    expect(isSoldOut({ available: true, trackInventory: true, stockQuantity: 3 })).toBe(false);
  });
});

describe("clampStockQuantity", () => {
  it("arredonda para baixo e nunca fica negativo", () => {
    expect(clampStockQuantity(4.9)).toBe(4);
    expect(clampStockQuantity(-2)).toBe(0);
    expect(clampStockQuantity(Number.NaN)).toBe(0);
  });
});
