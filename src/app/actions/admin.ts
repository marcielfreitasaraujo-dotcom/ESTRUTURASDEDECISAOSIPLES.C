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
import { prisma } from "@/lib/db";
import { sendTrackingTestMessage } from "@/server/services/whatsapp";

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
      username: String(formData.get("username") || "") || undefined,
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
      username: String(formData.get("username") || "") || undefined,
      password: String(formData.get("newPassword") || formData.get("password") || "") || undefined,
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

export async function savePlatformTrackingFlagAction(formData: FormData) {
  await requirePlatformAdmin();
  const enabled = formData.get("order_tracking") === "on";
  const existing = await prisma.featureFlag.findFirst({
    where: { key: "order_tracking", scope: "platform" },
  });
  if (existing) {
    await prisma.featureFlag.update({ where: { id: existing.id }, data: { enabled } });
  } else {
    await prisma.featureFlag.create({
      data: { key: "order_tracking", scope: "platform", scopeId: "platform", enabled },
    });
  }
  revalidatePath("/admin/acompanhamento");
  revalidatePath("/loja");
}

export async function sendPlatformTrackingTestAction(formData: FormData) {
  const ctx = await requirePlatformAdmin();
  const tenantId = String(formData.get("tenantId") || "");
  if (!tenantId) {
    redirect(`/admin/acompanhamento?error=${encodeURIComponent("Escolha uma loja.")}`);
  }
  try {
    await sendTrackingTestMessage({ tenantId, userId: ctx.userId });
  } catch (error) {
    redirect(`/admin/acompanhamento?error=${encodeURIComponent(publicErrorMessage(error).message)}`);
  }
  revalidatePath("/admin/acompanhamento");
  redirect("/admin/acompanhamento?ok=whatsapp-teste");
}
