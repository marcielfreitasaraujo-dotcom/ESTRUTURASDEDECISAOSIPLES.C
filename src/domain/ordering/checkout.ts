import type { Cents } from "@/lib/money";

export type CartLineInput = {
  name: string;
  quantity: number;
  unitPriceCents: Cents;
};

export type CheckoutTotalsInput = {
  items: CartLineInput[];
  discountCents: Cents;
  deliveryFeeCents: Cents;
};

export type CheckoutTotals = {
  subtotalCents: Cents;
  discountCents: Cents;
  deliveryFeeCents: Cents;
  totalCents: Cents;
};

export function calculateCheckoutTotals(input: CheckoutTotalsInput): CheckoutTotals {
  if (input.items.length === 0) {
    throw new Error("O carrinho está vazio.");
  }

  const subtotalCents = input.items.reduce((sum, item) => {
    if (item.quantity < 1) throw new Error(`Quantidade inválida para ${item.name}.`);
    if (item.unitPriceCents < 0) throw new Error(`Preço inválido para ${item.name}.`);
    return sum + item.unitPriceCents * item.quantity;
  }, 0);

  const discountCents = Math.min(Math.max(input.discountCents, 0), subtotalCents);
  const deliveryFeeCents = Math.max(input.deliveryFeeCents, 0);

  return {
    subtotalCents,
    discountCents,
    deliveryFeeCents,
    totalCents: subtotalCents - discountCents + deliveryFeeCents,
  };
}
