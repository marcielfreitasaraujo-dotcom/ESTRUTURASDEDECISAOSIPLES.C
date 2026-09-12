import { describe, expect, it } from "vitest";
import { CENTRAL_MENU } from "@/domain/catalog/central-menu";
import {
  pizzaSizeSlugFromCartName,
  resolveCartItemImage,
} from "@/domain/catalog/cart-item-image";

const catalog = [
  ...CENTRAL_MENU.sizes.map((size) => ({
    name: `Pizza ${size.name}`,
    slug: `pizza-${size.slug}`,
    imageUrl: size.imageUrl,
  })),
  ...CENTRAL_MENU.drinks.map((drink) => ({
    name: drink.name,
    slug: drink.slug,
    imageUrl: drink.imageUrl,
  })),
];

describe("foto do item no carrinho", () => {
  it("usa a foto já gravada no item", () => {
    expect(
      resolveCartItemImage(
        { name: "Jarra de suco de laranja 500ml", imageUrl: "/foto-salva.jpg" },
        catalog,
      ),
    ).toBe("/foto-salva.jpg");
  });

  it("acha a jarra pelo nome do cardápio", () => {
    expect(
      resolveCartItemImage({ name: "Jarra de suco de laranja 500ml" }, catalog),
    ).toBe("/tenants/central-da-pizza/suco-laranja.jpg");
    expect(
      resolveCartItemImage({ name: "Jarra de suco de laranja 1L" }, catalog),
    ).toBe("/tenants/central-da-pizza/suco-laranja.jpg");
  });

  it("acha a pizza pelo tamanho no nome, mesmo sem productId", () => {
    expect(pizzaSizeSlugFromCartName("Pizza M — 2 Queijos")).toBe("m");
    expect(resolveCartItemImage({ name: "Pizza M — 2 Queijos" }, catalog)).toBe(
      "/tenants/central-da-pizza/pizza-m.jpg",
    );
    expect(resolveCartItemImage({ name: "Pizza GG — Calabresa / Mussarela" }, catalog)).toBe(
      "/tenants/central-da-pizza/pizza-gg.jpg",
    );
  });

  it("usa o sizeSlug gravado na customização", () => {
    expect(
      resolveCartItemImage(
        { name: "Pizza montada", customization: { sizeSlug: "p" } },
        catalog,
      ),
    ).toBe("/tenants/central-da-pizza/pizza-p.jpg");
  });
});
