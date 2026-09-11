"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { formatBRL } from "@/lib/money";
import { formatClock } from "@/domain/cash/labels";
import { Button } from "@/components/ui/button";
import { CashierSearch } from "@/components/cashier/search";

export type CashierDashboardData = {
  operatorName: string;
  tenantName: string;
  terminalName: string;
  cashLimitCents: number;
  cashOverLimit: boolean;
  session: {
    id: string;
    openedAt: string;
    operatorName: string;
    openingCents: number;
  } | null;
  lastClosed: {
    closedAt: string;
    salesCents: number;
    differenceCents: number | null;
  } | null;
  totals: {
    openingCents: number;
    salesCents: number;
    receivedCents: number;
    pendingCents: number;
    sangriaCents: number;
    supplyCents: number;
    expectedCashCents: number;
    movementCount: number;
  };
  pending: {
    id: string;
    publicCode: string;
    customerName: string;
    tableNumber: string | null;
    totalCents: number;
  }[];
  movements: {
    id: string;
    createdAt: string;
    type: string;
    amountCents: number;
    notes: string | null;
    orderCode: string | null;
  }[];
  notifications: { id: string; title: string; body: string }[];
};

const MOVEMENT_LABEL: Record<string, string> = {
  OPENING: "Abertura",
  SALE: "Venda",
  SANGRIA: "Sangria",
  SUPPLY: "Suprimento",
  EXPENSE: "Despesa",
  REFUND: "Estorno",
};

export function CashierDashboard({ data }: { data: CashierDashboardData }) {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), 8000);
    return () => window.clearInterval(timer);
  }, [router]);

  if (!data.session) {
    return null;
  }

  const cards = [
    { label: "Saldo inicial", value: formatBRL(data.totals.openingCents) },
    { label: "Vendas do turno", value: formatBRL(data.totals.salesCents) },
    { label: "Recebido", value: formatBRL(data.totals.receivedCents) },
    { label: "Pendente", value: formatBRL(data.totals.pendingCents) },
    { label: "Sangrias", value: formatBRL(data.totals.sangriaCents) },
    { label: "Suprimentos", value: formatBRL(data.totals.supplyCents) },
    { label: "Movimentações", value: String(data.totals.movementCount) },
  ];

  return (
    <div className="grid gap-5">
      <header className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-400">Olá, {data.operatorName}</p>
            <h1 className="font-heading text-3xl">Turno em andamento</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {data.tenantName} · Terminal {data.terminalName} · Aberto às {formatClock(data.session.openedAt)}
            </p>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-400">
            Caixa aberto
          </span>
        </div>
        <div className="mt-4">
          <CashierSearch />
        </div>
      </header>

      {data.cashOverLimit ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Valor em dinheiro acima do limite configurado ({formatBRL(data.cashLimitCents)}). Sugerimos realizar uma
          sangria.
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-zinc-800 bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">{card.label}</p>
            <p className="mt-1 font-heading text-2xl">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-400">Caixa aberto</p>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-400">Aberto em</dt>
              <dd>{formatClock(data.session.openedAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-400">Operador</dt>
              <dd>{data.session.operatorName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-400">Saldo inicial</dt>
              <dd>{formatBRL(data.session.openingCents)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-400">Saldo esperado</dt>
              <dd>{formatBRL(data.totals.expectedCashCents)}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild className="h-11 min-w-36">
              <Link href="/caixa/conferencia">Conferir caixa</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 min-w-36">
              <Link href="/caixa/fechamento">Fechar caixa</Link>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { href: "/caixa/pdv", label: "Novo pedido", hint: "F2" },
            { href: "/caixa/pagamentos", label: "Receber pagamento", hint: "F4" },
            { href: "/caixa/pedidos", label: "Buscar pedido", hint: "F3" },
            { href: "/caixa/sangria", label: "Sangria", hint: "F7" },
            { href: "/caixa/suprimento", label: "Suprimento", hint: "F8" },
            { href: "/caixa/conferencia", label: "Conferir caixa", hint: "F9" },
          ].map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="flex min-h-20 flex-col justify-center rounded-xl border border-zinc-800 bg-card px-3 py-2 text-sm font-medium hover:border-primary/50 hover:bg-primary/10"
            >
              {item.label}
              <span className="text-[11px] font-normal text-zinc-500">{item.hint}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-lg">Pagamentos pendentes</h2>
            <Link href="/caixa/pagamentos" className="text-sm text-primary underline">
              Ver todos
            </Link>
          </div>
          <ul className="mt-3 grid gap-2">
            {data.pending.length === 0 ? (
              <li className="text-sm text-zinc-500">Nenhum pedido aguardando pagamento.</li>
            ) : (
              data.pending.slice(0, 6).map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 px-3 py-2">
                  <div>
                    <p className="font-medium">Pedido #{order.publicCode}</p>
                    <p className="text-xs text-zinc-500">
                      {order.tableNumber ? `Mesa ${order.tableNumber}` : "Balcão"} · {order.customerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p>{formatBRL(order.totalCents)}</p>
                    <Link href={`/caixa/pagamentos?pedido=${order.id}`} className="text-xs text-primary underline">
                      Receber pagamento
                    </Link>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-card p-4">
          <h2 className="font-heading text-lg">Últimas movimentações</h2>
          <ul className="mt-3 grid gap-2 text-sm">
            {data.movements.length === 0 ? (
              <li className="text-zinc-500">Nenhuma movimentação ainda.</li>
            ) : (
              data.movements.map((row) => (
                <li key={row.id} className="flex justify-between gap-3 border-b border-zinc-800/80 pb-2">
                  <span>
                    {formatClock(row.createdAt)} · {MOVEMENT_LABEL[row.type] ?? row.type}
                    {row.orderCode ? ` #${row.orderCode}` : ""}
                  </span>
                  <span className={row.type === "SANGRIA" || row.type === "EXPENSE" || row.type === "REFUND" ? "text-red-400" : "text-emerald-400"}>
                    {row.type === "SANGRIA" || row.type === "EXPENSE" || row.type === "REFUND" ? "-" : "+"}
                    {formatBRL(row.amountCents)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
