"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { searchCashierAction } from "@/app/actions/cash";
import { Input } from "@/components/ui/input";
import { formatBRL } from "@/lib/money";

export function CashierSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchCashierAction>> | null>(null);

  return (
    <div className="relative">
      <Input
        value={query}
        placeholder="Buscar pedido, cliente, mesa, operador ou caixa"
        className="h-11"
        onChange={async (event) => {
          const value = event.target.value;
          setQuery(value);
          if (value.trim().length < 1) {
            setResults(null);
            setOpen(false);
            return;
          }
          const next = await searchCashierAction(value);
          setResults(next);
          setOpen(true);
        }}
        onFocus={() => results && setOpen(true)}
      />
      {open && results ? (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-background p-2 text-sm shadow-xl">
          {results.orders.map((order) => (
            <button
              key={order.id}
              type="button"
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-muted"
              onClick={() => {
                setOpen(false);
                router.push(
                  order.paymentStatus === "PAID" ? `/caixa/pedidos?q=${order.publicCode}` : `/caixa/pagamentos?pedido=${order.id}`,
                );
              }}
            >
              <span>
                Pedido #{order.publicCode} · {order.tableNumber ? `Mesa ${order.tableNumber}` : order.customerName}
              </span>
              <span>
                {formatBRL(order.totalCents)} · {order.paymentStatus === "PAID" ? "Pago" : "Pagamento pendente"}
              </span>
            </button>
          ))}
          {results.sessions?.map((session) => (
            <button
              key={session.id}
              type="button"
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-muted"
              onClick={() => {
                setOpen(false);
                router.push(`/app/caixas/${session.id}`);
              }}
            >
              <span>
                Caixa {session.publicCode} · {session.terminal.name}
              </span>
              <span className="text-muted-foreground">{session.operator.displayName || session.operator.name}</span>
            </button>
          ))}
          {results.operators?.map((operator) => (
            <p key={operator.id} className="px-3 py-1 text-muted-foreground">
              Operador {operator.displayName || operator.name}
              {operator.operatorCode ? ` · ${operator.operatorCode}` : ""}
            </p>
          ))}
          {results.customers.map((customer) => (
            <p key={customer.id} className="px-3 py-1 text-muted-foreground">
              Cliente {customer.name} · {customer.phone}
            </p>
          ))}
          {results.tables.map((table) => (
            <button
              key={table.id}
              type="button"
              className="block w-full rounded-lg px-3 py-2 text-left hover:bg-muted"
              onClick={() => router.push("/caixa/mesas")}
            >
              Mesa {table.number} · {table.status} {table.customerName ? `· ${table.customerName}` : ""}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
