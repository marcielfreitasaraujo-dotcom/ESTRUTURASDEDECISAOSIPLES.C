import Link from "next/link";
import { requireOpenCashPage } from "@/server/cash-page";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { CashierSearch } from "@/components/cashier/search";
import { FULFILLMENT_LABELS } from "@/domain/ordering/status";
import { PageHeader, PageStack } from "@/components/ds/page-header";
import { StatusPill } from "@/components/ds/data-table";
import { EmptyState } from "@/components/empty-state";
import { Surface } from "@/components/ds/surface";
import { cn } from "@/lib/utils";
import { LiveRefresh } from "@/components/live-refresh";
import { updateOrderStatusFormAction } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { nextStaffLabel, nextStaffStatus } from "@/domain/ordering/tracking";

export default async function CaixaPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const ctx = await requireOpenCashPage();
  const { filtro } = await searchParams;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const week = new Date(today);
  week.setDate(week.getDate() - 7);
  const where =
    filtro === "pagos"
      ? { paymentStatus: "PAID" as const }
      : filtro === "cancelados"
        ? { status: "CANCELLED" as const }
        : filtro === "hoje"
          ? { createdAt: { gte: today } }
          : filtro === "periodo"
            ? { createdAt: { gte: week } }
            : { paymentStatus: { not: "PAID" as const }, status: { not: "CANCELLED" as const } };

  const orders = await prisma.order.findMany({
    where: { tenantId: ctx.tenantId, ...where },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  const activeFilter = filtro ?? "pendentes";

  return (
    <PageStack>
      <PageHeader
        title="Pedidos"
        description="Consulta operacional. Preços e cardápio não podem ser alterados aqui."
      />
      <LiveRefresh />
      <CashierSearch />
      <div className="flex flex-wrap gap-2 text-sm">
        {[
          ["pendentes", "Pendentes"],
          ["pagos", "Pagos"],
          ["cancelados", "Cancelados"],
          ["hoje", "Hoje"],
          ["periodo", "Últimos 7 dias"],
        ].map(([key, label]) => (
          <Link
            key={key}
            href={`/caixa/pedidos?filtro=${key}`}
            className={cn(
              "rounded-full border px-3 py-1",
              activeFilter === key
                ? "border-primary bg-primary/15 text-primary"
                : "border-border hover:border-primary/50",
            )}
          >
            {label}
          </Link>
        ))}
      </div>
      {orders.length === 0 ? (
        <Surface>
          <EmptyState title="Nenhum pedido neste filtro" description="Troque o filtro ou lance um pedido no PDV." />
        </Surface>
      ) : (
        <ul className="grid gap-2">
          {orders.map((order) => (
            <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3">
              <div>
                <p className="font-medium">#{order.publicCode} · {order.customerName}</p>
                <p className="text-xs text-muted-foreground">
                  {order.tableNumber ? `Mesa ${order.tableNumber}` : FULFILLMENT_LABELS[order.fulfillment] ?? order.fulfillment}
                </p>
              </div>
              <div className="grid justify-items-end gap-2 text-right">
                <p>{formatBRL(order.totalCents)}</p>
                <StatusPill tone={order.paymentStatus === "PAID" ? "success" : order.status === "CANCELLED" ? "danger" : "warning"}>
                  {order.status === "PENDING" ? "NOVO PEDIDO" : order.paymentStatus}
                </StatusPill>
                {order.status === "PENDING" ? (
                  <div className="flex flex-wrap justify-end gap-2">
                    <form action={updateOrderStatusFormAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="toStatus" value="CONFIRMED" />
                      <Button size="sm" type="submit">Confirmar</Button>
                    </form>
                    <form action={updateOrderStatusFormAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="toStatus" value="CANCELLED" />
                      <input type="hidden" name="rejected" value="1" />
                      <input type="hidden" name="reason" value="O estabelecimento não conseguiu aceitar este pedido." />
                      <Button size="sm" type="submit" variant="outline">Recusar</Button>
                    </form>
                  </div>
                ) : nextStaffStatus(order.status, order.fulfillment) ? (
                  <form action={updateOrderStatusFormAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="toStatus" value={nextStaffStatus(order.status, order.fulfillment) ?? ""} />
                    <Button size="sm" type="submit">
                      {nextStaffLabel(order.status, order.fulfillment)}
                    </Button>
                  </form>
                ) : null}
                {order.paymentStatus !== "PAID" && order.status !== "CANCELLED" ? (
                  <Link href={`/caixa/pagamentos?pedido=${order.id}`} className="text-sm text-primary underline">
                    Receber
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageStack>
  );
}
