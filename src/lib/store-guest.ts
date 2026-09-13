import { digitsOnly, isValidBrPhone } from "@/lib/phone";

export const STORE_GUEST_COOKIE = "comanda_guest";

export type StoreGuest = {
  name: string;
  phone: string;
};

export function parseStoreGuest(raw: string | undefined | null): StoreGuest | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") return null;
    const record = data as { name?: unknown; phone?: unknown };
    const name = typeof record.name === "string" ? record.name.trim() : "";
    const phone = digitsOnly(typeof record.phone === "string" ? record.phone : "");
    if (name.length < 2 || !isValidBrPhone(phone)) return null;
    return { name, phone };
  } catch {
    return null;
  }
}

export function serializeStoreGuest(guest: StoreGuest): string {
  return JSON.stringify({
    name: guest.name.trim(),
    phone: digitsOnly(guest.phone),
  });
}

export function guestFirstName(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean)[0] ?? name.trim();
}
