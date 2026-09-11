import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { listCatalog } from "@/server/services/catalog";
import { getTenantTableCount, listOpenFloorOrders } from "@/server/services/pos";
import { buildFloorTables } from "@/domain/floor/tables";
import { resolveCashierPosView } from "@/domain/floor/cashier-view";
import { StaffOrderForm } from "@/components/staff-order-form";
import { CashierFloor } from "@/components/cashier-floor";
import { settleTableAction } from "@/app/actions/pos";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/money";
import { StatusBadge } from "@/components/status-badge";
import Link from "next/link";

export default async function CashierPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string; mesa?: string; venda?: string }>;
}) {
  const ctx = await requirePage(PERMISSIONS.ORDER_CREATE);
  const [{ error, ok, mesa, venda }, catalog, open, tableCount] = await Promise.all([
    searchParams,
    listCatalog(ctx.tenantId),
    listOpenFloorOrders(ctx.tenantId),
    getTenantTableCount(ctx.tenantId),
  ]);
  const tables = buildFloorTables(
    open.map((order) => ({
      id: order.id,
      tableNumber: order.tableNumber,
      publicCode: order.publicCode,
      totalCents: order.totalCents,
      paymentStatus: order.paymentStatus,
    })),
    tableCount,
  );
  const view = resolveCashierPosView({ mesa, venda, tables });
  const selectedTable = view.kind === "home" ? "" : view.selectedTable || "";
  const visibleOrders =
    view.kind === "open-table" ? open.filter((order) => order.tableNumber === view.selectedTable) : [];
  const okMessage = ok === "quitada" ? "Mesa quitada e liberada." : ok;
  const errorMessage = error ? decodeURIComponent(error) : undefined;
  const formProps = {
    mode: "cashier" as const,
    products: catalog.products,
    sizes: catalog.sizes,
    flavors: catalog.flavors,
    crusts: catalog.crusts,
    error: errorMessage,
    ok: okMessage && ok !== "quitada" ? okMessage : undefined,
  };

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm text-primary">Ponto de venda</p>
        <h1 className="text-3xl font-semibold">Caixa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mesas livres ficam cinza, ocupadas ficam laranja. Toque no número para ver o consumo, quitar ou lançar mais
          itens. Nova venda abre uma mesa livre.
        </p>
      </div>
      <CashierFloor tables={tables} selected={selectedTable || undefined} view={view.kind} />

      {view.kind === "home" ? (
        <section className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-lg font-semibold">Venda</h2>
          <p className="text-sm text-muted-foreground">
            Abra uma nova venda no salão ou toque numa mesa ocupada lançada pelo garçom para receber.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12">
              <Link href="/caixa?venda=1">Nova venda</Link>
            </Button>
          </div>
          {open.filter((order) => order.tableNumber).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma mesa ocupada agora.</p>
          ) : (
            <ul className="grid gap-2 text-sm">
              {open
                .filter((order) => order.tableNumber)
                .slice(0, 8)
                .map((order) => (
                  <li key={order.id}>
                    <Link className="text-orange-300 underline-offset-2 hover:underline" href={`/caixa?mesa=${order.tableNumber}`}>
                      Mesa {order.tableNumber} · #{order.publicCode} · {formatBRL(order.totalCents)}
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </section>
      ) : null}

      {view.kind === "home" ? (
        <div className="grid gap-4">
          <h2 className="text-lg font-semibold">Venda no balcão</h2>
          <StaffOrderForm key="balcao" {...formProps} saleMode="counter" />
        </div>
      ) : null}

      {view.kind === "new-sale" ? (
        <div className="grid gap-4">
          <div>
            <h2 className="text-lg font-semibold">Nova venda</h2>
            <p className="text-sm text-muted-foreground">
              Lance o pedido e escolha a mesa livre. Ela passa a ocupar no mapa.
            </p>
          </div>
          <StaffOrderForm
            key={`nova-${view.selectedTable || "livre"}`}
            {...formProps}
            saleMode="new"
            tableNumber={view.selectedTable}
            availableTables={view.freeTables.map((table) => table.number)}
          />
        </div>
      ) : null}

      {view.kind === "open-table" ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.9fr)]">
          <section className="grid gap-3 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-4 lg:self-start">
            <h2 className="text-lg font-semibold">Consumo da mesa {view.selectedTable}</h2>
            {visibleOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nada lançado nesta mesa.</p>
            ) : (
              <ul className="grid gap-3">
                {visibleOrders.map((order) => (
                  <li key={order.id} className="rounded-xl border border-orange-400/50 bg-zinc-900 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono">#{order.publicCode}</p>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 text-sm">{order.customerName}</p>
                    <ul className="mt-3 grid gap-1 text-sm">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex items-start justify-between gap-3">
                          <span className="text-muted-foreground">
                            {item.quantity}× {item.name}
                            {item.notes ? ` · ${item.notes}` : ""}
                          </span>
                          <span className="shrink-0 font-medium">{formatBRL(item.totalCents)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-lg font-semibold">{formatBRL(order.totalCents)}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.paymentMethod} · {order.paymentStatus === "PAID" ? "Pago" : "A receber"}
                    </p>
                    <form action={settleTableAction} className="mt-4">
                      <input type="hidden" name="tableNumber" value={view.selectedTable} />
                      <Button type="submit" size="lg" className="h-12 w-full">
                        Quitar mesa {view.selectedTable}
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <div className="grid gap-4 lg:col-start-1 lg:row-start-1">
            <div>
              <h2 className="text-lg font-semibold">Lançar na mesa {view.selectedTable}</h2>
              <p className="text-sm text-muted-foreground">
                Água, refrigerante ou qualquer item pego no caixa entra na mesma comanda.
              </p>
            </div>
            <StaffOrderForm
              key={`add-${view.selectedTable}`}
              {...formProps}
              saleMode="add"
              tableNumber={view.selectedTable}
            />
          </div>
        </div>
      ) : null}

      {ok === "quitada" ? (
        <p className="rounded-lg bg-primary/15 px-3 py-2 text-sm">{okMessage}</p>
      ) : null}
    </div>
  );
}
