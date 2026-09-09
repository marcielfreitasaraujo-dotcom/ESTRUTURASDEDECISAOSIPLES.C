"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/server/context";
import { setTenantStatus } from "@/server/services/tenants";
import {
  createPlatformUser,
  removeUserMembership,
  updatePlatformUser,
  upsertUserMembership,
} from "@/server/services/users";
import { publicErrorMessage } from "@/lib/errors";
import type { PlatformRole, TenantRole } from "@/domain/rbac/roles";

function revalidateUsers() {
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  revalidatePath("/app/equipe");
}

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

export async function createPlatformUserAction(formData: FormData) {
  const ctx = await requirePlatformAdmin();
  try {
    await createPlatformUser({
      actorUserId: ctx.userId,
      actorPlatformRole: ctx.platformRole,
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      platformRole: String(formData.get("platformRole") || "USER") as PlatformRole,
      tenantId: String(formData.get("tenantId") || "") || undefined,
      tenantRole: (String(formData.get("tenantRole") || "") || undefined) as TenantRole | undefined,
    });
  } catch (error) {
    redirect(`/admin/users?error=${encodeURIComponent(publicErrorMessage(error).message)}`);
  }
  revalidateUsers();
  redirect("/admin/users?ok=created");
}

export async function updatePlatformUserAction(formData: FormData) {
  const ctx = await requirePlatformAdmin();
  try {
    await updatePlatformUser({
      actorUserId: ctx.userId,
      actorPlatformRole: ctx.platformRole,
      userId: String(formData.get("userId") || ""),
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || "") || undefined,
      platformRole: String(formData.get("platformRole") || "USER") as PlatformRole,
    });
  } catch (error) {
    redirect(`/admin/users?error=${encodeURIComponent(publicErrorMessage(error).message)}`);
  }
  revalidateUsers();
  redirect("/admin/users?ok=updated");
}

export async function upsertUserMembershipAction(formData: FormData) {
  const ctx = await requirePlatformAdmin();
  try {
    await upsertUserMembership({
      actorUserId: ctx.userId,
      userId: String(formData.get("userId") || ""),
      tenantId: String(formData.get("tenantId") || ""),
      role: String(formData.get("role") || "STAFF") as TenantRole,
    });
  } catch (error) {
    redirect(`/admin/users?error=${encodeURIComponent(publicErrorMessage(error).message)}`);
  }
  revalidateUsers();
  redirect("/admin/users?ok=linked");
}

export async function removeUserMembershipAction(formData: FormData) {
  const ctx = await requirePlatformAdmin();
  try {
    await removeUserMembership({
      actorUserId: ctx.userId,
      membershipId: String(formData.get("membershipId") || ""),
    });
  } catch (error) {
    redirect(`/admin/users?error=${encodeURIComponent(publicErrorMessage(error).message)}`);
  }
  revalidateUsers();
  redirect("/admin/users?ok=unlinked");
}
