import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { getTenantDashboard } from "@/server/services/dashboard";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const ctx = await requirePage(PERMISSIONS.DASHBOARD_READ);
  const [metrics, tenant] = await Promise.all([
    getTenantDashboard(ctx.tenantId),
    prisma.tenant.findUnique({ where: { id: ctx.tenantId } }),
  ]);

  const cards = [
    ["Vendas hoje", formatBRL(metrics.todaySalesCents)],
    ["Vendas ontem", formatBRL(metrics.yesterdaySalesCents)],
    ["Vendas no mês", formatBRL(metrics.monthSalesCents)],
    ["Pedidos hoje", String(metrics.todayOrders)],
    ["Ticket médio", formatBRL(metrics.averageTicketCents)],
    ["Pedidos abertos", String(metrics.openOrders)],
    ["Clientes", String(metrics.customers)],
  ];

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Estabelecimento</p>
        <h1 className="font-heading text-3xl">{tenant?.name ?? "Painel"}</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-2xl">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
