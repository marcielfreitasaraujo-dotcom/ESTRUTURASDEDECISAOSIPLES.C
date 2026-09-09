import { describe, expect, it } from "vitest";
import { quotePizza } from "@/domain/catalog/pizza-pricing";

describe("quotePizza", () => {
  it("cobra o sabor mais caro em pizza meio a meio", () => {
    const quote = quotePizza({
      sizeName: "Grande",
      maxFlavors: 2,
      basePriceCents: 0,
      pricingMode: "HIGHEST_FLAVOR",
      flavors: [
        { id: "1", name: "Calabresa", priceCents: 5990 },
        { id: "2", name: "Quatro Queijos", priceCents: 6690 },
      ],
      crustPriceCents: 900,
      addons: [{ id: "a", name: "Bacon", priceCents: 600, quantity: 1 }],
    });
    expect(quote.flavorPriceCents).toBe(6690);
    expect(quote.totalCents).toBe(6690 + 900 + 600);
  });

  it("rejeita mais sabores do que o tamanho permite", () => {
    expect(() =>
      quotePizza({
        sizeName: "Pequena",
        maxFlavors: 1,
        basePriceCents: 0,
        pricingMode: "HIGHEST_FLAVOR",
        flavors: [
          { id: "1", name: "A", priceCents: 1000 },
          { id: "2", name: "B", priceCents: 1000 },
        ],
      }),
    ).toThrow(/no máximo 1/);
  });

  it("não aceita preço do navegador: o total sai só dos itens do servidor", () => {
    const quote = quotePizza({
      sizeName: "Média",
      maxFlavors: 2,
      basePriceCents: 1000,
      pricingMode: "SUM_FLAVORS",
      flavors: [
        { id: "1", name: "A", priceCents: 2000 },
        { id: "2", name: "B", priceCents: 3000 },
      ],
    });
    expect(quote.totalCents).toBe(6000);
  });
});
