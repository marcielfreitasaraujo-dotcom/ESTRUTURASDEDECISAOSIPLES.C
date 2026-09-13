export const STORE_CHECKOUT_PAYMENTS = [
  {
    value: "PIX",
    label: "PIX",
    hint: "Pague pelo app do banco, na hora.",
  },
  {
    value: "CASH",
    label: "Dinheiro",
    hint: "Pague na entrega ou na retirada.",
  },
  {
    value: "CARD",
    label: "Cartão",
    hint: "Débito ou crédito na hora.",
  },
] as const;

export type StoreCheckoutPayment = (typeof STORE_CHECKOUT_PAYMENTS)[number]["value"];

export function isStoreCheckoutPayment(value: string): value is StoreCheckoutPayment {
  return STORE_CHECKOUT_PAYMENTS.some((option) => option.value === value);
}

export function checkoutAddressReady(input: {
  fulfillment: string;
  street?: string;
  addressNumber?: string;
  neighborhood?: string;
}): boolean {
  if (input.fulfillment !== "DELIVERY") return true;
  return Boolean(input.street?.trim() && input.addressNumber?.trim() && input.neighborhood?.trim());
}
