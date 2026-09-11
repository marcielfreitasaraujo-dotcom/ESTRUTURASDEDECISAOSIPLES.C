import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { listOrdersByStatus } from "@/server/services/orders";
import { OrdersKanban } from "@/components/orders-kanban";
import { EmptyState } from "@/components/empty-state";
import { PageHeader, PageStack } from "@/components/ds/page-header";
import { Surface } from "@/components/ds/surface";

export default async function EntregaPedidosPage() {
  const ctx = await requirePage(PERMISSIONS.ORDER_READ);
  const orders = await listOrdersByStatus(ctx.tenantId);

  return (
    <PageStack>
      <PageHeader
        title="Pedidos"
        description="Deslize as colunas. Voltar no topo volta para a fila."
        backHref="/entrega"
        backLabel="Fila"
      />
      {orders.length === 0 ? (
        <Surface>
          <EmptyState title="Nenhum pedido aberto" description="Os pedidos da loja aparecem aqui." />
        </Surface>
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
    </PageStack>
  );
}
