import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { listOrdersByStatus } from "@/server/services/orders";
import { OrdersKanban } from "@/components/orders-kanban";
import { EmptyState } from "@/components/empty-state";

export default async function EntregaPedidosPage() {
  const ctx = await requirePage(PERMISSIONS.ORDER_READ);
  const orders = await listOrdersByStatus(ctx.tenantId);

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">Pedidos</h1>
        <p className="text-sm text-muted-foreground">Acompanhe a fila sem sair da tela de entrega. Use Voltar no topo.</p>
      </div>
      {orders.length === 0 ? (
        <EmptyState title="Nenhum pedido aberto" description="Os pedidos da loja aparecem aqui." />
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
