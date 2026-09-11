import Link from "next/link";
import { requireOpenCashPage } from "@/server/cash-page";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { CashierSearch } from "@/components/cashier/search";
import { FULFILLMENT_LABELS } from "@/domain/ordering/status";

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

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="font-heading text-2xl">Pedidos</h1>
        <p className="text-sm text-zinc-400">Consulta operacional. Preços e cardápio não podem ser alterados aqui.</p>
      </div>
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
            className="rounded-full border border-zinc-800 px-3 py-1 hover:border-primary/50"
          >
            {label}
          </Link>
        ))}
      </div>
      <ul className="grid gap-2">
        {orders.map((order) => (
          <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-card px-4 py-3">
            <div>
              <p className="font-medium">#{order.publicCode} · {order.customerName}</p>
              <p className="text-xs text-zinc-500">
                {order.tableNumber ? `Mesa ${order.tableNumber}` : FULFILLMENT_LABELS[order.fulfillment] ?? order.fulfillment} · {order.paymentStatus}
              </p>
            </div>
            <div className="text-right">
              <p>{formatBRL(order.totalCents)}</p>
              {order.paymentStatus !== "PAID" && order.status !== "CANCELLED" ? (
                <Link href={`/caixa/pagamentos?pedido=${order.id}`} className="text-sm text-primary underline">
                  Receber
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}