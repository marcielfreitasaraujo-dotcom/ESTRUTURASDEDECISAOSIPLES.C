"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { checkoutSchema, storeGuestSchema } from "@/server/validation";
import { addPizzaToCart, addSimpleProductToCart, applyCartCoupon, getCart, placeOrder, updateCartItemQuantity } from "@/server/services/cart";
import { upsertCustomerByPhone } from "@/server/services/customers";
import { clearStoreGuestCookie, setStoreGuestCookie } from "@/server/store-guest";
import { parseStoreGuest } from "@/lib/store-guest";
import { publicErrorMessage } from "@/lib/errors";

async function tenantBySlug(slug: string) {
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant || tenant.status === "SUSPENDED") {
    throw new Error("Esta loja não está disponível.");
  }
  return tenant;
}

export async function addProductToCartAction(slug: string, productId: string, quantity = 1) {
  try {
    const tenant = await tenantBySlug(slug);
    await addSimpleProductToCart({ tenantId: tenant.id, productId, quantity });
    revalidatePath(`/loja/${slug}`);
    revalidatePath(`/loja/${slug}/carrinho`);
  } catch (error) {
    throw new Error(publicErrorMessage(error).message);
  }
}

export async function addPizzaToCartAction(formData: FormData) {
  const slug = String(formData.get("slug"));
  try {
    const tenant = await tenantBySlug(slug);
    await addPizzaToCart({
      tenantId: tenant.id,
      sizeId: String(formData.get("sizeId")),
      flavorIds: formData.getAll("flavorId").map(String).filter(Boolean),
      crustId: String(formData.get("crustId") || "") || undefined,
      addonIds: formData.getAll("addonId").map(String).filter(Boolean),
      notes: String(formData.get("notes") || "") || undefined,
      quantity: Number(formData.get("quantity") || 1),
    });
    revalidatePath(`/loja/${slug}`);
    revalidatePath(`/loja/${slug}/carrinho`);
  } catch (error) {
    throw new Error(publicErrorMessage(error).message);
  }
}

export async function applyCartCouponAction(slug: string, code: string) {
  try {
    const tenant = await tenantBySlug(slug);
    const result = await applyCartCoupon(tenant.id, code);
    revalidatePath(`/loja/${slug}`);
    revalidatePath(`/loja/${slug}/carrinho`);
    revalidatePath(`/loja/${slug}/checkout`);
    return result;
  } catch (error) {
    throw new Error(publicErrorMessage(error).message);
  }
}

export async function updateCartItemAction(slug: string, itemId: string, quantity: number) {
  try {
    const tenant = await tenantBySlug(slug);
    await updateCartItemQuantity(tenant.id, itemId, quantity);
    revalidatePath(`/loja/${slug}`);
    revalidatePath(`/loja/${slug}/carrinho`);
    revalidatePath(`/loja/${slug}/checkout`);
  } catch (error) {
    throw new Error(publicErrorMessage(error).message);
  }
}

export async function identifyStoreGuestAction(slug: string, name: string, phone: string) {
  const parsed = storeGuestSchema.safeParse({ name, phone });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Confira nome e telefone." };
  }

  try {
    const tenant = await tenantBySlug(slug);
    const customer = await upsertCustomerByPhone({
      tenantId: tenant.id,
      name: parsed.data.name,
      phone: parsed.data.phone,
    });
    const cart = await getCart(tenant.id);
    if (cart) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: { customerId: customer.id },
      });
    }
    await setStoreGuestCookie({ name: parsed.data.name, phone: parsed.data.phone });
    revalidatePath(`/loja/${slug}`);
    revalidatePath(`/loja/${slug}/carrinho`);
    revalidatePath(`/loja/${slug}/checkout`);
    revalidatePath("/app/clientes");
    return { ok: true as const, guest: { name: parsed.data.name, phone: parsed.data.phone } };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error).message };
  }
}

export async function clearStoreGuestAction(slug: string) {
  await clearStoreGuestCookie();
  revalidatePath(`/loja/${slug}`);
  revalidatePath(`/loja/${slug}/carrinho`);
  revalidatePath(`/loja/${slug}/checkout`);
}

export async function checkoutFormAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const parsed = checkoutSchema.safeParse({
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    customerEmail: formData.get("customerEmail") || "",
    fulfillment: formData.get("fulfillment"),
    paymentMethod: formData.get("paymentMethod"),
    notes: formData.get("notes") || undefined,
    couponCode: String(formData.get("couponCode") || "") || undefined,
    tableNumber: String(formData.get("tableNumber") || "") || undefined,
    street: formData.get("street") || undefined,
    addressNumber: formData.get("addressNumber") || undefined,
    neighborhood: formData.get("neighborhood") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    postalCode: formData.get("postalCode") || undefined,
    reference: formData.get("reference") || undefined,
    idempotencyKey: formData.get("idempotencyKey") || crypto.randomUUID(),
  });
  if (!parsed.success) {
    redirect(`/loja/${slug}/checkout?error=invalid`);
  }

  const guest = parseStoreGuest(
    JSON.stringify({
      name: parsed.data.customerName,
      phone: parsed.data.customerPhone,
    }),
  );
  if (guest) {
    await setStoreGuestCookie(guest);
  }

  let publicCode = "";
  try {
    const tenant = await tenantBySlug(slug);
    const order = await placeOrder({
      tenantId: tenant.id,
      ...parsed.data,
      customerEmail: parsed.data.customerEmail || undefined,
    });
    publicCode = order.publicCode;
    revalidatePath(`/loja/${slug}`);
    revalidatePath(`/loja/${slug}/carrinho`);
    revalidatePath("/app/pedidos");
    revalidatePath("/app/cozinha");
  } catch (error) {
    const code =
      publicErrorMessage(error).message.includes("vazio")
        ? "empty"
        : publicErrorMessage(error).message.includes("bairro")
          ? "delivery"
          : publicErrorMessage(error).message.includes("não está aceitando")
            ? "fulfillment"
            : "failed";
    redirect(`/loja/${slug}/checkout?error=${code}`);
  }
  redirect(`/loja/${slug}/pedido/${publicCode}`);
}
