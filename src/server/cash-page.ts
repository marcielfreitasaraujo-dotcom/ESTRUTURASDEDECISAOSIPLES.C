import { redirect } from "next/navigation";
import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { getOpenSession } from "@/server/services/cash";

export async function requireOpenCashPage() {
  const ctx = await requirePage(PERMISSIONS.CASH_OPERATE);
  const session = await getOpenSession(ctx.tenantId);
  if (!session) redirect("/caixa");
  return { ...ctx, session };
}