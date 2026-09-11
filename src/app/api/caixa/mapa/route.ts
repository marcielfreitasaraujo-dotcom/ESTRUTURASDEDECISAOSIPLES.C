import { NextResponse } from "next/server";
import { requireTenantPermission } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { getFloorSnapshot } from "@/server/services/floor";
import { publicErrorMessage } from "@/lib/errors";

export async function GET() {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.ORDER_READ);
    const snapshot = await getFloorSnapshot(ctx.tenantId);
    return NextResponse.json(snapshot);
  } catch (error) {
    const parsed = publicErrorMessage(error);
    return NextResponse.json({ error: parsed.message }, { status: parsed.status ?? 400 });
  }
}
