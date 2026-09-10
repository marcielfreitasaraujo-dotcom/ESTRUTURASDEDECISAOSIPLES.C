import { prisma } from "@/lib/db";
import {
  TENANT_ROLES,
  canAssignTenantRole,
  canManageTenantMember,
  isPlatformAdmin,
  type PlatformRole,
  type TenantRole,
} from "@/domain/rbac/roles";
import { writeAudit } from "@/server/audit";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { setCredentialPassword } from "@/server/services/credentials";
import { normalizeUsername } from "@/server/services/login";

export async function listTeam(tenantId: string) {
  const members = await prisma.tenantMembership.findMany({
    where: { tenantId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  return members.filter((member) => !isPlatformAdmin((member.user.platformRole ?? "USER") as PlatformRole));
}

async function countOwners(tenantId: string) {
  return prisma.tenantMembership.count({ where: { tenantId, role: "OWNER" } });
}

export async function addTeamMember(input: {
  tenantId: string;
  actorRole: TenantRole;
  actorUserId: string;
  actorPlatformRole?: PlatformRole;
  name: string;
  email: string;
  username?: string;
  password: string;
  role: TenantRole;
}) {
  if (!TENANT_ROLES.includes(input.role)) throw new Error("Papel inválido.");
  if (!canAssignTenantRole(input.actorRole, input.role, input.actorPlatformRole)) {
    throw new ForbiddenError("Você não pode atribuir este papel.");
  }

  const email = input.email.toLowerCase().trim();
  const name = input.name.trim();
  const username = normalizeUsername(input.username);
  if (!name || !email) throw new Error("Informe nome e e-mail.");
  if (username) {
    const taken = await prisma.user.findFirst({ where: { username } });
    if (taken && taken.email !== email) throw new ConflictError("Este usuário já está em uso.");
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (user && isPlatformAdmin((user.platformRole ?? "USER") as PlatformRole)) {
    throw new ForbiddenError("O usuário admin não pode ser alterado por aqui.");
  }
  if (!user) {
    const id = crypto.randomUUID();
    user = await prisma.user.create({
      data: {
        id,
        name,
        email,
        username,
        emailVerified: true,
        platformRole: "USER",
      },
    });
    await setCredentialPassword(user.id, input.password);
  } else {
    await prisma.user.update({ where: { id: user.id }, data: { name, username: username ?? user.username } });
    if (input.password.trim()) await setCredentialPassword(user.id, input.password);
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

export async function updateTeamMember(input: {
  tenantId: string;
  actorRole: TenantRole;
  actorUserId: string;
  actorPlatformRole?: PlatformRole;
  membershipId: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: TenantRole;
}) {
  const membership = await prisma.tenantMembership.findFirst({
    where: { id: input.membershipId, tenantId: input.tenantId },
    include: { user: true },
  });
  if (!membership) throw new NotFoundError("Funcionário não encontrado.");
  if (isPlatformAdmin((membership.user.platformRole ?? "USER") as PlatformRole)) {
    throw new ForbiddenError("O usuário admin não pode ser alterado por aqui.");
  }
  const editingSelf = membership.userId === input.actorUserId;
  if (!editingSelf && !canManageTenantMember(input.actorRole, membership.role, input.actorPlatformRole)) {
    throw new ForbiddenError("Você não pode alterar este funcionário.");
  }
  if (editingSelf && input.role !== membership.role) {
    throw new ForbiddenError("Você não pode alterar o próprio papel.");
  }
  if (!editingSelf && input.role !== membership.role && !canAssignTenantRole(input.actorRole, input.role, input.actorPlatformRole)) {
    throw new ForbiddenError("Você não pode atribuir este papel.");
  }
  if (membership.role === "OWNER" && input.role !== "OWNER" && (await countOwners(input.tenantId)) <= 1) {
    throw new Error("A loja precisa de pelo menos um dono.");
  }

  const email = input.email.toLowerCase().trim();
  const name = input.name.trim();
  const username = normalizeUsername(input.username);
  if (!name || !email) throw new Error("Informe nome e e-mail.");

  const taken = await prisma.user.findFirst({
    where: { email, NOT: { id: membership.userId } },
  });
  if (taken) throw new ConflictError("Este e-mail já está em uso.");
  if (username) {
    const userTaken = await prisma.user.findFirst({
      where: { username, NOT: { id: membership.userId } },
    });
    if (userTaken) throw new ConflictError("Este usuário já está em uso.");
  }

  await prisma.user.update({
    where: { id: membership.userId },
    data: { name, email, username },
  });
  if (input.password?.trim()) {
    await setCredentialPassword(membership.userId, input.password);
    await writeAudit({
      action: "PASSWORD_CHANGE",
      entity: "User",
      entityId: membership.userId,
      tenantId: input.tenantId,
      userId: input.actorUserId,
    });
  }
  if (membership.role !== input.role) {
    await prisma.tenantMembership.update({
      where: { id: membership.id },
      data: { role: input.role },
    });
  }
  await writeAudit({
    action: "UPDATE",
    entity: "User",
    entityId: membership.userId,
    tenantId: input.tenantId,
    userId: input.actorUserId,
    metadata: { role: input.role, email },
  });
}

export async function removeTeamMember(input: {
  tenantId: string;
  actorRole: TenantRole;
  actorUserId: string;
  actorPlatformRole?: PlatformRole;
  membershipId: string;
}) {
  const membership = await prisma.tenantMembership.findFirst({
    where: { id: input.membershipId, tenantId: input.tenantId },
    include: { user: true },
  });
  if (!membership) throw new NotFoundError("Funcionário não encontrado.");
  if (membership.userId === input.actorUserId) {
    throw new Error("Você não pode remover a si mesmo.");
  }
  if (isPlatformAdmin((membership.user.platformRole ?? "USER") as PlatformRole)) {
    throw new ForbiddenError("O usuário admin não pode ser removido por aqui.");
  }
  if (!canManageTenantMember(input.actorRole, membership.role, input.actorPlatformRole)) {
    throw new ForbiddenError("Você não pode remover este funcionário.");
  }
  if (membership.role === "OWNER" && (await countOwners(input.tenantId)) <= 1) {
    throw new Error("A loja precisa de pelo menos um dono.");
  }
  await prisma.tenantMembership.delete({ where: { id: membership.id } });
  await writeAudit({
    action: "DELETE",
    entity: "TenantMembership",
    entityId: membership.id,
    tenantId: input.tenantId,
    userId: input.actorUserId,
    metadata: { userId: membership.userId },
  });
}
