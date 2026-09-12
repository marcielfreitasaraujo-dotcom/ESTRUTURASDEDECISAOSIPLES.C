import { prisma } from "@/lib/db";
import { writeAudit } from "@/server/audit";
import { NotFoundError } from "@/lib/errors";

export async function listTenants() {
  return prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscription: { include: { plan: true } },
      _count: { select: { orders: true, memberships: true } },
    },
  });
}

export async function setTenantStatus(input: {
  tenantId: string;
  status: "ACTIVE" | "SUSPENDED";
  userId: string;
}) {
  const tenant = await prisma.tenant.findUnique({ where: { id: input.tenantId } });
  if (!tenant) throw new NotFoundError("Estabelecimento não encontrado.");

  const updated = await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      status: input.status,
      suspendedAt: input.status === "SUSPENDED" ? new Date() : null,
    },
  });

  await writeAudit({
    action: input.status === "SUSPENDED" ? "TENANT_SUSPENDED" : "TENANT_REACTIVATED",
    entity: "Tenant",
    entityId: tenant.id,
    userId: input.userId,
    tenantId: tenant.id,
  });

  return updated;
}

export async function listPlatformUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      memberships: { include: { tenant: { select: { name: true, slug: true } } } },
    },
    take: 200,
  });
}

export async function listAuditLogs(limit = 80) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { name: true, email: true } }, tenant: { select: { name: true } } },
  });
}

export async function listPlansWithSubs() {
  return prisma.plan.findMany({
    orderBy: { monthlyPriceCents: "asc" },
    include: { subscriptions: { include: { tenant: { select: { name: true, slug: true } } } } },
  });
}
