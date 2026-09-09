import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { hasPermission, isPlatformAdmin, type TenantRole } from "@/domain/rbac/roles";
import type { Permission } from "@/domain/rbac/permissions";
import { createTenantPrisma } from "@/server/tenancy";

export type AuthContext = {
  userId: string;
  email: string;
  name: string;
  platformRole: "SUPER_ADMIN" | "PLATFORM_ADMIN" | "USER";
  tenantId: string | null;
  tenantRole: TenantRole | null;
  ip: string | null;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return null;

  const platformRole = (session.user.platformRole ?? "USER") as AuthContext["platformRole"];
  const activeTenantId = session.session.activeTenantId ?? null;
  let tenantRole: TenantRole | null = null;

  if (activeTenantId) {
    const membership = await prisma.tenantMembership.findUnique({
      where: { tenantId_userId: { tenantId: activeTenantId, userId: session.user.id } },
    });
    tenantRole = membership?.role ?? null;
  }

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    platformRole,
    tenantId: activeTenantId,
    tenantRole,
    ip: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  };
}

export async function requireSession(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) throw new UnauthorizedError();
  return ctx;
}

export async function requirePlatformAdmin() {
  const ctx = await requireSession();
  if (!isPlatformAdmin(ctx.platformRole)) {
    throw new ForbiddenError("Acesso restrito à equipe da plataforma.");
  }
  return ctx;
}

export async function requireTenantPermission(permission: Permission) {
  const ctx = await requireSession();
  if (isPlatformAdmin(ctx.platformRole) && ctx.tenantId) {
    return { ...ctx, db: createTenantPrisma(ctx.tenantId), tenantId: ctx.tenantId };
  }
  if (!ctx.tenantId || !ctx.tenantRole) {
    throw new ForbiddenError("Nenhum estabelecimento ativo nesta sessão.");
  }
  if (!hasPermission(ctx.tenantRole, permission)) {
    throw new ForbiddenError();
  }
  const tenant = await prisma.tenant.findUnique({ where: { id: ctx.tenantId } });
  if (!tenant || tenant.status === "SUSPENDED" || tenant.status === "CANCELLED") {
    throw new ForbiddenError("Este estabelecimento está suspenso.");
  }
  return { ...ctx, db: createTenantPrisma(ctx.tenantId), tenantId: ctx.tenantId };
}
