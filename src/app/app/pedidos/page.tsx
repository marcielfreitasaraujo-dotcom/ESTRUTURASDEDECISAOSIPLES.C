import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { listOrdersByStatus } from "@/server/services/orders";
import { staffDelayMeta } from "@/server/services/tracking";
import { OrdersKanban } from "@/components/orders-kanban";
import { LiveRefresh } from "@/components/live-refresh";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PageHeader } from "@/components/ds/page-header";
import { redirect } from "next/navigation";

export default async function OrdersPage() {
  const ctx = await requirePage(PERMISSIONS.ORDER_READ);
  if (ctx.tenantRole === "CASHIER") redirect("/caixa/pedidos");
  const orders = await listOrdersByStatus(ctx.tenantId);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Pedidos"
        description="Atualize o status com um toque. Cada mudança fica no histórico."
        actions={
          <>
            <Button asChild>
              <Link href="/garcom">Novo pedido</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/app/salao">Mesas</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/app/cozinha">Cozinha</Link>
            </Button>
          </>
        }
      />
      <LiveRefresh />
      {orders.length === 0 ? (
        <EmptyState title="Nenhum pedido aberto" description="Os pedidos do cardápio público aparecem aqui em tempo quase real após o checkout." />
      ) : (
        <OrdersKanban
          orders={orders.map((order) => ({
            id: order.id,
            publicCode: order.publicCode,
            status: order.status,
            fulfillment: order.fulfillment,
            customerName: order.customerName,
            tableNumber: order.tableNumber,
            totalCents: order.totalCents,
            notes: order.notes,
            estimatedMinutes: order.estimatedMinutes,
            delayTone: staffDelayMeta(order).delayTone,
            items: order.items,
          }))}
        />
      )}
    </div>
  );
}
