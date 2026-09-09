"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTenantPermission } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { isPlatformAdmin, type TenantRole } from "@/domain/rbac/roles";
import { createCustomer } from "@/server/services/customers";
import { addTeamMember, removeTeamMember, updateTeamMember } from "@/server/services/team";
import { saveStoreSettings } from "@/server/services/settings";
import { upsertZone, upsertDriver, assignDelivery, createCoupon, toggleCoupon } from "@/server/services/ops";
import { createExpense, createRevenue, upsertInventoryItem, addStockMovement } from "@/server/services/finance";
import { publicErrorMessage } from "@/lib/errors";
import type { CouponType, PaymentMethod, StockMovementType } from "@prisma/client";

function revalidateOps() {
  revalidatePath("/app/clientes");
  revalidatePath("/app/equipe");
  revalidatePath("/app/configuracoes");
  revalidatePath("/app/entregas");
  revalidatePath("/app/cupons");
  revalidatePath("/app/estoque");
  revalidatePath("/app/financeiro");
  revalidatePath("/entrega");
}

export async function saveCustomerAction(formData: FormData) {
  const ctx = await requireTenantPermission(PERMISSIONS.CUSTOMER_WRITE);
  await createCustomer({
    tenantId: ctx.tenantId,
    name: String(formData.get("name") || ""),
    phone: String(formData.get("phone") || ""),
    email: String(formData.get("email") || "") || undefined,
    notes: String(formData.get("notes") || "") || undefined,
  });
  revalidateOps();
}

function teamActorRole(ctx: { tenantRole: TenantRole | null; platformRole: string }): TenantRole {
  if (ctx.tenantRole) return ctx.tenantRole;
  if (isPlatformAdmin(ctx.platformRole as "SUPER_ADMIN" | "PLATFORM_ADMIN" | "USER")) return "OWNER";
  throw new Error("Sem papel no estabelecimento.");
}

export async function addTeamMemberAction(formData: FormData) {
  const ctx = await requireTenantPermission(PERMISSIONS.TEAM_WRITE);
  try {
    await addTeamMember({
      tenantId: ctx.tenantId,
      actorRole: teamActorRole(ctx),
      actorUserId: ctx.userId,
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      username: String(formData.get("username") || "") || undefined,
      password: String(formData.get("password") || ""),
      role: String(formData.get("role") || "STAFF") as TenantRole,
    });
  } catch (error) {
    redirect(`/app/equipe?error=${encodeURIComponent(publicErrorMessage(error).message)}`);
  }
  revalidateOps();
  redirect("/app/equipe?ok=created");
}

export async function updateTeamMemberAction(formData: FormData) {
  const ctx = await requireTenantPermission(PERMISSIONS.TEAM_WRITE);
  try {
    await updateTeamMember({
      tenantId: ctx.tenantId,
      actorRole: teamActorRole(ctx),
      actorUserId: ctx.userId,
      membershipId: String(formData.get("membershipId") || ""),
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      username: String(formData.get("username") || "") || undefined,
      password: String(formData.get("newPassword") || formData.get("password") || "") || undefined,
      role: String(formData.get("role") || "STAFF") as TenantRole,
    });
  } catch (error) {
    redirect(`/app/equipe?error=${encodeURIComponent(publicErrorMessage(error).message)}`);
  }
  revalidateOps();
  redirect("/app/equipe?ok=updated");
}

export async function removeTeamMemberAction(formData: FormData) {
  const ctx = await requireTenantPermission(PERMISSIONS.TEAM_WRITE);
  try {
    await removeTeamMember({
      tenantId: ctx.tenantId,
      actorRole: teamActorRole(ctx),
      actorUserId: ctx.userId,
      membershipId: String(formData.get("membershipId") || ""),
    });
  } catch (error) {
    redirect(`/app/equipe?error=${encodeURIComponent(publicErrorMessage(error).message)}`);
  }
  revalidateOps();
  redirect("/app/equipe?ok=removed");
}

export async function saveStoreAction(formData: FormData) {
  const ctx = await requireTenantPermission(PERMISSIONS.SETTINGS_WRITE);
  const methods = formData.getAll("method").map(String) as PaymentMethod[];
  const hours = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    opensAt: String(formData.get(`opens_${weekday}`) || "18:00"),
    closesAt: String(formData.get(`closes_${weekday}`) || "23:30"),
    closed: formData.get(`closed_${weekday}`) === "on",
  }));
  await saveStoreSettings({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    name: String(formData.get("name") || ""),
    tradeName: String(formData.get("tradeName") || "") || undefined,
    phone: String(formData.get("phone") || "") || undefined,
    whatsapp: String(formData.get("whatsapp") || "") || undefined,
    email: String(formData.get("email") || "") || undefined,
    city: String(formData.get("city") || "") || undefined,
    state: String(formData.get("state") || "") || undefined,
    estimatedMinutes: Number(formData.get("estimatedMinutes") || 40),
    minimumOrderCents: Math.round(Number(formData.get("minimumOrder") || 0) * 100),
    hours,
    methods,
  });
  revalidateOps();
}

export async function saveZoneAction(formData: FormData) {
  const ctx = await requireTenantPermission(PERMISSIONS.DELIVERY_UPDATE);
  await upsertZone({
    tenantId: ctx.tenantId,
    name: String(formData.get("name") || ""),
    feeCents: Math.round(Number(formData.get("fee") || 0) * 100),
    minOrderCents: Math.round(Number(formData.get("minOrder") || 0) * 100),
  });
  revalidateOps();
}

export async function saveDriverAction(formData: FormData) {
  const ctx = await requireTenantPermission(PERMISSIONS.DELIVERY_UPDATE);
  await upsertDriver({
    tenantId: ctx.tenantId,
    name: String(formData.get("name") || ""),
    phone: String(formData.get("phone") || ""),
  });
  revalidateOps();
}

export async function assignDeliveryAction(formData: FormData) {
  const ctx = await requireTenantPermission(PERMISSIONS.DELIVERY_UPDATE);
  await assignDelivery({
    tenantId: ctx.tenantId,
    orderId: String(formData.get("orderId") || ""),
    driverId: String(formData.get("driverId") || ""),
    userId: ctx.userId,
  });
  revalidateOps();
  revalidatePath("/app/pedidos");
}

export async function saveCouponAction(formData: FormData) {
  const ctx = await requireTenantPermission(PERMISSIONS.CATALOG_WRITE);
  await createCoupon({
    tenantId: ctx.tenantId,
    code: String(formData.get("code") || ""),
    type: String(formData.get("type") || "PERCENTAGE") as CouponType,
    value: Number(formData.get("value") || 0),
    minSubtotalCents: Math.round(Number(formData.get("minSubtotal") || 0) * 100),
  });
  revalidateOps();
}

export async function toggleCouponAction(formData: FormData) {
  const ctx = await requireTenantPermission(PERMISSIONS.CATALOG_WRITE);
  await toggleCoupon(ctx.tenantId, String(formData.get("id") || ""));
  revalidateOps();
}

export async function saveInventoryAction(formData: FormData) {
  const ctx = await requireTenantPermission(PERMISSIONS.INVENTORY_WRITE);
  await upsertInventoryItem({
    tenantId: ctx.tenantId,
    name: String(formData.get("name") || ""),
    unit: String(formData.get("unit") || "kg"),
    quantity: Number(formData.get("quantity") || 0),
    minQuantity: Number(formData.get("minQuantity") || 0),
    costCents: Math.round(Number(formData.get("cost") || 0) * 100),
  });
  revalidateOps();
}

export async function saveStockMovementAction(formData: FormData) {
  const ctx = await requireTenantPermission(PERMISSIONS.INVENTORY_WRITE);
  await addStockMovement({
    tenantId: ctx.tenantId,
    itemId: String(formData.get("itemId") || ""),
    type: String(formData.get("type") || "PURCHASE") as StockMovementType,
    quantity: Number(formData.get("quantity") || 0),
    notes: String(formData.get("notes") || "") || undefined,
  });
  revalidateOps();
}

export async function saveExpenseAction(formData: FormData) {
  const ctx = await requireTenantPermission(PERMISSIONS.FINANCE_WRITE);
  await createExpense({
    tenantId: ctx.tenantId,
    category: String(formData.get("category") || "Outros"),
    description: String(formData.get("description") || ""),
    amountCents: Math.round(Number(formData.get("amount") || 0) * 100),
    dueDate: new Date(String(formData.get("dueDate") || Date.now())),
  });
  revalidateOps();
}

export async function saveRevenueAction(formData: FormData) {
  const ctx = await requireTenantPermission(PERMISSIONS.FINANCE_WRITE);
  await createRevenue({
    tenantId: ctx.tenantId,
    category: String(formData.get("category") || "Outros"),
    description: String(formData.get("description") || ""),
    amountCents: Math.round(Number(formData.get("amount") || 0) * 100),
    receivedAt: new Date(String(formData.get("receivedAt") || Date.now())),
  });
  revalidateOps();
}
