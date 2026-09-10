import { describe, expect, it } from "vitest";
import {
  ADDON_MAX_SELECT,
  CENTRAL_ADDONS,
  CENTRAL_FLAVORS,
  CENTRAL_MENU,
  PREMIUM_FLAVOR_EXTRA_CENTS,
  flavorExtraCents,
} from "@/domain/catalog/central-menu";
import { loyaltyPointsForPrice } from "@/domain/catalog/loyalty";

describe("cardápio da Central da Pizza", () => {
  it("tem tamanhos P/M/G/GG com fatias e preços oficiais", () => {
    expect(CENTRAL_MENU.sizes.map((size) => size.name)).toEqual(["P", "M", "G", "GG"]);
    expect(CENTRAL_MENU.sizes.map((size) => size.slices)).toEqual([6, 8, 10, 12]);
    expect(CENTRAL_MENU.sizes.map((size) => size.basePriceCents)).toEqual([4500, 5000, 6000, 6500]);
    expect(CENTRAL_MENU.sizes.every((size) => size.maxFlavors === 2)).toBe(true);
  });

  it("cobra +R$ 5 no sabor premium e marca itens em falta", () => {
    const twoCheeses = CENTRAL_FLAVORS.find((flavor) => flavor.slug === "2-queijos");
    const calabresa = CENTRAL_FLAVORS.find((flavor) => flavor.slug === "calabresa");
    const missing = CENTRAL_FLAVORS.filter((flavor) => !flavor.available).map((flavor) => flavor.slug);
    expect(flavorExtraCents(twoCheeses!)).toBe(PREMIUM_FLAVOR_EXTRA_CENTS);
    expect(flavorExtraCents(calabresa!)).toBe(0);
    expect(missing).toEqual(["catupresunto", "lombinho-canadense", "peito-de-peru"]);
  });

  it("não repete slug de sabor ou adicional e limita 5 extras", () => {
    const flavorSlugs = CENTRAL_FLAVORS.map((flavor) => flavor.slug);
    const addonSlugs = CENTRAL_ADDONS.map((addon) => addon.slug);
    expect(new Set(flavorSlugs).size).toBe(flavorSlugs.length);
    expect(new Set(addonSlugs).size).toBe(addonSlugs.length);
    expect(ADDON_MAX_SELECT).toBe(5);
    expect(CENTRAL_ADDONS.filter((addon) => !addon.available).map((addon) => addon.slug)).toEqual([
      "peito-peru-defumado",
      "lombinho-canadense-extra",
    ]);
  });

  it("calcula 675 pontos para a Pizza P de R$ 45", () => {
    expect(loyaltyPointsForPrice(4500)).toBe(675);
    expect(loyaltyPointsForPrice(5000)).toBe(750);
  });

  it("usa foto isolada nas jarras e foto real nas demais bebidas", () => {
    expect(CENTRAL_MENU.drinks.map((drink) => drink.imageUrl)).toEqual([
      "/tenants/central-da-pizza/suco-maracuja-300ml.jpg",
      "/tenants/central-da-pizza/suco-laranja-300ml.jpg",
      "/tenants/central-da-pizza/suco-acerola-300ml.jpg",
      "/tenants/central-da-pizza/suco-laranja.jpg",
      "/tenants/central-da-pizza/suco-laranja.jpg",
      "/tenants/central-da-pizza/suco-maracuja.jpg",
      "/tenants/central-da-pizza/suco-maracuja.jpg",
      "/tenants/central-da-pizza/suco-acerola.jpg",
      "/tenants/central-da-pizza/coca-cola-2l.jpg",
      "/tenants/central-da-pizza/coca-cola-zero-2l.jpg",
      "/tenants/central-da-pizza/guarana-antarctica-2l.jpg",
      "/tenants/central-da-pizza/fanta-laranja-2l.jpg",
      "/tenants/central-da-pizza/sprite-2l.jpg",
      "/tenants/central-da-pizza/coca-cola-lata.jpg",
      "/tenants/central-da-pizza/coca-cola-sem-acucar-lata.jpg",
      "/tenants/central-da-pizza/guarana-antarctica-lata.jpg",
      "/tenants/central-da-pizza/fanta-laranja-lata.jpg",
      "/tenants/central-da-pizza/agua-mineral.jpg",
      "/tenants/central-da-pizza/agua-com-gas.jpg",
    ]);
  });

  it("separa bebidas em sucos, refrigerantes, latas e águas", () => {
    const byGroup = Object.fromEntries(
      ["suco-300ml", "sucos", "refrigerantes", "refrigerantes-lata", "aguas"].map((slug) => [
        slug,
        CENTRAL_MENU.drinks.filter((drink) => drink.categorySlug === slug).map((drink) => drink.slug),
      ]),
    );
    expect(byGroup).toEqual({
      "suco-300ml": ["suco-maracuja-300ml", "suco-laranja-300ml", "suco-acerola-300ml"],
      sucos: [
        "suco-laranja-500ml",
        "suco-laranja-1l",
        "suco-maracuja-500ml",
        "suco-maracuja-1l",
        "jarra-suco-acerola",
      ],
      refrigerantes: [
        "coca-cola-2l",
        "coca-cola-zero-2l",
        "guarana-antarctica-2l",
        "fanta-laranja-2l",
        "sprite-2l",
      ],
      "refrigerantes-lata": [
        "coca-cola-lata-350ml",
        "coca-cola-zero-lata-350ml",
        "guarana-antarctica-lata-350ml",
        "fanta-laranja-lata-350ml",
      ],
      aguas: ["agua-mineral-500ml", "agua-com-gas-500ml"],
    });
    expect(CENTRAL_MENU.drinks.map((drink) => drink.name)).toEqual([
      "Maracujá 300ml",
      "Laranja 300ml",
      "Acerola 300ml",
      "Jarra de suco de laranja 500ml",
      "Jarra de suco de laranja 1L",
      "Jarra de suco de maracujá 500ml",
      "Jarra de suco de maracujá 1L",
      "Jarra de suco de acerola",
      "Coca-Cola 2L",
      "Coca-Cola Zero 2L",
      "Guaraná Antarctica 2L",
      "Fanta Laranja 2L",
      "Sprite 2L",
      "Coca-Cola lata 350ml",
      "Coca-Cola Zero lata 350ml",
      "Guaraná Antarctica lata 350ml",
      "Fanta Laranja lata 350ml",
      "Água Crystal 500ml",
      "Água Crystal com gás 500ml",
    ]);
    expect(
      CENTRAL_MENU.drinks
        .filter((drink) => drink.categorySlug === "suco-300ml")
        .every((drink) => drink.priceCents === 600),
    ).toBe(true);
    expect(
      CENTRAL_MENU.drinks
        .filter((drink) => drink.categorySlug === "sucos" && drink.slug.endsWith("-500ml"))
        .every((drink) => drink.priceCents === 800),
    ).toBe(true);
    expect(
      CENTRAL_MENU.drinks
        .filter((drink) => drink.categorySlug === "sucos" && drink.slug.endsWith("-1l"))
        .every((drink) => drink.priceCents === 1500),
    ).toBe(true);
    expect(
      CENTRAL_MENU.drinks
        .filter((drink) => drink.categorySlug === "refrigerantes-lata")
        .every((drink) => drink.priceCents === 600),
    ).toBe(true);
    expect(CENTRAL_MENU.drinks.some((drink) => /morango/i.test(drink.name))).toBe(false);
  });
});
