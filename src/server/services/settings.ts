import { prisma } from "@/lib/db";
import { writeAudit } from "@/server/audit";
import { normalizeTableCount } from "@/domain/floor/tables";
import { ensureSalonLayout } from "@/server/services/floor";
import type { PaymentMethod } from "@prisma/client";

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

export async function getStoreSettings(tenantId: string) {
  return prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    include: { hours: { orderBy: { weekday: "asc" } }, paymentMethods: true, salonSectors: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function saveStoreSettings(input: {
  tenantId: string;
  userId: string;
  name: string;
  tradeName?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  city?: string;
  state?: string;
  estimatedMinutes?: number;
  minimumOrderCents?: number;
  tableCount?: number;
  hours: { weekday: number; opensAt: string; closesAt: string; closed: boolean }[];
  methods: PaymentMethod[];
}) {
  const tenant = await prisma.tenant.update({
    where: { id: input.tenantId },
    data: {
      name: input.name,
      tradeName: input.tradeName || null,
      phone: input.phone || null,
      whatsapp: input.whatsapp || null,
      email: input.email || null,
      city: input.city || null,
      state: input.state || null,
      estimatedMinutes: input.estimatedMinutes ?? 40,
      minimumOrderCents: input.minimumOrderCents ?? 0,
      tableCount: normalizeTableCount(input.tableCount),
    },
  });

  for (const weekday of WEEKDAYS) {
    const hour = input.hours.find((item) => item.weekday === weekday) ?? {
      weekday,
      opensAt: "18:00",
      closesAt: "23:30",
      closed: false,
    };
    await prisma.businessHour.upsert({
      where: { tenantId_weekday: { tenantId: input.tenantId, weekday } },
      update: hour,
      create: { tenantId: input.tenantId, ...hour },
    });
  }

  const all: PaymentMethod[] = ["PIX", "CASH", "CARD", "ONLINE", "OTHER"];
  for (const method of all) {
    await prisma.tenantPaymentMethod.upsert({
      where: { tenantId_method: { tenantId: input.tenantId, method } },
      update: { enabled: input.methods.includes(method) },
      create: { tenantId: input.tenantId, method, enabled: input.methods.includes(method) },
    });
  }

  await writeAudit({
    action: "UPDATE",
    entity: "Tenant",
    entityId: tenant.id,
    tenantId: input.tenantId,
    userId: input.userId,
  });
  await ensureSalonLayout(input.tenantId);
  return tenant;
}
