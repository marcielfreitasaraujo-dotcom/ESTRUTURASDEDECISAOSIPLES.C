import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

export async function writeAudit(input: {
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  userId?: string | null;
  tenantId?: string | null;
  ip?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({
    data: {
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      userId: input.userId ?? null,
      tenantId: input.tenantId ?? null,
      ip: input.ip ?? null,
      metadata: input.metadata ?? Prisma.JsonNull,
    },
  });
}
