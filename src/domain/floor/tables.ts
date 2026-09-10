export const DEFAULT_TABLE_COUNT = 16;

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

export function buildFloorTables(openOrders: FloorOrder[], tableCount = DEFAULT_TABLE_COUNT): FloorTable[] {
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

  return Array.from({ length: tableCount }, (_, index) => {
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
