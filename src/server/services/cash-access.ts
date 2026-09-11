import { prisma } from "@/lib/db";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { isPlatformAdmin, isStoreGerente } from "@/domain/rbac/roles";

export async function actorManagesCash(tenantId: string, userId: string) {
  const [membership, user] = await Promise.all([
    prisma.tenantMembership.findFirst({
      where: { tenantId, userId, active: true, role: { in: ["OWNER", "MANAGER"] } },
      select: { id: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { platformRole: true } }),
  ]);
  return Boolean(membership) || Boolean(user && isPlatformAdmin(user.platformRole));
}

export async function assertCanViewCashSession(input: {
  tenantId: string;
  userId: string;
  session: { operatorId: string; openedById: string };
  role?: string | null;
}) {
  if (isStoreGerente(input.role as "OWNER" | "MANAGER" | null) || (await actorManagesCash(input.tenantId, input.userId))) {
    return;
  }
  if (input.session.operatorId !== input.userId && input.session.openedById !== input.userId) {
    throw new ForbiddenError("Você só pode consultar o próprio caixa.");
  }
}

export async function assertCanOperateOpenSession(input: {
  tenantId: string;
  userId: string;
  session: { id: string; status: string; operatorId: string; openedById: string };
}) {
  if (input.session.status !== "OPEN") {
    throw new ForbiddenError("Este caixa já foi fechado.");
  }
  const manages = await actorManagesCash(input.tenantId, input.userId);
  if (manages) return;
  if (input.session.operatorId !== input.userId && input.session.openedById !== input.userId) {
    throw new ForbiddenError("Você só pode operar o próprio caixa.");
  }
}

export async function getCashSessionOrThrow(tenantId: string, sessionId: string) {
  const session = await prisma.cashSession.findFirst({
    where: { id: sessionId, tenantId },
    include: {
      terminal: true,
      operator: { select: { id: true, name: true, displayName: true, operatorCode: true } },
      openedBy: { select: { id: true, name: true, displayName: true } },
      closedBy: { select: { id: true, name: true, displayName: true } },
      conferredBy: { select: { id: true, name: true, displayName: true } },
    },
  });
  if (!session) throw new NotFoundError("Caixa não encontrado.");
  return session;
}
