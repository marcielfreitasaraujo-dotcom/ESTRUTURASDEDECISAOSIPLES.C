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
