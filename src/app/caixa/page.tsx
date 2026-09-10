import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { listCatalog } from "@/server/services/catalog";
import { listOpenFloorOrders } from "@/server/services/pos";
import { buildFloorTables } from "@/domain/floor/tables";
import { StaffOrderForm } from "@/components/staff-order-form";
import { CashierFloor } from "@/components/cashier-floor";
import { markOrderPaidAction } from "@/app/actions/pos";
import { updateOrderStatusFormAction } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/money";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";

export default async function CashierPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string; mesa?: string }>;
}) {
  const ctx = await requirePage(PERMISSIONS.ORDER_CREATE);
  const [{ error, ok, mesa }, catalog, open] = await Promise.all([
    searchParams,
    listCatalog(ctx.tenantId),
    listOpenFloorOrders(ctx.tenantId),
  ]);
  const selectedTable = mesa?.trim() || "";
  const tables = buildFloorTables(
    open.map((order) => ({
      id: order.id,
      tableNumber: order.tableNumber,
      publicCode: order.publicCode,
      totalCents: order.totalCents,
      paymentStatus: order.paymentStatus,
    })),
  );
  const selectedFloor = tables.find((table) => table.number === selectedTable);
  const visibleOrders = selectedTable
    ? open.filter((order) => order.tableNumber === selectedTable)
    : open;

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm text-primary">Ponto de venda</p>
        <h1 className="text-3xl font-semibold">Caixa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Toque na mesa do salão. Livre fica cinza, ocupada fica laranja. Balcão continua para venda no balcão.
        </p>
      </div>
      <CashierFloor tables={tables} selected={selectedTable || undefined} />
      <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
        <div className="grid gap-4">
          <h2 className="text-lg font-semibold">
            {selectedTable ? `Lançar na mesa ${selectedTable}` : "Venda no balcão"}
          </h2>
          {selectedFloor?.status === "bill" ? (
            <p className="rounded-lg border border-orange-400/40 bg-orange-500/10 px-3 py-2 text-sm">
              Essa mesa já tem comanda em aberto. Receba no painel ao lado ou lance mais itens nela.
            </p>
          ) : null}
          <StaffOrderForm
            key={selectedTable || "balcao"}
            mode="cashier"
            products={catalog.products}
            sizes={catalog.sizes}
            flavors={catalog.flavors}
            crusts={catalog.crusts}
            tableNumber={selectedTable || undefined}
            error={error ? decodeURIComponent(error) : undefined}
            ok={ok}
          />
        </div>
        <section className="grid gap-3">
          <h2 className="text-lg font-semibold">
            {selectedTable ? `Comanda da mesa ${selectedTable}` : "Abertas"}
          </h2>
          {visibleOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {selectedTable ? "Mesa livre. Lance o pedido no cardápio." : "Fila vazia."}
            </p>
          ) : (
            <ul className="grid gap-3">
              {visibleOrders.map((order) => (
                <li
                  key={order.id}
                  className={cn(
                    "rounded-xl border bg-card p-4",
                    selectedTable && order.tableNumber === selectedTable && "border-orange-400/60",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono">
                      #{order.publicCode}
                      {order.tableNumber ? ` · Mesa ${order.tableNumber}` : ""}
                    </p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-sm">{order.customerName}</p>
                  <ul className="mt-2 text-sm text-muted-foreground">
                    {order.items.map((item) => (
                      <li key={item.id}>
                        {item.quantity}× {item.name}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 font-medium">{formatBRL(order.totalCents)}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.paymentMethod} · {order.paymentStatus === "PAID" ? "Pago" : "A receber"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {order.paymentStatus !== "PAID" ? (
                      <form action={markOrderPaidAction} method="post">
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="tableNumber" value={order.tableNumber ?? ""} />
                        <Button type="submit" size="sm">
                          Receber
                        </Button>
                      </form>
                    ) : null}
                    {order.status === "READY" ? (
                      <form action={updateOrderStatusFormAction} method="post">
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="toStatus" value="DELIVERED" />
                        <Button type="submit" size="sm" variant="outline">
                          Encerrar mesa
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
