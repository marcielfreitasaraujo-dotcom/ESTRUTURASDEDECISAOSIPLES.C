"use server";

import { revalidatePath } from "next/cache";
import { requireTenantPermission } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { publicErrorMessage } from "@/lib/errors";
import { parseBRLToCents } from "@/lib/money";
import {
  authorizeManager,
  cancelPayment,
  closeCashSession,
  confirmPixPayment,
  openCashSession,
  printReceipt,
  receiveOrderPayment,
  registerCashMovement,
  requestRefund,
  searchCashier,
} from "@/server/services/cash";
import { setCredentialPassword } from "@/server/services/credentials";
import { prisma } from "@/lib/db";
import type { CashTenderInput } from "@/domain/cash/math";

function revalidateCash() {
  revalidatePath("/caixa");
  revalidatePath("/caixa/pdv");
  revalidatePath("/caixa/pagamentos");
  revalidatePath("/caixa/movimentacoes");
  revalidatePath("/caixa/conferencia");
  revalidatePath("/caixa/fechamento");
  revalidatePath("/caixa/turno");
  revalidatePath("/caixa/historico");
  revalidatePath("/caixa/mesas");
  revalidatePath("/app/pedidos");
}

function money(formData: FormData, key: string) {
  const raw = String(formData.get(key) || "").trim();
  if (!raw) return 0;
  try {
    return parseBRLToCents(raw);
  } catch {
    throw new Error("Informe um valor em reais válido.");
  }
}

export async function openCashSessionAction(formData: FormData) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.CASH_OPERATE);
    await openCashSession({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      openingCents: money(formData, "opening"),
      note: String(formData.get("note") || "") || undefined,
    });
    revalidateCash();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error).message };
  }
}

export async function receivePaymentAction(input: {
  orderId: string;
  tenders: CashTenderInput[];
  discountCents?: number;
  couponCode?: string;
  partySize?: number;
  authorizationId?: string;
  idempotencyKey: string;
}) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.CASH_OPERATE);
    const result = await receiveOrderPayment({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      ...input,
    });
    revalidateCash();
    return { ok: true as const, ...result };
  } catch (error) {
    const pub = publicErrorMessage(error);
    return {
      ok: false as const,
      error:
        pub.status >= 500
          ? "Não foi possível finalizar o pagamento. Verifique a conexão e tente novamente."
          : pub.message,
    };
  }
}

export async function confirmPixAction(paymentId: string) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.CASH_OPERATE);
    await confirmPixPayment({ tenantId: ctx.tenantId, userId: ctx.userId, paymentId });
    revalidateCash();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error).message };
  }
}

export async function cashMovementAction(formData: FormData) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.CASH_OPERATE);
    const type = String(formData.get("type") || "") as "SANGRIA" | "SUPPLY" | "EXPENSE";
    if (type !== "SANGRIA" && type !== "SUPPLY" && type !== "EXPENSE") {
      return { ok: false as const, error: "Movimentação inválida." };
    }
    await registerCashMovement({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      type,
      amountCents: money(formData, "amount"),
      reason: String(formData.get("reason") || "") || undefined,
      notes: String(formData.get("notes") || "") || undefined,
      authorizationId: String(formData.get("authorizationId") || "") || undefined,
      idempotencyKey: String(formData.get("idempotencyKey") || crypto.randomUUID()),
    });
    revalidateCash();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error).message };
  }
}

export async function closeCashSessionAction(formData: FormData) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.CASH_OPERATE);
    const result = await closeCashSession({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      countedCents: money(formData, "counted"),
      note: String(formData.get("note") || "") || undefined,
      confirm: String(formData.get("confirm") || "") === "1",
    });
    revalidateCash();
    return { ok: true as const, difference: result.difference, label: result.differenceLabel.label };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error).message };
  }
}

export async function authorizeManagerAction(input: {
  login: string;
  password: string;
  kind: "DISCOUNT" | "PAYMENT_CANCEL" | "REFUND" | "EXPENSE" | "CLOSE_OVERRIDE";
  reason: string;
  amountCents?: number;
  orderId?: string;
}) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.CASH_OPERATE);
    const row = await authorizeManager({
      tenantId: ctx.tenantId,
      requestedById: ctx.userId,
      ...input,
    });
    return { ok: true as const, authorizationId: row.id };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error).message };
  }
}

export async function cancelPaymentAction(input: { paymentId: string; reason: string; authorizationId: string }) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.CASH_OPERATE);
    await cancelPayment({ tenantId: ctx.tenantId, userId: ctx.userId, ...input });
    revalidateCash();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error).message };
  }
}

export async function refundPaymentAction(input: { paymentId: string; reason: string; authorizationId: string }) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.CASH_OPERATE);
    await requestRefund({ tenantId: ctx.tenantId, userId: ctx.userId, ...input });
    revalidateCash();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error).message };
  }
}

export async function searchCashierAction(query: string) {
  const ctx = await requireTenantPermission(PERMISSIONS.CASH_READ);
  return searchCashier(ctx.tenantId, query);
}

export async function printReceiptAction(payload: unknown) {
  const ctx = await requireTenantPermission(PERMISSIONS.CASH_READ);
  return printReceipt(ctx.tenantId, payload);
}

export async function updateCashierProfileAction(formData: FormData) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.CASH_READ);
    const name = String(formData.get("name") || "").trim();
    if (name.length < 2) return { ok: false as const, error: "Informe seu nome." };
    await prisma.user.update({ where: { id: ctx.userId }, data: { name } });
    const password = String(formData.get("password") || "");
    if (password) await setCredentialPassword(ctx.userId, password);
    revalidatePath("/caixa/conta");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error).message };
  }
}
