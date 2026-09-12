import { prisma } from "@/lib/db";
import { writeAudit } from "@/server/audit";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import {
  PLATFORM_ROLES,
  TENANT_ROLES,
  canSetPlatformRole,
  type PlatformRole,
  type TenantRole,
} from "@/domain/rbac/roles";
import { setCredentialPassword } from "@/server/services/credentials";
import { normalizeUsername } from "@/server/services/login";

export async function createPlatformUser(input: {
  actorUserId: string;
  actorPlatformRole: PlatformRole;
  name: string;
  email: string;
  username?: string;
  password: string;
  platformRole: PlatformRole;
  tenantId?: string;
  tenantRole?: TenantRole;
}) {
  if (!PLATFORM_ROLES.includes(input.platformRole)) throw new Error("Papel da plataforma inválido.");
  if (!canSetPlatformRole(input.actorPlatformRole, input.platformRole)) {
    throw new ForbiddenError("Você não pode atribuir este papel da plataforma.");
  }
  const email = input.email.toLowerCase().trim();
  const name = input.name.trim();
  const username = normalizeUsername(input.username);
  if (!name || !email) throw new Error("Informe nome e e-mail.");
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new ConflictError("Este e-mail já está cadastrado.");
  if (username) {
    const taken = await prisma.user.findFirst({ where: { username } });
    if (taken) throw new ConflictError("Este usuário já está em uso.");
  }

  const id = crypto.randomUUID();
  const user = await prisma.user.create({
    data: {
      id,
      name,
      email,
      username,
      emailVerified: true,
      platformRole: input.platformRole,
    },
  });
  await setCredentialPassword(user.id, input.password);

  if (input.tenantId && input.tenantRole) {
    if (!TENANT_ROLES.includes(input.tenantRole)) throw new Error("Papel da loja inválido.");
    const tenant = await prisma.tenant.findUnique({ where: { id: input.tenantId } });
    if (!tenant) throw new NotFoundError("Estabelecimento não encontrado.");
    await prisma.tenantMembership.create({
      data: { tenantId: tenant.id, userId: user.id, role: input.tenantRole },
    });
  }

  await writeAudit({
    action: "CREATE",
    entity: "User",
    entityId: user.id,
    userId: input.actorUserId,
    tenantId: input.tenantId,
    metadata: { email, platformRole: input.platformRole, tenantRole: input.tenantRole },
  });
  return user;
}

export async function updatePlatformUser(input: {
  actorUserId: string;
  actorPlatformRole: PlatformRole;
  userId: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  platformRole: PlatformRole;
}) {
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) throw new NotFoundError("Usuário não encontrado.");
  if (!canSetPlatformRole(input.actorPlatformRole, input.platformRole)) {
    throw new ForbiddenError("Você não pode atribuir este papel da plataforma.");
  }
  if (user.platformRole !== "USER" && !canSetPlatformRole(input.actorPlatformRole, user.platformRole)) {
    throw new ForbiddenError("Você não pode alterar este usuário.");
  }
  if (user.platformRole === "SUPER_ADMIN" && input.platformRole !== "SUPER_ADMIN") {
    const supers = await prisma.user.count({ where: { platformRole: "SUPER_ADMIN" } });
    if (supers <= 1) throw new Error("A plataforma precisa de pelo menos um super admin.");
  }

  const email = input.email.toLowerCase().trim();
  const name = input.name.trim();
  const username = normalizeUsername(input.username);
  if (!name || !email) throw new Error("Informe nome e e-mail.");
  const taken = await prisma.user.findFirst({ where: { email, NOT: { id: user.id } } });
  if (taken) throw new ConflictError("Este e-mail já está em uso.");
  if (username) {
    const userTaken = await prisma.user.findFirst({ where: { username, NOT: { id: user.id } } });
    if (userTaken) throw new ConflictError("Este usuário já está em uso.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name, email, username, platformRole: input.platformRole },
  });
  if (input.password?.trim()) {
    await setCredentialPassword(user.id, input.password);
    await writeAudit({
      action: "PASSWORD_CHANGE",
      entity: "User",
      entityId: user.id,
      userId: input.actorUserId,
    });
  }
  await writeAudit({
    action: "UPDATE",
    entity: "User",
    entityId: user.id,
    userId: input.actorUserId,
    metadata: { email, platformRole: input.platformRole },
  });
}

export async function upsertUserMembership(input: {
  actorUserId: string;
  userId: string;
  tenantId: string;
  role: TenantRole;
}) {
  if (!TENANT_ROLES.includes(input.role)) throw new Error("Papel da loja inválido.");
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) throw new NotFoundError("Usuário não encontrado.");
  const tenant = await prisma.tenant.findUnique({ where: { id: input.tenantId } });
  if (!tenant) throw new NotFoundError("Estabelecimento não encontrado.");

  const membership = await prisma.tenantMembership.upsert({
    where: { tenantId_userId: { tenantId: input.tenantId, userId: input.userId } },
    update: { role: input.role },
    create: { tenantId: input.tenantId, userId: input.userId, role: input.role },
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

export async function removeUserMembership(input: {
  actorUserId: string;
  membershipId: string;
}) {
  const membership = await prisma.tenantMembership.findUnique({ where: { id: input.membershipId } });
  if (!membership) throw new NotFoundError("Vínculo não encontrado.");
  if (membership.role === "OWNER") {
    const owners = await prisma.tenantMembership.count({
      where: { tenantId: membership.tenantId, role: "OWNER" },
    });
    if (owners <= 1) throw new Error("A loja precisa de pelo menos um dono.");
  }
  await prisma.tenantMembership.delete({ where: { id: membership.id } });
  await writeAudit({
    action: "DELETE",
    entity: "TenantMembership",
    entityId: membership.id,
    tenantId: membership.tenantId,
    userId: input.actorUserId,
    metadata: { userId: membership.userId },
  });
}
