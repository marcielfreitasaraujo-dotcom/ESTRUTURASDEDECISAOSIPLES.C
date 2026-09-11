export const DEFAULT_TABLE_COUNT = 16;
export const MIN_TABLE_COUNT = 1;
export const MAX_TABLE_COUNT = 80;

export type FloorTableStatus = "free" | "occupied" | "bill";

export type FloorOrder = {
  id: string;
  tableNumber: string | null;
  publicCode: string;
  totalCents: number;
  paymentStatus: string;
};

export type FloorTable = {
  number: string;
  status: FloorTableStatus;
  order?: FloorOrder;
};

export function normalizeTableCount(value: unknown): number {
  const count = Number(value);
  if (!Number.isFinite(count)) return DEFAULT_TABLE_COUNT;
  return Math.min(MAX_TABLE_COUNT, Math.max(MIN_TABLE_COUNT, Math.round(count)));
}

export function assertSalonTableNumber(tableNumber: string, tableCount: number): string {
  const number = tableNumber.trim();
  const parsed = Number(number);
  const count = normalizeTableCount(tableCount);
  if (!/^\d+$/.test(number) || parsed < 1 || parsed > count) {
    throw new Error(`Informe uma mesa de 1 a ${count}.`);
  }
  return String(parsed);
}

export function buildFloorTables(openOrders: FloorOrder[], tableCount = DEFAULT_TABLE_COUNT): FloorTable[] {
  const count = normalizeTableCount(tableCount);
  const byTable = new Map<string, FloorOrder>();
  for (const order of openOrders) {
    const number = order.tableNumber?.trim();
    if (!number) continue;
    const current = byTable.get(number);
    if (!current) {
      byTable.set(number, order);
      continue;
    }
    const currentBill = current.paymentStatus !== "PAID";
    const nextBill = order.paymentStatus !== "PAID";
    if (nextBill && !currentBill) byTable.set(number, order);
  }

  return Array.from({ length: count }, (_, index) => {
    const number = String(index + 1);
    const order = byTable.get(number);
    if (!order) return { number, status: "free" as const };
    return {
      number,
      status: order.paymentStatus === "PAID" ? ("occupied" as const) : ("bill" as const),
      order,
    };
  });
}

export function salonTableNumbers(tableCount: number): string[] {
  return Array.from({ length: normalizeTableCount(tableCount) }, (_, index) => String(index + 1));
}
