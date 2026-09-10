"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireTenantPermission } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { createStaffOrder, markOrderPaid } from "@/server/services/pos";
import { setProductStock } from "@/server/services/catalog";
import { publicErrorMessage } from "@/lib/errors";
import type { StaffOrderItemInput } from "@/server/services/pos";

function collectItems(formData: FormData): StaffOrderItemInput[] {
  const items: StaffOrderItemInput[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("qty_") || typeof value !== "string") continue;
    const quantity = Number(value);
    if (!Number.isFinite(quantity) || quantity < 1) continue;
    items.push({ kind: "PRODUCT", productId: key.slice(4), quantity });
  }
  const sizeId = String(formData.get("sizeId") || "");
  const flavorIds = formData.getAll("flavorId").map(String).filter(Boolean);
  if (sizeId && flavorIds.length > 0) {
    items.push({
      kind: "PIZZA",
      sizeId,
      flavorIds,
      crustId: String(formData.get("crustId") || "") || undefined,
      addonIds: formData.getAll("addonId").map(String).filter(Boolean),
      quantity: Number(formData.get("pizzaQuantity") || 1),
      notes: String(formData.get("pizzaNotes") || "") || undefined,
    });
  }
  return items;
}

export async function createWaiterOrderAction(formData: FormData) {
  const tableNumber = String(formData.get("tableNumber") || "").trim();
  if (!tableNumber) redirect("/garcom?error=table");
  let publicCode = "";
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.ORDER_CREATE);
    const order = await createStaffOrder({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      idempotencyKey: String(formData.get("idempotencyKey") || crypto.randomUUID()),
      tableNumber,
      customerName: `Mesa ${tableNumber}`,
      fulfillment: "DINE_IN",
      paymentMethod: "CASH",
      notes: String(formData.get("notes") || "") || undefined,
      items: collectItems(formData),
      confirmImmediately: true,
    });
    publicCode = order.publicCode;
    revalidatePath("/garcom");
    revalidatePath("/caixa");
    revalidatePath("/app/pedidos");
    revalidatePath("/app/cozinha");
  } catch (error) {
    redirect(`/garcom?error=${encodeURIComponent(publicErrorMessage(error).message)}`);
  }
  redirect(`/garcom?ok=${publicCode}`);
}

export async function createCashierOrderAction(formData: FormData) {
  const customerName = String(formData.get("customerName") || "Balcão").trim() || "Balcão";
  let publicCode = "";
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.ORDER_CREATE);
    const order = await createStaffOrder({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      idempotencyKey: String(formData.get("idempotencyKey") || crypto.randomUUID()),
      customerName,
      customerPhone: String(formData.get("customerPhone") || "00000000"),
      fulfillment: "PICKUP",
      paymentMethod: (String(formData.get("paymentMethod") || "CASH") as "PIX" | "CASH" | "CARD") || "CASH",
      notes: String(formData.get("notes") || "") || undefined,
      items: collectItems(formData),
      confirmImmediately: true,
    });
    publicCode = order.publicCode;
    revalidatePath("/caixa");
    revalidatePath("/app/pedidos");
    revalidatePath("/app/cozinha");
  } catch (error) {
    redirect(`/caixa?error=${encodeURIComponent(publicErrorMessage(error).message)}`);
  }
  redirect(`/caixa?ok=${publicCode}`);
}

export async function markOrderPaidAction(formData: FormData) {
  const orderId = String(formData.get("orderId") || "");
  const ctx = await requireTenantPermission(PERMISSIONS.ORDER_UPDATE);
  await markOrderPaid({ tenantId: ctx.tenantId, orderId, userId: ctx.userId });
  revalidatePath("/caixa");
  revalidatePath("/app/pedidos");
}

export async function setCashierProductStockAction(productId: string, quantity: number) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.ORDER_UPDATE);
    await setProductStock({
      tenantId: ctx.tenantId,
      productId,
      quantity,
      userId: ctx.userId,
    });
    const tenant = await prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
      select: { slug: true },
    });
    revalidatePath("/caixa/estoque");
    revalidatePath("/caixa");
    if (tenant?.slug) {
      revalidatePath(`/loja/${tenant.slug}`);
      revalidatePath(`/loja/${tenant.slug}/carrinho`);
    }
    return { ok: true as const };
  } catch (error) {
    throw new Error(publicErrorMessage(error).message);
  }
}
