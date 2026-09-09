"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/server/context";
import { setTenantStatus } from "@/server/services/tenants";
import { publicErrorMessage } from "@/lib/errors";

export async function toggleTenantStatusAction(tenantId: string, status: "ACTIVE" | "SUSPENDED") {
  try {
    const ctx = await requirePlatformAdmin();
    await setTenantStatus({ tenantId, status, userId: ctx.userId });
    revalidatePath("/admin/tenants");
    revalidatePath("/admin");
  } catch (error) {
    throw new Error(publicErrorMessage(error).message);
  }
}
