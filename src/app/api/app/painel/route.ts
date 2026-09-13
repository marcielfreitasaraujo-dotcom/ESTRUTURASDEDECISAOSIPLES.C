import { NextResponse } from "next/server";
import { requireTenantPermission } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { getStoreControlCenter } from "@/server/services/dashboard";
import { publicErrorMessage } from "@/lib/errors";
import type { SalesRange } from "@/domain/dashboard/control-center";

export async function GET(request: Request) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.DASHBOARD_READ);
    const range = new URL(request.url).searchParams.get("range") as SalesRange | null;
    const snapshot = await getStoreControlCenter(ctx.tenantId, {
      range: range === "7d" || range === "30d" || range === "month" ? range : "today",
      userName: ctx.name,
    });
    return NextResponse.json(snapshot);
  } catch (error) {
    const parsed = publicErrorMessage(error);
    return NextResponse.json({ error: parsed.message }, { status: parsed.status ?? 400 });
  }
}
