"use server";

import { revalidatePath } from "next/cache";
import { requireTenantPermission } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { publicErrorMessage } from "@/lib/errors";
import { settleOrderById } from "@/server/services/pos";
import {
  cancelReservation,
  createSalonSector,
  joinSalonTables,
  occupyReservation,
  openSalonTable,
  reserveSalonTable,
  setTableBlocked,
  splitSalonTable,
  transferSalonTable,
  updateSalonTableGuest,
  vacateSalonTable,
  getFloorSnapshot,
} from "@/server/services/floor";
import { prisma } from "@/lib/db";

function revalidateFloor() {
  revalidatePath("/caixa");
  revalidatePath("/garcom");
  revalidatePath("/app/pedidos");
  revalidatePath("/app/cozinha");
}

async function readTableNumber(tenantId: string, tableId: string) {
  const table = await prisma.salonTable.findFirst({
    where: { id: tableId, tenantId },
    select: { number: true, currentOrderId: true },
  });
  if (!table) throw new Error("Mesa não encontrada.");
  return table;
}

export async function refreshFloorSnapshotAction() {
  const ctx = await requireTenantPermission(PERMISSIONS.ORDER_READ);
  return getFloorSnapshot(ctx.tenantId);
}

export async function openSalonTableAction(input: {
  tableId: string;
  customerName: string;
  partySize?: number;
  waiterId?: string;
}) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.ORDER_CREATE);
    await openSalonTable({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      tableId: input.tableId,
      customerName: input.customerName,
      partySize: input.partySize,
      waiterId: input.waiterId,
    });
    revalidateFloor();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error).message };
  }
}

export async function closeSalonTableAction(tableId: string) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.ORDER_UPDATE);
    const table = await readTableNumber(ctx.tenantId, tableId);
    if (table.currentOrderId) {
      await settleOrderById({ tenantId: ctx.tenantId, userId: ctx.userId, orderId: table.currentOrderId });
    } else {
      await vacateSalonTable({ tenantId: ctx.tenantId, userId: ctx.userId, tableId });
    }
    revalidateFloor();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error).message };
  }
}

export async function vacateSalonTableAction(tableId: string) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.ORDER_UPDATE);
    await vacateSalonTable({ tenantId: ctx.tenantId, userId: ctx.userId, tableId });
    revalidateFloor();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error).message };
  }
}

export async function reserveSalonTableAction(input: {
  tableId: string;
  reservationName: string;
  reservedAt: string;
  reservationPeople?: number;
  reservationNotes?: string;
}) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.ORDER_CREATE);
    await reserveSalonTable({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      tableId: input.tableId,
      reservationName: input.reservationName,
      reservedAt: new Date(input.reservedAt),
      reservationPeople: input.reservationPeople,
      reservationNotes: input.reservationNotes,
    });
    revalidateFloor();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error).message };
  }
}

export async function occupyReservationAction(tableId: string) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.ORDER_CREATE);
    await occupyReservation({ tenantId: ctx.tenantId, userId: ctx.userId, tableId });
    revalidateFloor();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error).message };
  }
}

export async function cancelReservationAction(tableId: string) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.ORDER_UPDATE);
    await cancelReservation({ tenantId: ctx.tenantId, userId: ctx.userId, tableId });
    revalidateFloor();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error).message };
  }
}

export async function blockSalonTableAction(tableId: string, blocked: boolean) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.ORDER_UPDATE);
    await setTableBlocked({ tenantId: ctx.tenantId, userId: ctx.userId, tableId, blocked });
    revalidateFloor();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error).message };
  }
}

export async function transferSalonTableAction(tableId: string, destinationTableId: string) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.ORDER_UPDATE);
    await transferSalonTable({ tenantId: ctx.tenantId, userId: ctx.userId, tableId, destinationTableId });
    revalidateFloor();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error).message };
  }
}

export async function joinSalonTablesAction(tableId: string, satelliteTableId: string) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.ORDER_UPDATE);
    await joinSalonTables({ tenantId: ctx.tenantId, userId: ctx.userId, tableId, satelliteTableId });
    revalidateFloor();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error).message };
  }
}

export async function splitSalonTableAction(input: {
  tableId: string;
  destinationTableId: string;
  itemIds: string[];
}) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.ORDER_UPDATE);
    await splitSalonTable({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      tableId: input.tableId,
      destinationTableId: input.destinationTableId,
      itemIds: input.itemIds,
    });
    revalidateFloor();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error).message };
  }
}

export async function updateSalonTableGuestAction(input: {
  tableId: string;
  customerName: string;
  partySize?: number;
  waiterId?: string;
}) {
  try {
    const ctx = await requireTenantPermission(PERMISSIONS.ORDER_UPDATE);
    await updateSalonTableGuest({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      tableId: input.tableId,
      customerName: input.customerName,
      partySize: input.partySize,
      waiterId: input.waiterId,
    });
    revalidateFloor();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error).message };
  }
}

export async function createSalonSectorAction(formData: FormData) {
  const ctx = await requireTenantPermission(PERMISSIONS.SETTINGS_WRITE);
  await createSalonSector({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    name: String(formData.get("sectorName") || ""),
    tableCount: Number(formData.get("sectorTableCount") || 4),
  });
  revalidateFloor();
  revalidatePath("/app/configuracoes");
}
