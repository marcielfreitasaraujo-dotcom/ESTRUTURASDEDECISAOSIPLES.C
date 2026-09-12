export type SalesRange = "today" | "7d" | "30d" | "month";

export type ControlAlert = {
  id: string;
  tone: "warn" | "alert" | "info";
  title: string;
  detail: string;
  href: string;
};

export type ControlCenterSnapshot = {
  generatedAt: string;
  storeName: string;
  storeSlug: string;
  greeting: string;
  kpis: {
    todaySalesCents: number;
    yesterdaySalesCents: number;
    todaySalesDelta: number;
    monthSalesCents: number;
    todayOrders: number;
    yesterdayOrders: number;
    openOrders: number;
    averageTicketCents: number;
    customers: number;
    tablesOccupied: number;
    tablesTotal: number;
    deliveriesOpen: number;
  };
  cash: {
    open: boolean;
    balanceCents: number;
    openedAt: string | null;
    operatorName: string | null;
  };
  salesSeries: { label: string; salesCents: number; orders: number }[];
  payments: { method: string; label: string; cents: number; percent: number }[];
  recentOrders: {
    id: string;
    publicCode: string;
    customerName: string;
    channel: string;
    createdAt: string;
    totalCents: number;
    status: string;
    statusLabel: string;
  }[];
  operation: {
    tables: { total: number; free: number; occupied: number; reserved: number; blocked: number };
    kitchen: { waiting: number; preparing: number; ready: number };
    delivery: { waiting: number; inRoute: number; deliveredToday: number };
    tracking: { received: number; preparing: number; ready: number; delivering: number; late: number };
  };
  alerts: ControlAlert[];
  notifications: ControlAlert[];
  topProducts: { name: string; quantity: number; cents: number }[];
};

export function percentDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function greetingForHour(hour: number, name: string): string {
  const hello = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const first = name.trim().split(/\s+/)[0] || "time";
  return `${hello}, ${first}.`;
}

export function rangeStart(range: SalesRange, now: Date): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (range === "today") return start;
  if (range === "7d") {
    start.setDate(start.getDate() - 6);
    return start;
  }
  if (range === "30d") {
    start.setDate(start.getDate() - 29);
    return start;
  }
  return new Date(start.getFullYear(), start.getMonth(), 1);
}
