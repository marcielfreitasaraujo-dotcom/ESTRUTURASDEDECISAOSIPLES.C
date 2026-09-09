"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { signInSchema, signUpSchema } from "@/server/validation";
import { writeAudit } from "@/server/audit";
import { publicErrorMessage } from "@/lib/errors";

export async function signInAction(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  try {
    await auth.api.signInEmail({
      headers: await headers(),
      body: parsed.data,
    });
    const session = await auth.api.getSession({ headers: await headers() });
    await writeAudit({
      action: "LOGIN",
      entity: "User",
      entityId: session?.user.id,
      userId: session?.user.id,
      tenantId: session?.session.activeTenantId,
    });
    const destination = session?.user.platformRole === "SUPER_ADMIN" ? "/admin" : "/app";
    return { ok: true, redirectTo: destination };
  } catch (error) {
    return { error: publicErrorMessage(error).message === "Algo deu errado. Tente novamente em instantes."
      ? "E-mail ou senha inválidos."
      : publicErrorMessage(error).message };
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
}
