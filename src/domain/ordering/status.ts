export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED[from].includes(to);
}

export function assertTransition(from: OrderStatus, to: OrderStatus) {
  if (!canTransition(from, to)) {
    throw new Error(`Não é possível mudar o pedido de ${from} para ${to}.`);
  }
}

export const KANBAN_COLUMNS: { key: OrderStatus; title: string }[] = [
  { key: "PENDING", title: "Novos" },
  { key: "CONFIRMED", title: "Confirmados" },
  { key: "PREPARING", title: "Preparando" },
  { key: "READY", title: "Prontos" },
  { key: "OUT_FOR_DELIVERY", title: "Saiu para entrega" },
  { key: "DELIVERED", title: "Finalizados" },
];
