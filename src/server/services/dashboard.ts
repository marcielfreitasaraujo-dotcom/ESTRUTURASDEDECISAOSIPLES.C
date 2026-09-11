import { prisma } from "@/lib/db";
import { formatOccupancyDuration } from "@/domain/floor/occupancy";
import { occupancyAlertLevel } from "@/domain/floor/occupancy";
import { summarizeFloorStatus } from "@/domain/floor/status";
import {
  FULFILLMENT_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/domain/ordering/status";
import {
  greetingForHour,
  percentDelta,
  rangeStart,
  type ControlAlert,
  type ControlCenterSnapshot,
  type SalesRange,
} from "@/domain/dashboard/control-center";
import { getFloorSnapshot } from "@/server/services/floor";

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function sumCents(orders: { totalCents: number }[]) {
  return orders.reduce((acc, order) => acc + order.totalCents, 0);
}

function channelLabel(order: { fulfillment: string; tableNumber: string | null }) {
  if (order.tableNumber) return `Mesa ${order.tableNumber}`;
  return FULFILLMENT_LABELS[order.fulfillment] ?? order.fulfillment;
}

function buildSeries(orders: { createdAt: Date; totalCents: number }[], range: SalesRange, now: Date) {
  if (range === "today") {
    const buckets = Array.from({ length: 24 }, (_, hour) => ({
      label: `${String(hour).padStart(2, "0")}h`,
      salesCents: 0,
      orders: 0,
    }));
    for (const order of orders) {
      const hour = order.createdAt.getHours();
      buckets[hour].salesCents += order.totalCents;
      buckets[hour].orders += 1;
    }
    const first = buckets.findIndex((row) => row.orders > 0);
    let last = -1;
    for (let index = buckets.length - 1; index >= 0; index -= 1) {
      if (buckets[index].orders > 0) {
        last = index;
        break;
      }
    }
    if (first === -1) return buckets.slice(11, 23);
    return buckets.slice(Math.min(first, 11), Math.max(last + 1, 23));
  }
  const start = rangeStart(range, now);
  const days = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / 86_400_000) + 1);
  const buckets = Array.from({ length: days }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return {
      key: day.toISOString().slice(0, 10),
      label: day.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      salesCents: 0,
      orders: 0,
    };
  });
  const map = new Map(buckets.map((row) => [row.key, row]));
  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    const bucket = map.get(key);
    if (!bucket) continue;
    bucket.salesCents += order.totalCents;
    bucket.orders += 1;
  }
  return buckets.map(({ label, salesCents, orders: count }) => ({ label, salesCents, orders: count }));
}

export async function getStoreControlCenter(
  tenantId: string,
  input: { range?: SalesRange; userName?: string } = {},
  now = new Date(),
): Promise<ControlCenterSnapshot> {
  const range = input.range ?? "today";
  const todayStart = startOfDay(now);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
  const seriesStart = rangeStart(range, now);
  const lookback = new Date(Math.min(seriesStart.getTime(), monthStart.getTime(), yesterdayStart.getTime()));

  const [tenant, orders, openOrders, customers, floor, inventory, products, cashClose, kitchenReady] =
    await Promise.all([
      prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { name: true, slug: true } }),
      prisma.order.findMany({
        where: { tenantId, createdAt: { gte: lookback }, status: { not: "CANCELLED" } },
        select: {
          id: true,
          publicCode: true,
          customerName: true,
          fulfillment: true,
          tableNumber: true,
          createdAt: true,
          totalCents: true,
          status: true,
          paymentMethod: true,
          items: { select: { name: true, quantity: true, totalCents: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.findMany({
        where: { tenantId, status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"] } },
        select: { id: true, publicCode: true, status: true, createdAt: true, fulfillment: true, totalCents: true },
      }),
      prisma.customer.count({ where: { tenantId } }),
      getFloorSnapshot(tenantId),
      prisma.inventoryItem.findMany({
        where: { tenantId },
        select: { id: true, name: true, quantity: true, minQuantity: true, unit: true },
      }),
      prisma.product.findMany({
        where: { tenantId, deletedAt: null, trackInventory: true },
        select: { id: true, name: true, stockQuantity: true, available: true },
      }),
      prisma.auditLog.findFirst({
        where: { tenantId, entity: "CashRegister" },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      }),
      prisma.order.count({
        where: { tenantId, status: "READY", createdAt: { gte: todayStart } },
      }),
    ]);

  const todayOrders = orders.filter((order) => order.createdAt >= todayStart);
  const yesterdayOrders = orders.filter((order) => order.createdAt >= yesterdayStart && order.createdAt < todayStart);
  const monthOrders = orders.filter((order) => order.createdAt >= monthStart);
  const rangeOrders = orders.filter((order) => order.createdAt >= seriesStart);
  const todaySales = sumCents(todayOrders);
  const yesterdaySales = sumCents(yesterdayOrders);

  const methodTotals = new Map<string, number>();
  for (const order of todayOrders.length ? todayOrders : monthOrders) {
    methodTotals.set(order.paymentMethod, (methodTotals.get(order.paymentMethod) ?? 0) + order.totalCents);
  }
  const paymentSum = [...methodTotals.values()].reduce((acc, value) => acc + value, 0) || 1;
  const payments = [...methodTotals.entries()]
    .map(([method, cents]) => ({
      method,
      label: PAYMENT_METHOD_LABELS[method] ?? method,
      cents,
      percent: Math.round((cents / paymentSum) * 100),
    }))
    .sort((a, b) => b.cents - a.cents);

  const productMap = new Map<string, { name: string; quantity: number; cents: number }>();
  for (const order of monthOrders) {
    for (const item of order.items) {
      const current = productMap.get(item.name) ?? { name: item.name, quantity: 0, cents: 0 };
      current.quantity += item.quantity;
      current.cents += item.totalCents;
      productMap.set(item.name, current);
    }
  }
  const topProducts = [...productMap.values()].sort((a, b) => b.cents - a.cents).slice(0, 5);

  const cashClosedToday = Boolean(cashClose && cashClose.createdAt >= todayStart);
  const cash = {
    open: !cashClosedToday,
    balanceCents: todayOrders.filter((order) => order.status === "DELIVERED").reduce((acc, order) => acc + order.totalCents, 0) || todaySales,
    openedAt: cashClosedToday ? null : todayStart.toISOString(),
    operatorName: cashClose?.user?.name ?? null,
  };

  const alerts: ControlAlert[] = [];
  for (const item of inventory) {
    const qty = Number(item.quantity);
    const min = Number(item.minQuantity);
    if (qty <= min) {
      alerts.push({
        id: `stock-${item.id}`,
        tone: qty <= 0 ? "alert" : "warn",
        title: qty <= 0 ? "Sem estoque" : "Estoque baixo",
        detail: `${item.name}: ${qty} ${item.unit} (mín. ${min} ${item.unit})`,
        href: "/app/estoque",
      });
    }
  }
  for (const product of products) {
    if ((product.stockQuantity ?? 0) <= 0 || product.available === false) {
      alerts.push({
        id: `product-${product.id}`,
        tone: "alert",
        title: "Produto indisponível",
        detail: product.name,
        href: "/app/cardapio",
      });
    }
  }
  for (const order of openOrders) {
    const minutes = Math.floor((now.getTime() - order.createdAt.getTime()) / 60_000);
    if (["CONFIRMED", "PREPARING"].includes(order.status) && minutes >= 30) {
      alerts.push({
        id: `late-${order.id}`,
        tone: minutes >= 45 ? "alert" : "warn",
        title: "Pedido atrasado",
        detail: `Pedido #${order.publicCode} · ${minutes} min`,
        href: "/app/cozinha",
      });
    }
  }
  for (const table of floor.tables) {
    if (table.status !== "OCCUPIED" || !table.openedAt) continue;
    const level = occupancyAlertLevel(table.openedAt, now);
    if (level === "none") continue;
    alerts.push({
      id: `table-${table.id}`,
      tone: level === "alert" ? "alert" : "warn",
      title: "Mesa ocupada há muito tempo",
      detail: `Mesa ${table.number} · ${formatOccupancyDuration(table.openedAt, now)}`,
      href: "/app/salao",
    });
  }
  if (cashClosedToday) {
    alerts.push({
      id: "cash-closed",
      tone: "info",
      title: "Caixa fechado",
      detail: cashClose?.user?.name ? `Fechado por ${cashClose.user.name}` : "Fechamento registrado hoje",
      href: "/caixa/fechamento",
    });
  }

  const notifications: ControlAlert[] = [
    ...openOrders.slice(0, 8).map((order) => ({
      id: `order-${order.id}`,
      tone: (["CANCELLED"].includes(order.status) ? "alert" : order.status === "READY" ? "info" : "warn") as ControlAlert["tone"],
      title: `Pedido #${order.publicCode}`,
      detail: ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status,
      href: "/app/pedidos",
    })),
    ...alerts.slice(0, 8),
  ].slice(0, 12);

  return {
    generatedAt: now.toISOString(),
    storeName: tenant.name,
    storeSlug: tenant.slug,
    greeting: greetingForHour(now.getHours(), input.userName ?? ""),
    kpis: {
      todaySalesCents: todaySales,
      yesterdaySalesCents: yesterdaySales,
      todaySalesDelta: percentDelta(todaySales, yesterdaySales),
      monthSalesCents: sumCents(monthOrders),
      todayOrders: todayOrders.length,
      yesterdayOrders: yesterdayOrders.length,
      openOrders: openOrders.length,
      averageTicketCents: todayOrders.length ? Math.round(todaySales / todayOrders.length) : 0,
      customers,
      tablesOccupied: floor.counts.occupied,
      tablesTotal: floor.counts.total,
      deliveriesOpen: openOrders.filter((order) => order.status === "OUT_FOR_DELIVERY" || order.fulfillment === "DELIVERY").length,
    },
    cash,
    salesSeries: buildSeries(rangeOrders, range, now),
    payments,
    recentOrders: orders.slice(0, 8).map((order) => ({
      id: order.id,
      publicCode: order.publicCode,
      customerName: order.customerName,
      channel: channelLabel(order),
      createdAt: order.createdAt.toISOString(),
      totalCents: order.totalCents,
      status: order.status,
      statusLabel: ORDER_STATUS_LABELS[order.status] ?? order.status,
    })),
    operation: {
      tables: floor.counts,
      kitchen: {
        waiting: openOrders.filter((order) => order.status === "CONFIRMED").length,
        preparing: openOrders.filter((order) => order.status === "PREPARING").length,
        ready: kitchenReady,
      },
      delivery: {
        waiting: openOrders.filter((order) => order.fulfillment === "DELIVERY" && ["CONFIRMED", "PREPARING", "READY"].includes(order.status)).length,
        inRoute: openOrders.filter((order) => order.status === "OUT_FOR_DELIVERY").length,
        deliveredToday: todayOrders.filter((order) => order.fulfillment === "DELIVERY" && order.status === "DELIVERED").length,
      },
    },
    alerts,
    notifications,
    topProducts,
  };
}

export async function getTenantDashboard(tenantId: string, now = new Date()) {
  const snapshot = await getStoreControlCenter(tenantId, {}, now);
  return {
    todaySalesCents: snapshot.kpis.todaySalesCents,
    yesterdaySalesCents: snapshot.kpis.yesterdaySalesCents,
    monthSalesCents: snapshot.kpis.monthSalesCents,
    todayOrders: snapshot.kpis.todayOrders,
    averageTicketCents: snapshot.kpis.averageTicketCents,
    openOrders: snapshot.kpis.openOrders,
    customers: snapshot.kpis.customers,
  };
}

export async function getPlatformDashboard() {
  const [tenants, active, suspended, users, orders, gmv] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "ACTIVE" } }),
    prisma.tenant.count({ where: { status: "SUSPENDED" } }),
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { totalCents: true }, where: { status: { not: "CANCELLED" } } }),
  ]);

  const plans = await prisma.subscription.findMany({
    where: { status: { in: ["ACTIVE", "TRIAL"] } },
    include: { plan: true },
  });
  const mrr = plans.reduce((sum, sub) => {
    const monthly =
      sub.interval === "MONTHLY" ? sub.plan.monthlyPriceCents : Math.round(sub.plan.yearlyPriceCents / 12);
    return sum + monthly;
  }, 0);

  return {
    tenants,
    active,
    suspended,
    users,
    orders,
    gmvCents: gmv._sum.totalCents ?? 0,
    mrrCents: mrr,
    arrCents: mrr * 12,
  };
}

export async function searchStore(tenantId: string, query: string) {
  const q = query.trim();
  if (q.length < 2) return { customers: [], orders: [], products: [], tables: [], staff: [] };
  const [customers, orders, products, tables, staff] = await Promise.all([
    prisma.customer.findMany({
      where: { tenantId, OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] },
      take: 5,
      select: { id: true, name: true, phone: true },
    }),
    prisma.order.findMany({
      where: {
        tenantId,
        OR: [{ publicCode: { contains: q, mode: "insensitive" } }, { customerName: { contains: q, mode: "insensitive" } }],
      },
      take: 5,
      select: { id: true, publicCode: true, customerName: true, totalCents: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { tenantId, deletedAt: null, name: { contains: q, mode: "insensitive" } },
      take: 5,
      select: { id: true, name: true },
    }),
    prisma.salonTable.findMany({
      where: { tenantId, OR: [{ number: { contains: q } }, { customerName: { contains: q, mode: "insensitive" } }] },
      take: 5,
      select: { id: true, number: true, status: true, customerName: true },
    }),
    prisma.tenantMembership.findMany({
      where: { tenantId, user: { name: { contains: q, mode: "insensitive" } } },
      take: 5,
      select: { role: true, user: { select: { id: true, name: true } } },
    }),
  ]);
  return { customers, orders, products, tables, staff };
}

export async function listTenantAuditLogs(tenantId: string, limit = 80) {
  return prisma.auditLog.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { name: true, email: true } } },
  });
}

export async function getSalesReport(tenantId: string, from: Date, to: Date) {
  const orders = await prisma.order.findMany({
    where: { tenantId, createdAt: { gte: from, lte: to }, status: { not: "CANCELLED" } },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  const cancelled = await prisma.order.count({
    where: { tenantId, createdAt: { gte: from, lte: to }, status: "CANCELLED" },
  });
  const salesCents = sumCents(orders);
  const byMethod = new Map<string, number>();
  const byProduct = new Map<string, { quantity: number; cents: number }>();
  for (const order of orders) {
    byMethod.set(order.paymentMethod, (byMethod.get(order.paymentMethod) ?? 0) + order.totalCents);
    for (const item of order.items) {
      const current = byProduct.get(item.name) ?? { quantity: 0, cents: 0 };
      current.quantity += item.quantity;
      current.cents += item.totalCents;
      byProduct.set(item.name, current);
    }
  }
  const products = [...byProduct.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.cents - a.cents);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    orders: orders.length,
    cancelled,
    salesCents,
    averageTicketCents: orders.length ? Math.round(salesCents / orders.length) : 0,
    byMethod: [...byMethod.entries()].map(([method, cents]) => ({
      method,
      label: PAYMENT_METHOD_LABELS[method] ?? method,
      cents,
    })),
    topProducts: products.slice(0, 15),
    leastProducts: [...products].reverse().slice(0, 8),
    rows: orders.map((order) => ({
      publicCode: order.publicCode,
      createdAt: order.createdAt.toISOString(),
      customerName: order.customerName,
      channel: channelLabel(order),
      payment: PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod,
      status: ORDER_STATUS_LABELS[order.status],
      totalCents: order.totalCents,
    })),
  };
}
