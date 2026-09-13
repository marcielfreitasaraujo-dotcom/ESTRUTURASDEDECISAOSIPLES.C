import { addCents, assertCents, type Cents } from "@/lib/money";

export type PizzaPricingMode = "HIGHEST_FLAVOR" | "AVERAGE_FLAVOR" | "SUM_FLAVORS";

export type FlavorQuote = {
  id: string;
  name: string;
  priceCents: Cents;
};

export type AddonQuote = {
  id: string;
  name: string;
  priceCents: Cents;
  quantity: number;
};

export type PizzaQuoteInput = {
  sizeName: string;
  maxFlavors: number;
  basePriceCents: Cents;
  pricingMode: PizzaPricingMode;
  flavors: FlavorQuote[];
  crustPriceCents?: Cents;
  addons?: AddonQuote[];
};

export type PizzaQuote = {
  sizeName: string;
  flavorNames: string[];
  flavorPriceCents: Cents;
  crustPriceCents: Cents;
  addonsPriceCents: Cents;
  totalCents: Cents;
};

export function quotePizza(input: PizzaQuoteInput): PizzaQuote {
  if (input.maxFlavors < 1) {
    throw new Error("Tamanho de pizza inválido: precisa permitir ao menos 1 sabor.");
  }
  if (input.flavors.length < 1) {
    throw new Error("Selecione ao menos um sabor.");
  }
  if (input.flavors.length > input.maxFlavors) {
    throw new Error(
      `Esta pizza aceita no máximo ${input.maxFlavors} sabor(es). Você escolheu ${input.flavors.length}.`,
    );
  }

  const flavorPrices = input.flavors.map((flavor) => assertCents(flavor.priceCents, flavor.name));
  const flavorPriceCents = priceForFlavors(flavorPrices, input.pricingMode);
  const crustPriceCents = assertCents(input.crustPriceCents ?? 0, "borda");
  const addonsPriceCents = (input.addons ?? []).reduce((sum, addon) => {
    if (addon.quantity < 1) throw new Error(`Quantidade inválida para ${addon.name}.`);
    return sum + assertCents(addon.priceCents, addon.name) * addon.quantity;
  }, 0);

  return {
    sizeName: input.sizeName,
    flavorNames: input.flavors.map((flavor) => flavor.name),
    flavorPriceCents,
    crustPriceCents,
    addonsPriceCents,
    totalCents: addCents(input.basePriceCents, flavorPriceCents, crustPriceCents, addonsPriceCents),
  };
}

function priceForFlavors(prices: Cents[], mode: PizzaPricingMode): Cents {
  if (mode === "HIGHEST_FLAVOR") {
    return Math.max(...prices);
  }
  if (mode === "AVERAGE_FLAVOR") {
    return Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
  }
  return prices.reduce((sum, price) => sum + price, 0);
}
