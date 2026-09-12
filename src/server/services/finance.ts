import { prisma } from "@/lib/db";
import type { StockMovementType } from "@prisma/client";

export async function listInventory(tenantId: string) {
  return prisma.inventoryItem.findMany({
    where: { tenantId },
    include: { movements: { orderBy: { createdAt: "desc" }, take: 5 } },
    orderBy: { name: "asc" },
  });
}

export async function upsertInventoryItem(input: {
  tenantId: string;
  name: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  costCents: number;
}) {
  return prisma.inventoryItem.create({
    data: {
      tenantId: input.tenantId,
      name: input.name,
      unit: input.unit,
      quantity: input.quantity,
      minQuantity: input.minQuantity,
      costCents: input.costCents,
    },
  });
}

export async function addStockMovement(input: {
  tenantId: string;
  itemId: string;
  type: StockMovementType;
  quantity: number;
  notes?: string;
}) {
  const item = await prisma.inventoryItem.findFirst({
    where: { id: input.itemId, tenantId: input.tenantId },
  });
  if (!item) throw new Error("Insumo não encontrado.");
  const delta =
    input.type === "PURCHASE" || input.type === "RETURN" || input.type === "ADJUSTMENT"
      ? input.quantity
      : -Math.abs(input.quantity);
  const next = Number(item.quantity) + delta;
  if (next < 0) throw new Error("Estoque insuficiente para essa saída.");

  await prisma.$transaction([
    prisma.stockMovement.create({
      data: {
        tenantId: input.tenantId,
        itemId: item.id,
        type: input.type,
        quantity: Math.abs(input.quantity),
        notes: input.notes,
      },
    }),
    prisma.inventoryItem.update({
      where: { id: item.id },
      data: { quantity: next },
    }),
  ]);
}

export async function listFinance(tenantId: string) {
  const [expenses, revenues, sales] = await Promise.all([
    prisma.expense.findMany({ where: { tenantId }, orderBy: { dueDate: "desc" }, take: 50 }),
    prisma.revenue.findMany({ where: { tenantId }, orderBy: { receivedAt: "desc" }, take: 50 }),
    prisma.order.aggregate({
      where: { tenantId, status: { not: "CANCELLED" } },
      _sum: { totalCents: true },
    }),
  ]);
  const expenseTotal = expenses.reduce((sum, item) => sum + item.amountCents, 0);
  const revenueTotal = revenues.reduce((sum, item) => sum + item.amountCents, 0) + (sales._sum.totalCents ?? 0);
  return { expenses, revenues, expenseTotal, revenueTotal, salesTotal: sales._sum.totalCents ?? 0 };
}

export async function createExpense(input: {
  tenantId: string;
  category: string;
  description: string;
  amountCents: number;
  dueDate: Date;
}) {
  return prisma.expense.create({
    data: { ...input, dueDate: input.dueDate },
  });
}

export async function createRevenue(input: {
  tenantId: string;
  category: string;
  description: string;
  amountCents: number;
  receivedAt: Date;
}) {
  return prisma.revenue.create({ data: input });
}
