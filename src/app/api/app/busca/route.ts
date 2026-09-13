import { NextResponse } from "next/server";
import { requireTenantPermission } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { searchStore } from "@/server/services/dashboard";
import { publicErrorMessage } from "@/lib/errors";

export async function GET(request: Request) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.DASHBOARD_READ);
    const query = new URL(request.url).searchParams.get("q") ?? "";
    const results = await searchStore(ctx.tenantId, query);
    return NextResponse.json(results);
  } catch (error) {
    const parsed = publicErrorMessage(error);
    return NextResponse.json({ error: parsed.message }, { status: parsed.status ?? 400 });
  }
}
