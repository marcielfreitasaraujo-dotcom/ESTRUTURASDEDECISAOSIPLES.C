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
