import { NextResponse } from "next/server";
import { requireTenantPermission } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { conferenceCsv, listCashDeskSessions } from "@/server/services/cash-desk";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const ctx = await requireTenantPermission(PERMISSIONS.CASH_CONFER);
  const url = new URL(request.url);
  const rows = await listCashDeskSessions(ctx.tenantId, {
    period: url.searchParams.get("periodo") || "last30",
    from: url.searchParams.get("de"),
    to: url.searchParams.get("ate"),
    operatorId: url.searchParams.get("operador"),
    terminalId: url.searchParams.get("terminal"),
    status: url.searchParams.get("status"),
    difference: url.searchParams.get("diferenca"),
    query: url.searchParams.get("q"),
    take: 2000,
  });
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: ctx.tenantId },
    select: { name: true, tradeName: true },
  });
  const csv = conferenceCsv(rows, tenant.tradeName || tenant.name);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="conferencia-caixas.csv"',
    },
  });
}
