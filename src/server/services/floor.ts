import { prisma } from "@/lib/db";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { calculateCheckoutTotals } from "@/domain/ordering/checkout";
import { normalizeTableCount } from "@/domain/floor/tables";
import { summarizeFloorStatus } from "@/domain/floor/status";
import type { FloorSnapshot, FloorTableSnapshot } from "@/domain/floor/snapshot";
import { writeAudit } from "@/server/audit";
import type { Prisma, SalonTable, SalonTableStatus } from "@prisma/client";

const DEFAULT_SECTOR = { name: "Salão", slug: "salao" };

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "setor";
}

function clearOccupancy(): Prisma.SalonTableUncheckedUpdateInput {
  return {
    status: "FREE",
    currentOrderId: null,
    waiterId: null,
    customerName: null,
    partySize: null,
    openedAt: null,
    reservedAt: null,
    reservationName: null,
    reservationPeople: null,
    reservationNotes: null,
    joinedToTableId: null,
  };
}

async function nextOrderNumber(tenantId: string) {
  const last = await prisma.order.findFirst({
    where: { tenantId },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  return (last?.number ?? 1000) + 1;
}

async function createOpenTableOrder(input: {
  tenantId: string;
  userId: string;
  tableNumber: string;
  customerName: string;
  partySize?: number | null;
  waiterId?: string | null;
}) {
  const number = await nextOrderNumber(input.tenantId);
  return prisma.order.create({
    data: {
      tenantId: input.tenantId,
      number,
      publicCode: number.toString().padStart(4, "0"),
      status: "PENDING",
      fulfillment: "DINE_IN",
      tableNumber: input.tableNumber,
      customerName: input.customerName,
      customerPhone: "00000000",
      partySize: input.partySize ?? null,
      waiterId: input.waiterId ?? null,
      subtotalCents: 0,
      discountCents: 0,
      deliveryFeeCents: 0,
      totalCents: 0,
      paymentMethod: "CASH",
      paymentStatus: "PENDING",
      idempotencyKey: crypto.randomUUID(),
      statusHistory: {
        create: { tenantId: input.tenantId, toStatus: "PENDING", changedById: input.userId },
      },
      payments: {
        create: {
          tenantId: input.tenantId,
          provider: "manual",
          method: "CASH",
          status: "PENDING",
          amountCents: 0,
        },
      },
    },
  });
}

async function defaultSector(tenantId: string) {
  return prisma.salonSector.upsert({
    where: { tenantId_slug: { tenantId, slug: DEFAULT_SECTOR.slug } },
    update: {},
    create: { tenantId, name: DEFAULT_SECTOR.name, slug: DEFAULT_SECTOR.slug, sortOrder: 0 },
  });
}

export async function ensureSalonLayout(tenantId: string) {
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: { tableCount: true },
  });
  const sector = await defaultSector(tenantId);
  const count = normalizeTableCount(tenant.tableCount);
  const existing = await prisma.salonTable.findMany({
    where: { tenantId, sectorId: sector.id },
    select: { number: true },
  });
  const present = new Set(existing.map((table) => table.number));
  for (let index = 1; index <= count; index += 1) {
    const number = String(index);
    if (present.has(number)) continue;
    await prisma.salonTable.create({
      data: { tenantId, sectorId: sector.id, number, sortOrder: index },
    });
  }
  await syncOccupancyFromOpenOrders(tenantId);
}

async function syncOccupancyFromOpenOrders(tenantId: string) {
  const open = await prisma.order.findMany({
    where: { tenantId, status: { notIn: ["DELIVERED", "CANCELLED"] }, tableNumber: { not: null } },
    include: { waiter: { select: { name: true } }, items: true },
    orderBy: { createdAt: "asc" },
  });
  for (const order of open) {
    const number = order.tableNumber?.trim();
    if (!number) continue;
    const table = await prisma.salonTable.findFirst({
      where: { tenantId, number, joinedToTableId: null },
      orderBy: { sortOrder: "asc" },
    });
    if (!table) continue;
    if (table.status === "BLOCKED") continue;
    if (table.status === "OCCUPIED" && table.currentOrderId && table.currentOrderId !== order.id) continue;
    await prisma.salonTable.update({
      where: { id: table.id },
      data: {
        status: "OCCUPIED",
        currentOrderId: order.id,
        customerName: order.customerName,
        partySize: order.partySize ?? table.partySize,
        waiterId: order.waiterId ?? table.waiterId,
        openedAt: table.openedAt ?? order.createdAt,
      },
    });
  }
}

function toSnapshot(table: SalonTable & {
  sector: { id: string; name: string };
  waiter: { name: string } | null;
  currentOrder: {
    id: string;
    publicCode: string;
    customerName: string;
    totalCents: number;
    paymentStatus: string;
    status: string;
    partySize: number | null;
    createdAt: Date;
    waiter: { name: string } | null;
    items: { id: string; name: string; quantity: number; totalCents: number; notes: string | null }[];
  } | null;
  joinedTables: { number: string }[];
}): FloorTableSnapshot {
  const order = table.currentOrder;
  return {
    id: table.id,
    number: table.number,
    name: table.name,
    status: table.status,
    sectorId: table.sectorId,
    sectorName: table.sector.name,
    seats: table.seats,
    customerName: order?.customerName ?? table.customerName,
    partySize: order?.partySize ?? table.partySize,
    waiterName: order?.waiter?.name ?? table.waiter?.name ?? null,
    waiterId: table.waiterId,
    openedAt: table.openedAt?.toISOString() ?? order?.createdAt.toISOString() ?? null,
    reservedAt: table.reservedAt?.toISOString() ?? null,
    reservationName: table.reservationName,
    reservationPeople: table.reservationPeople,
    reservationNotes: table.reservationNotes,
    joinedToTableId: table.joinedToTableId,
    joinedNumbers: table.joinedTables.map((item) => item.number),
    order: order
      ? {
          id: order.id,
          publicCode: order.publicCode,
          customerName: order.customerName,
          totalCents: order.totalCents,
          paymentStatus: order.paymentStatus,
          status: order.status,
          partySize: order.partySize,
          waiterName: order.waiter?.name ?? null,
          createdAt: order.createdAt.toISOString(),
          items: order.items.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            totalCents: item.totalCents,
            notes: item.notes,
          })),
        }
      : null,
  };
}

export async function getFloorSnapshot(tenantId: string): Promise<FloorSnapshot> {
  await ensureSalonLayout(tenantId);
  const [sectors, tables] = await Promise.all([
    prisma.salonSector.findMany({ where: { tenantId }, orderBy: { sortOrder: "asc" } }),
    prisma.salonTable.findMany({
      where: { tenantId },
      include: {
        sector: { select: { id: true, name: true } },
        waiter: { select: { name: true } },
        currentOrder: {
          include: {
            waiter: { select: { name: true } },
            items: { orderBy: { name: "asc" } },
          },
        },
        joinedTables: { select: { number: true } },
      },
      orderBy: [{ sector: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    }),
  ]);
  const visible = tables.filter((table) => !table.joinedToTableId);
  const mapped = visible.map(toSnapshot);
  return {
    generatedAt: new Date().toISOString(),
    sectors: sectors.map((sector) => ({ id: sector.id, name: sector.name, slug: sector.slug })),
    tables: mapped,
    counts: summarizeFloorStatus(mapped.map((table) => table.status)),
  };
}

async function getOwnedTable(tenantId: string, tableId: string) {
  const table = await prisma.salonTable.findFirst({
    where: { id: tableId, tenantId },
    include: { joinedTables: true, currentOrder: { include: { items: true } } },
  });
  if (!table) throw new NotFoundError("Mesa não encontrada.");
  return table;
}

export async function occupyTableByNumber(input: {
  tenantId: string;
  tableNumber: string;
  orderId?: string;
  customerName?: string;
  waiterId?: string;
  partySize?: number;
}) {
  await ensureSalonLayout(input.tenantId);
  const table = await prisma.salonTable.findFirst({
    where: { tenantId: input.tenantId, number: input.tableNumber.trim(), joinedToTableId: null },
    orderBy: { sortOrder: "asc" },
  });
  if (!table) return null;
  if (table.status === "BLOCKED") throw new ConflictError("Essa mesa está bloqueada.");
  return prisma.salonTable.update({
    where: { id: table.id },
    data: {
      status: "OCCUPIED",
      currentOrderId: input.orderId ?? table.currentOrderId,
      customerName: input.customerName ?? table.customerName,
      waiterId: input.waiterId ?? table.waiterId,
      partySize: input.partySize ?? table.partySize,
      openedAt: table.openedAt ?? new Date(),
      reservedAt: null,
      reservationName: null,
      reservationPeople: null,
      reservationNotes: null,
    },
  });
}

export async function freeTablesForOrder(tenantId: string, orderId: string) {
  const tables = await prisma.salonTable.findMany({
    where: { tenantId, OR: [{ currentOrderId: orderId }, { joinedToTableId: { not: null } }] },
  });
  const primaryIds = tables.filter((table) => table.currentOrderId === orderId).map((table) => table.id);
  await prisma.salonTable.updateMany({
    where: { tenantId, OR: [{ currentOrderId: orderId }, { joinedToTableId: { in: primaryIds } }] },
    data: clearOccupancy() as Prisma.SalonTableUpdateManyMutationInput,
  });
}

export async function freeTableByNumber(tenantId: string, tableNumber: string) {
  const tables = await prisma.salonTable.findMany({
    where: { tenantId, number: tableNumber.trim() },
  });
  const ids = tables.map((table) => table.id);
  await prisma.salonTable.updateMany({
    where: { tenantId, OR: [{ id: { in: ids } }, { joinedToTableId: { in: ids } }] },
    data: clearOccupancy() as Prisma.SalonTableUpdateManyMutationInput,
  });
}

export async function openSalonTable(input: {
  tenantId: string;
  userId: string;
  tableId: string;
  customerName: string;
  partySize?: number;
  waiterId?: string;
}) {
  const table = await getOwnedTable(input.tenantId, input.tableId);
  if (table.status !== "FREE") throw new ConflictError("Essa mesa não está livre.");
  const name = input.customerName.trim();
  if (!name) throw new Error("Informe o nome do cliente.");
  const partySize = input.partySize && input.partySize > 0 ? input.partySize : null;
  const waiterId = input.waiterId || null;
  const order = await createOpenTableOrder({
    tenantId: input.tenantId,
    userId: input.userId,
    tableNumber: table.number,
    customerName: name,
    partySize,
    waiterId,
  });
  const updated = await prisma.salonTable.update({
    where: { id: table.id },
    data: {
      status: "OCCUPIED",
      currentOrderId: order.id,
      customerName: name,
      partySize,
      waiterId,
      openedAt: new Date(),
    },
  });
  await writeAudit({
    action: "UPDATE",
    entity: "SalonTable",
    entityId: table.id,
    tenantId: input.tenantId,
    userId: input.userId,
    metadata: { status: "OCCUPIED", number: table.number },
  });
  return updated;
}

export async function updateSalonTableGuest(input: {
  tenantId: string;
  userId: string;
  tableId: string;
  customerName: string;
  partySize?: number;
  waiterId?: string;
}) {
  const table = await getOwnedTable(input.tenantId, input.tableId);
  if (table.status !== "OCCUPIED") throw new ConflictError("Só é possível alterar cliente em mesa ocupada.");
  const name = input.customerName.trim();
  if (!name) throw new Error("Informe o nome do cliente.");
  await prisma.salonTable.update({
    where: { id: table.id },
    data: {
      customerName: name,
      partySize: input.partySize && input.partySize > 0 ? input.partySize : table.partySize,
      waiterId: input.waiterId || table.waiterId,
    },
  });
  if (table.currentOrderId) {
    await prisma.order.update({
      where: { id: table.currentOrderId },
      data: {
        customerName: name,
        partySize: input.partySize && input.partySize > 0 ? input.partySize : undefined,
        waiterId: input.waiterId || undefined,
      },
    });
  }
}

export async function reserveSalonTable(input: {
  tenantId: string;
  userId: string;
  tableId: string;
  reservationName: string;
  reservedAt: Date;
  reservationPeople?: number;
  reservationNotes?: string;
}) {
  const table = await getOwnedTable(input.tenantId, input.tableId);
  if (table.status !== "FREE" && table.status !== "RESERVED") {
    throw new ConflictError("Só é possível reservar uma mesa livre.");
  }
  const name = input.reservationName.trim();
  if (!name) throw new Error("Informe o nome da reserva.");
  if (Number.isNaN(input.reservedAt.getTime())) throw new Error("Informe o horário da reserva.");
  const updated = await prisma.salonTable.update({
    where: { id: table.id },
    data: {
      status: "RESERVED",
      reservationName: name,
      reservedAt: input.reservedAt,
      reservationPeople: input.reservationPeople && input.reservationPeople > 0 ? input.reservationPeople : null,
      reservationNotes: input.reservationNotes?.trim() || null,
    },
  });
  await writeAudit({
    action: "UPDATE",
    entity: "SalonTable",
    entityId: table.id,
    tenantId: input.tenantId,
    userId: input.userId,
    metadata: { status: "RESERVED", number: table.number },
  });
  return updated;
}

export async function occupyReservation(input: {
  tenantId: string;
  userId: string;
  tableId: string;
}) {
  const table = await getOwnedTable(input.tenantId, input.tableId);
  if (table.status !== "RESERVED") throw new ConflictError("Essa mesa não está reservada.");
  const name = table.reservationName?.trim() || `Mesa ${table.number}`;
  const order = await createOpenTableOrder({
    tenantId: input.tenantId,
    userId: input.userId,
    tableNumber: table.number,
    customerName: name,
    partySize: table.reservationPeople,
    waiterId: table.waiterId,
  });
  return prisma.salonTable.update({
    where: { id: table.id },
    data: {
      status: "OCCUPIED",
      currentOrderId: order.id,
      customerName: name,
      partySize: table.reservationPeople,
      openedAt: new Date(),
      reservedAt: null,
      reservationName: null,
      reservationPeople: null,
      reservationNotes: null,
    },
  });
}

export async function cancelReservation(input: { tenantId: string; userId: string; tableId: string }) {
  const table = await getOwnedTable(input.tenantId, input.tableId);
  if (table.status !== "RESERVED") throw new ConflictError("Essa mesa não está reservada.");
  return prisma.salonTable.update({
    where: { id: table.id },
    data: clearOccupancy(),
  });
}

export async function setTableBlocked(input: {
  tenantId: string;
  userId: string;
  tableId: string;
  blocked: boolean;
}) {
  const table = await getOwnedTable(input.tenantId, input.tableId);
  if (input.blocked && table.status !== "FREE") {
    throw new ConflictError("Só é possível bloquear uma mesa livre.");
  }
  if (!input.blocked && table.status !== "BLOCKED") {
    throw new ConflictError("Essa mesa não está bloqueada.");
  }
  return prisma.salonTable.update({
    where: { id: table.id },
    data: input.blocked ? { status: "BLOCKED" } : clearOccupancy(),
  });
}

export async function transferSalonTable(input: {
  tenantId: string;
  userId: string;
  tableId: string;
  destinationTableId: string;
}) {
  if (input.tableId === input.destinationTableId) throw new Error("Escolha outra mesa.");
  const source = await getOwnedTable(input.tenantId, input.tableId);
  const destination = await getOwnedTable(input.tenantId, input.destinationTableId);
  if (source.status !== "OCCUPIED") throw new ConflictError("Só é possível transferir uma mesa ocupada.");
  if (destination.status !== "FREE") throw new ConflictError("A mesa de destino precisa estar livre.");
  await prisma.$transaction(async (tx) => {
    if (source.currentOrderId) {
      await tx.order.update({
        where: { id: source.currentOrderId },
        data: { tableNumber: destination.number },
      });
    }
    await tx.salonTable.update({
      where: { id: destination.id },
      data: {
        status: "OCCUPIED",
        currentOrderId: source.currentOrderId,
        waiterId: source.waiterId,
        customerName: source.customerName,
        partySize: source.partySize,
        openedAt: source.openedAt ?? new Date(),
      },
    });
    await tx.salonTable.updateMany({
      where: { joinedToTableId: source.id },
      data: { joinedToTableId: destination.id },
    });
    await tx.salonTable.update({
      where: { id: source.id },
      data: clearOccupancy(),
    });
  });
}

export async function joinSalonTables(input: {
  tenantId: string;
  userId: string;
  tableId: string;
  satelliteTableId: string;
}) {
  if (input.tableId === input.satelliteTableId) throw new Error("Escolha outra mesa.");
  const primary = await getOwnedTable(input.tenantId, input.tableId);
  const satellite = await getOwnedTable(input.tenantId, input.satelliteTableId);
  if (primary.status !== "OCCUPIED") throw new ConflictError("Junte mesas a partir de uma mesa ocupada.");
  if (satellite.status !== "FREE") throw new ConflictError("A mesa extra precisa estar livre.");
  await prisma.salonTable.update({
    where: { id: satellite.id },
    data: {
      status: "OCCUPIED",
      joinedToTableId: primary.id,
      currentOrderId: primary.currentOrderId,
      customerName: primary.customerName,
      waiterId: primary.waiterId,
      openedAt: primary.openedAt ?? new Date(),
    },
  });
}

export async function splitSalonTable(input: {
  tenantId: string;
  userId: string;
  tableId: string;
  destinationTableId: string;
  itemIds: string[];
}) {
  if (input.tableId === input.destinationTableId) throw new Error("Escolha outra mesa.");
  const source = await getOwnedTable(input.tenantId, input.tableId);
  const destination = await getOwnedTable(input.tenantId, input.destinationTableId);
  if (source.status !== "OCCUPIED" || !source.currentOrder) {
    throw new ConflictError("A mesa de origem precisa ter uma comanda.");
  }
  if (destination.status !== "FREE") throw new ConflictError("A mesa de destino precisa estar livre.");
  const moving = source.currentOrder.items.filter((item) => input.itemIds.includes(item.id));
  if (moving.length === 0) throw new Error("Selecione ao menos um item para dividir.");
  const remaining = source.currentOrder.items.filter((item) => !input.itemIds.includes(item.id));
  if (remaining.length === 0) throw new Error("Deixe ao menos um item na mesa original, ou use transferir.");

  const last = await prisma.order.findFirst({
    where: { tenantId: input.tenantId },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const number = (last?.number ?? 1000) + 1;
  const destTotals = calculateCheckoutTotals({
    items: moving.map((item) => ({ name: item.name, unitPriceCents: item.totalCents / item.quantity, quantity: item.quantity })),
    discountCents: 0,
    deliveryFeeCents: 0,
  });
  const sourceTotals = calculateCheckoutTotals({
    items: remaining.map((item) => ({ name: item.name, unitPriceCents: item.totalCents / item.quantity, quantity: item.quantity })),
    discountCents: 0,
    deliveryFeeCents: 0,
  });

  await prisma.$transaction(async (tx) => {
    const destOrder = await tx.order.create({
      data: {
        tenantId: input.tenantId,
        number,
        publicCode: number.toString().padStart(4, "0"),
        status: source.currentOrder!.status,
        fulfillment: "DINE_IN",
        tableNumber: destination.number,
        customerName: source.currentOrder!.customerName,
        customerPhone: "00000000",
        partySize: source.partySize,
        waiterId: source.waiterId,
        subtotalCents: destTotals.subtotalCents,
        discountCents: 0,
        deliveryFeeCents: 0,
        totalCents: destTotals.totalCents,
        paymentMethod: "CASH",
        paymentStatus: "PENDING",
        idempotencyKey: crypto.randomUUID(),
        confirmedAt: new Date(),
        items: {
          create: moving.map((item) => ({
            tenantId: input.tenantId,
            productId: null,
            name: item.name,
            quantity: item.quantity,
            unitPriceCents: Math.round(item.totalCents / item.quantity),
            totalCents: item.totalCents,
            notes: item.notes,
          })),
        },
        statusHistory: {
          create: { tenantId: input.tenantId, toStatus: source.currentOrder!.status, changedById: input.userId },
        },
        payments: {
          create: {
            tenantId: input.tenantId,
            provider: "manual",
            method: "CASH",
            status: "PENDING",
            amountCents: destTotals.totalCents,
          },
        },
      },
    });
    await tx.orderItem.deleteMany({ where: { id: { in: moving.map((item) => item.id) } } });
    await tx.order.update({
      where: { id: source.currentOrder!.id },
      data: {
        subtotalCents: sourceTotals.subtotalCents,
        totalCents: sourceTotals.totalCents,
      },
    });
    await tx.payment.updateMany({
      where: { orderId: source.currentOrder!.id, tenantId: input.tenantId },
      data: { amountCents: sourceTotals.totalCents },
    });
    await tx.salonTable.update({
      where: { id: destination.id },
      data: {
        status: "OCCUPIED",
        currentOrderId: destOrder.id,
        customerName: source.customerName,
        waiterId: source.waiterId,
        openedAt: new Date(),
      },
    });
  });
}

export async function vacateSalonTable(input: { tenantId: string; userId: string; tableId: string }) {
  const table = await getOwnedTable(input.tenantId, input.tableId);
  if (table.status !== "OCCUPIED") throw new ConflictError("Essa mesa já está livre.");
  await prisma.$transaction(async (tx) => {
    if (table.currentOrderId) {
      await tx.order.update({
        where: { id: table.currentOrderId },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      await tx.orderStatusHistory.create({
        data: {
          tenantId: input.tenantId,
          orderId: table.currentOrderId,
          fromStatus: table.currentOrder?.status,
          toStatus: "CANCELLED",
          changedById: input.userId,
        },
      });
    }
    await tx.salonTable.updateMany({
      where: { OR: [{ id: table.id }, { joinedToTableId: table.id }] },
      data: clearOccupancy() as Prisma.SalonTableUpdateManyMutationInput,
    });
  });
}

export async function createSalonSector(input: {
  tenantId: string;
  userId: string;
  name: string;
  tableCount: number;
}) {
  const name = input.name.trim();
  if (!name) throw new Error("Informe o nome do setor.");
  let slug = slugify(name);
  const clash = await prisma.salonSector.findUnique({ where: { tenantId_slug: { tenantId: input.tenantId, slug } } });
  if (clash) slug = `${slug}-${Date.now().toString().slice(-4)}`;
  const last = await prisma.salonSector.findFirst({
    where: { tenantId: input.tenantId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const sector = await prisma.salonSector.create({
    data: {
      tenantId: input.tenantId,
      name,
      slug,
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });
  const count = normalizeTableCount(input.tableCount);
  for (let index = 1; index <= count; index += 1) {
    await prisma.salonTable.create({
      data: { tenantId: input.tenantId, sectorId: sector.id, number: String(index), sortOrder: index },
    });
  }
  await writeAudit({
    action: "CREATE",
    entity: "SalonSector",
    entityId: sector.id,
    tenantId: input.tenantId,
    userId: input.userId,
    metadata: { name, tableCount: count },
  });
  return sector;
}

export function isOpenableStatus(status: SalonTableStatus) {
  return status === "FREE";
}
