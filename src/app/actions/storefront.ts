"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { checkoutSchema } from "@/server/validation";
import { addPizzaToCart, addSimpleProductToCart, placeOrder, updateCartItemQuantity } from "@/server/services/cart";
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
  } catch (error) {
    throw new Error(publicErrorMessage(error).message);
  }
}

export async function addPizzaToCartAction(formData: FormData) {
  try {
    const slug = String(formData.get("slug"));
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
    return { ok: true };
  } catch (error) {
    return { error: publicErrorMessage(error).message };
  }
}

export async function updateCartItemAction(slug: string, itemId: string, quantity: number) {
  try {
    const tenant = await tenantBySlug(slug);
    await updateCartItemQuantity(tenant.id, itemId, quantity);
    revalidatePath(`/loja/${slug}/carrinho`);
  } catch (error) {
    throw new Error(publicErrorMessage(error).message);
  }
}

export async function checkoutAction(slug: string, formData: FormData) {
  try {
    const tenant = await tenantBySlug(slug);
    const parsed = checkoutSchema.parse({
      customerName: formData.get("customerName"),
      customerPhone: formData.get("customerPhone"),
      customerEmail: formData.get("customerEmail") || "",
      fulfillment: formData.get("fulfillment"),
      paymentMethod: formData.get("paymentMethod"),
      notes: formData.get("notes") || undefined,
      couponCode: formData.get("couponCode") || undefined,
      street: formData.get("street") || undefined,
      addressNumber: formData.get("addressNumber") || undefined,
      neighborhood: formData.get("neighborhood") || undefined,
      city: formData.get("city") || undefined,
      state: formData.get("state") || undefined,
      postalCode: formData.get("postalCode") || undefined,
      reference: formData.get("reference") || undefined,
      idempotencyKey: formData.get("idempotencyKey") || crypto.randomUUID(),
    });
    const order = await placeOrder({ tenantId: tenant.id, ...parsed, customerEmail: parsed.customerEmail || undefined });
    revalidatePath(`/loja/${slug}`);
    return { ok: true, redirectTo: `/loja/${slug}/pedido/${order.publicCode}` };
  } catch (error) {
    return { error: publicErrorMessage(error).message };
  }
}
