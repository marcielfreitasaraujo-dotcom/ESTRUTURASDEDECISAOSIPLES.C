"use server";

import { revalidatePath } from "next/cache";
import { requireTenantPermission } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { upsertCategory, upsertProduct, duplicateProduct } from "@/server/services/catalog";
import { categorySchema, productSchema } from "@/server/validation";
import { publicErrorMessage } from "@/lib/errors";

export async function saveCategoryAction(formData: FormData) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.CATALOG_WRITE);
    const parsed = categorySchema.parse({
      id: formData.get("id") || undefined,
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      active: formData.get("active") !== "false",
    });
    await upsertCategory({ ...parsed, tenantId: ctx.tenantId, userId: ctx.userId });
    revalidatePath("/app/cardapio");
  } catch (error) {
    throw new Error(publicErrorMessage(error).message);
  }
}

export async function saveProductAction(formData: FormData) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.CATALOG_WRITE);
    const parsed = productSchema.parse({
      id: formData.get("id") || undefined,
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      categoryId: formData.get("categoryId") || undefined,
      priceCents: Math.round(Number(formData.get("price")) * 100),
      kind: formData.get("kind") || "SIMPLE",
      active: formData.get("active") !== "false",
      featured: formData.get("featured") === "true",
    });
    await upsertProduct({ ...parsed, tenantId: ctx.tenantId, userId: ctx.userId });
    revalidatePath("/app/cardapio");
    revalidatePath("/loja");
  } catch (error) {
    throw new Error(publicErrorMessage(error).message);
  }
}

export async function duplicateProductAction(productId: string) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.CATALOG_WRITE);
    await duplicateProduct(ctx.tenantId, productId);
    revalidatePath("/app/cardapio");
  } catch (error) {
    throw new Error(publicErrorMessage(error).message);
  }
}
