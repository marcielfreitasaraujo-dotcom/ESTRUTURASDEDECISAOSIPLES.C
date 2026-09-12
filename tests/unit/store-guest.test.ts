import { describe, expect, it } from "vitest";
import { digitsOnly, formatBrPhone, isValidBrPhone } from "@/lib/phone";
import { guestFirstName, parseStoreGuest, serializeStoreGuest } from "@/lib/store-guest";
import { storeGuestSchema } from "@/server/validation";

describe("telefone da loja", () => {
  it("formata celular com DDD", () => {
    expect(digitsOnly("(91) 99151-5550")).toBe("91991515550");
    expect(formatBrPhone("91991515550")).toBe("(91) 99151-5550");
    expect(formatBrPhone("9132321234")).toBe("(91) 3232-1234");
    expect(isValidBrPhone("91991515550")).toBe(true);
    expect(isValidBrPhone("123")).toBe(false);
  });
});

describe("identificação do cliente", () => {
  it("grava só nome e telefone válidos", () => {
    const raw = serializeStoreGuest({ name: " Marciel Teste ", phone: "(91) 99151-5550" });
    expect(parseStoreGuest(raw)).toEqual({ name: "Marciel Teste", phone: "91991515550" });
    expect(guestFirstName("Marciel Teste")).toBe("Marciel");
    expect(parseStoreGuest("{")).toBeNull();
    expect(parseStoreGuest(JSON.stringify({ name: "A", phone: "91991515550" }))).toBeNull();
  });

  it("pede nome e telefone com DDD", () => {
    expect(storeGuestSchema.safeParse({ name: "Marciel", phone: "91991515550" }).success).toBe(true);
    expect(storeGuestSchema.safeParse({ name: "M", phone: "91991515550" }).success).toBe(false);
    expect(storeGuestSchema.safeParse({ name: "Marciel", phone: "99151" }).success).toBe(false);
    expect(storeGuestSchema.safeParse({ name: "Marciel", phone: "(91) 99151-5550" }).data).toEqual({
      name: "Marciel",
      phone: "91991515550",
    });
  });
});
