import { hashPassword } from "better-auth/crypto";
import { prisma } from "@/lib/db";
import { TENANT_ROLES, type TenantRole } from "@/domain/rbac/roles";
import { ROLES_MANAGER_CAN_ASSIGN } from "@/domain/rbac/nav";
import { writeAudit } from "@/server/audit";
import { ForbiddenError } from "@/lib/errors";

export async function listTeam(tenantId: string) {
  return prisma.tenantMembership.findMany({
    where: { tenantId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function addTeamMember(input: {
  tenantId: string;
  actorRole: TenantRole;
  actorUserId: string;
  name: string;
  email: string;
  password: string;
  role: TenantRole;
}) {
  if (!TENANT_ROLES.includes(input.role)) throw new Error("Papel inválido.");
  const allowed = input.actorRole === "OWNER" ? TENANT_ROLES : ROLES_MANAGER_CAN_ASSIGN;
  if (!allowed.includes(input.role)) {
    throw new ForbiddenError("Você não pode atribuir este papel.");
  }

  let user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user) {
    const id = crypto.randomUUID();
    user = await prisma.user.create({
      data: {
        id,
        name: input.name,
        email: input.email.toLowerCase(),
        emailVerified: true,
        platformRole: "USER",
      },
    });
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: await hashPassword(input.password),
      },
    });
  }

  const membership = await prisma.tenantMembership.upsert({
    where: { tenantId_userId: { tenantId: input.tenantId, userId: user.id } },
    update: { role: input.role },
    create: { tenantId: input.tenantId, userId: user.id, role: input.role },
  });
  await writeAudit({
    action: "ROLE_CHANGE",
    entity: "TenantMembership",
    entityId: membership.id,
    tenantId: input.tenantId,
    userId: input.actorUserId,
    metadata: { role: input.role, email: user.email },
  });
  return membership;
}
