"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTenantPermission } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { publicErrorMessage } from "@/lib/errors";
import { parseBRLToCents } from "@/lib/money";
import { adjustCashSession, conferCashSession, upsertCashTerminal } from "@/server/services/cash-desk";

function revalidateDesk(sessionId?: string) {
  revalidatePath("/app/caixas");
  revalidatePath("/app/caixas/terminais");
  revalidatePath("/app/caixas/relatorios");
  revalidatePath("/caixa");
  if (sessionId) revalidatePath(`/app/caixas/${sessionId}`);
}

export async function conferCashSessionAction(formData: FormData) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.CASH_CONFER);
    const sessionId = String(formData.get("sessionId") || "");
    await conferCashSession({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      sessionId,
      note: String(formData.get("note") || "") || undefined,
    });
    revalidateDesk(sessionId);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error).message };
  }
}

export async function adjustCashSessionAction(formData: FormData) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.CASH_ADJUST);
    const raw = String(formData.get("amount") || "").trim();
    const signed = String(formData.get("direction") || "in") === "out" ? -1 : 1;
    const sessionId = String(formData.get("sessionId") || "");
    await adjustCashSession({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      sessionId,
      amountCents: parseBRLToCents(raw) * signed,
      reason: String(formData.get("reason") || ""),
    });
    revalidateDesk(sessionId);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error).message };
  }
}

export async function upsertCashTerminalAction(formData: FormData) {
  const ctx = await requireTenantPermission(PERMISSIONS.CASH_CONFER);
  try {
    await upsertCashTerminal({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      id: String(formData.get("id") || "") || undefined,
      name: String(formData.get("name") || ""),
      code: String(formData.get("code") || "") || undefined,
      description: String(formData.get("description") || "") || undefined,
      active: String(formData.get("active") || "1") !== "0",
    });
  } catch (error) {
    redirect(`/app/caixas/terminais?error=${encodeURIComponent(publicErrorMessage(error).message)}`);
  }
  revalidateDesk();
  redirect("/app/caixas/terminais");
}
