import { requireOpenCashPage } from "@/server/cash-page";
import { getReceivableOrder, listPendingPayments } from "@/server/services/cash";
import { PendingPaymentsList, ReceivePaymentPanel } from "@/components/cashier/receive-panel";
import { prisma } from "@/lib/db";

export default async function CaixaPagamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ pedido?: string }>;
}) {
  const ctx = await requireOpenCashPage();
  const params = await searchParams;
  if (params.pedido) {
    const { order } = await getReceivableOrder(ctx.tenantId, params.pedido);
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: ctx.tenantId },
      select: { maxCashierDiscountPercent: true },
    });
    return (
      <ReceivePaymentPanel
        maxDiscountPercent={tenant.maxCashierDiscountPercent}
        order={{
          id: order.id,
          publicCode: order.publicCode,
          customerName: order.customerName,
          tableNumber: order.tableNumber,
          subtotalCents: order.subtotalCents,
          deliveryFeeCents: order.deliveryFeeCents,
          discountCents: order.discountCents,
          totalCents: order.totalCents,
          items: order.items.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            totalCents: item.totalCents,
          })),
        }}
      />
    );
  }
  const pending = await listPendingPayments(ctx.tenantId);
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="font-heading text-2xl">Pagamentos pendentes</h1>
        <p className="text-sm text-zinc-400">Pedidos que precisam ser pagos neste turno.</p>
      </div>
      <PendingPaymentsList
        orders={pending.map((order) => ({
          id: order.id,
          publicCode: order.publicCode,
          customerName: order.customerName,
          tableNumber: order.tableNumber,
          totalCents: order.totalCents,
        }))}
      />
    </div>
  );
}