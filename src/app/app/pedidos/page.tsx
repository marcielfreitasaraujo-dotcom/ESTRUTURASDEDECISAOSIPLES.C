import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { listOrdersByStatus } from "@/server/services/orders";
import { OrdersKanban } from "@/components/orders-kanban";
import { EmptyState } from "@/components/empty-state";

export default async function OrdersPage() {
  const ctx = await requirePage(PERMISSIONS.ORDER_READ);
  const orders = await listOrdersByStatus(ctx.tenantId);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-3xl">Pedidos</h1>
        <p className="text-sm text-muted-foreground">Atualize o status com um toque. Cada mudança fica no histórico.</p>
      </div>
      {orders.length === 0 ? (
        <EmptyState title="Nenhum pedido aberto" description="Os pedidos do cardápio público aparecem aqui em tempo quase real após o checkout." />
      ) : (
        <OrdersKanban
          orders={orders.map((order) => ({
            id: order.id,
            publicCode: order.publicCode,
            status: order.status,
            customerName: order.customerName,
            tableNumber: order.tableNumber,
            totalCents: order.totalCents,
            notes: order.notes,
            items: order.items,
          }))}
        />
      )}
    </div>
  );
}
