import { prisma } from "@/lib/db";

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export async function getTenantDashboard(tenantId: string, now = new Date()) {
  const todayStart = startOfDay(now);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

  const paidFilter = { tenantId, status: { not: "CANCELLED" as const } };

  const [todayOrders, yesterdayOrders, monthOrders, openOrders, customers] = await Promise.all([
    prisma.order.findMany({ where: { ...paidFilter, createdAt: { gte: todayStart } } }),
    prisma.order.findMany({
      where: { ...paidFilter, createdAt: { gte: yesterdayStart, lt: todayStart } },
    }),
    prisma.order.findMany({ where: { ...paidFilter, createdAt: { gte: monthStart } } }),
    prisma.order.count({
      where: { tenantId, status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"] } },
    }),
    prisma.customer.count({ where: { tenantId } }),
  ]);

  const sum = (orders: { totalCents: number }[]) => orders.reduce((acc, order) => acc + order.totalCents, 0);
  const todaySales = sum(todayOrders);
  const ticket = todayOrders.length ? Math.round(todaySales / todayOrders.length) : 0;

  return {
    todaySalesCents: todaySales,
    yesterdaySalesCents: sum(yesterdayOrders),
    monthSalesCents: sum(monthOrders),
    todayOrders: todayOrders.length,
    averageTicketCents: ticket,
    openOrders,
    customers,
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
