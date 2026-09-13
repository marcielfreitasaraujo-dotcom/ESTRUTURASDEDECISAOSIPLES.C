import { describe, expect, it } from "vitest";
import {
  STORE_CHECKOUT_PAYMENTS,
  checkoutAddressReady,
  isStoreCheckoutPayment,
} from "@/domain/ordering/store-payment";

describe("pagamento do checkout da loja", () => {
  it("oferece PIX, dinheiro e cartão", () => {
    expect(STORE_CHECKOUT_PAYMENTS.map((option) => option.value)).toEqual(["PIX", "CASH", "CARD"]);
    expect(isStoreCheckoutPayment("PIX")).toBe(true);
    expect(isStoreCheckoutPayment("ONLINE")).toBe(false);
  });

  it("só libera o pagamento da entrega com rua, número e bairro", () => {
    expect(checkoutAddressReady({ fulfillment: "PICKUP" })).toBe(true);
    expect(
      checkoutAddressReady({
        fulfillment: "DELIVERY",
        street: "Rua das Flores",
        addressNumber: "10",
        neighborhood: "da Velha",
      }),
    ).toBe(true);
    expect(
      checkoutAddressReady({
        fulfillment: "DELIVERY",
        street: "Rua das Flores",
        addressNumber: "10",
      }),
    ).toBe(false);
  });
});
