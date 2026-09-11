import { prisma } from "@/lib/db";

export async function upsertCustomerByPhone(input: {
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
}) {
  const phone = input.phone.replace(/\D/g, "") || input.phone;
  return prisma.customer.upsert({
    where: { tenantId_phone: { tenantId: input.tenantId, phone } },
    update: { name: input.name, email: input.email },
    create: {
      tenantId: input.tenantId,
      name: input.name,
      phone,
      email: input.email,
    },
  });
}

export async function listCustomers(tenantId: string) {
  return prisma.customer.findMany({
    where: { tenantId },
    include: {
      _count: { select: { orders: true } },
      orders: { select: { totalCents: true, createdAt: true }, orderBy: { createdAt: "desc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export function customerCrmStats(
  customers: Awaited<ReturnType<typeof listCustomers>>,
  nowMs = Date.now(),
) {
  return {
    newCount: customers.filter(
      (customer) => nowMs - customer.updatedAt.getTime() < 30 * 86_400_000 && customer._count.orders <= 1,
    ).length,
    recurring: customers.filter((customer) => customer._count.orders >= 2).length,
    inactive: customers.filter((customer) => {
      const last = customer.orders[0]?.createdAt;
      return !last || nowMs - last.getTime() > 45 * 86_400_000;
    }).length,
  };
}

export async function createCustomer(input: {
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}) {
  return prisma.customer.create({
    data: {
      tenantId: input.tenantId,
      name: input.name,
      phone: input.phone.replace(/\D/g, "") || input.phone,
      email: input.email,
      notes: input.notes,
    },
  });
}
