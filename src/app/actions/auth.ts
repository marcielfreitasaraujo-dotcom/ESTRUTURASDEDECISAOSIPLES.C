"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { signInSchema, signUpSchema } from "@/server/validation";
import { writeAudit } from "@/server/audit";
import { publicErrorMessage } from "@/lib/errors";
import { postLoginPath } from "@/domain/rbac/home";
import { resolveLoginEmail } from "@/server/services/login";
import type { PlatformRole, TenantRole } from "@/domain/rbac/roles";

async function destinationForUser(userId: string, platformRole?: string | null) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { platformRole: true },
  });
  const membership = await prisma.tenantMembership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return postLoginPath({
    platformRole: (platformRole ?? user?.platformRole ?? "USER") as PlatformRole,
    tenantRole: (membership?.role ?? null) as TenantRole | null,
  });
}

function loginFromForm(formData: FormData) {
  return String(formData.get("login") || formData.get("email") || "");
}

export async function signInFormAction(formData: FormData) {
  const parsed = signInSchema.safeParse({
    login: loginFromForm(formData),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    redirect("/entrar?error=invalid");
  }
  const email = await resolveLoginEmail(parsed.data.login);
  if (!email) redirect("/entrar?error=credentials");
  try {
    const signedIn = await auth.api.signInEmail({
      headers: await headers(),
      body: { email, password: parsed.data.password },
    });
    const userId = signedIn.user.id;
    await writeAudit({
      action: "LOGIN",
      entity: "User",
      entityId: userId,
      userId,
    });
    redirect(await destinationForUser(userId, signedIn.user.platformRole));
  } catch (error) {
    const digest = typeof error === "object" && error && "digest" in error ? String((error as { digest?: string }).digest) : "";
    if (digest.startsWith("NEXT_REDIRECT")) throw error;
    redirect("/entrar?error=credentials");
  }
}

export async function signInAction(formData: FormData) {
  const parsed = signInSchema.safeParse({
    login: loginFromForm(formData),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const email = await resolveLoginEmail(parsed.data.login);
  if (!email) return { error: "Usuário ou senha inválidos." };
  try {
    const signedIn = await auth.api.signInEmail({
      headers: await headers(),
      body: { email, password: parsed.data.password },
    });
    const userId = signedIn.user.id;
    await writeAudit({
      action: "LOGIN",
      entity: "User",
      entityId: userId,
      userId,
    });
    return { ok: true, redirectTo: await destinationForUser(userId, signedIn.user.platformRole) };
  } catch (error) {
    return {
      error:
        publicErrorMessage(error).message === "Algo deu errado. Tente novamente em instantes."
          ? "Usuário ou senha inválidos."
          : publicErrorMessage(error).message,
    };
  }
}

export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    pizzeriaName: formData.get("pizzeriaName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  try {
    const created = await auth.api.signUpEmail({
      headers: await headers(),
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      },
    });
    const slug = parsed.data.pizzeriaName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const tenant = await prisma.tenant.create({
      data: {
        name: parsed.data.pizzeriaName,
        slug: `${slug}-${crypto.randomUUID().slice(0, 6)}`,
        status: "ONBOARDING",
        memberships: {
          create: { userId: created.user.id, role: "OWNER" },
        },
      },
    });
    await prisma.session.updateMany({
      where: { userId: created.user.id },
      data: { activeTenantId: tenant.id },
    });
    return { ok: true, redirectTo: "/app" };
  } catch (error) {
    return { error: publicErrorMessage(error).message };
  }
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  if (!email.includes("@")) return { error: "Informe um e-mail válido." };
  try {
    await auth.api.requestPasswordReset({
      headers: await headers(),
      body: { email, redirectTo: "/entrar" },
    });
    return { ok: true };
  } catch (error) {
    return { error: publicErrorMessage(error).message };
  }
}

export async function recordLoginAction() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;
  await writeAudit({
    action: "LOGIN",
    entity: "User",
    entityId: session.user.id,
    userId: session.user.id,
    tenantId: session.session.activeTenantId,
  });
}

export async function signOutAction() {
  const session = await auth.api.getSession({ headers: await headers() });
  await auth.api.signOut({ headers: await headers() });
  if (session) {
    await writeAudit({
      action: "LOGOUT",
      entity: "User",
      entityId: session.user.id,
      userId: session.user.id,
    });
  }
  redirect("/entrar");
}
