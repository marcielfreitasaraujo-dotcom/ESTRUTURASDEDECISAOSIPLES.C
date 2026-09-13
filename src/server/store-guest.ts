import { cookies } from "next/headers";
import {
  parseStoreGuest,
  serializeStoreGuest,
  STORE_GUEST_COOKIE,
  type StoreGuest,
} from "@/lib/store-guest";

const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

export async function getStoreGuest(): Promise<StoreGuest | null> {
  const store = await cookies();
  return parseStoreGuest(store.get(STORE_GUEST_COOKIE)?.value);
}

export async function setStoreGuestCookie(guest: StoreGuest) {
  const store = await cookies();
  store.set(STORE_GUEST_COOKIE, serializeStoreGuest(guest), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE,
  });
}

export async function clearStoreGuestCookie() {
  const store = await cookies();
  store.delete(STORE_GUEST_COOKIE);
}
