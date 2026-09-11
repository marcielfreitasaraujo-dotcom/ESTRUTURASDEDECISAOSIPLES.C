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
  sessionCode?: string;
  cashLimitCents: number;
  cashOverLimit: boolean;
  canManage?: boolean;
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
    expenseCents: number;
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
  paymentSummary: {
    cashCents: number;
    pixCents: number;
    debitCents: number;
    creditCents: number;
    otherCents: number;
    cashCount: number;
    pixCount: number;
    debitCount: number;
    creditCount: number;
    otherCount: number;
  };
};

const MOVEMENT_LABEL: Record<string, string> = {
  OPENING: "Abertura",
  SALE: "Venda",
  SANGRIA: "Sangria",
  SUPPLY: "Suprimento",
  EXPENSE: "Despesa",
  REFUND: "Estorno",
  ADJUSTMENT: "Ajuste",
  CLOSING: "Fechamento",
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
    { label: "Despesas", value: formatBRL(data.totals.expenseCents) },
    { label: "Movimentações", value: String(data.totals.movementCount) },
  ];

  return (
    <div className="grid gap-5">
      <header className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-400">Olá, {data.operatorName}</p>
            <h1 className="font-heading text-3xl">Turno em andamento</h1>
            {data.sessionCode ? <p className="mt-1 text-sm text-zinc-500">Sessão {data.sessionCode}</p> : null}
          </div>
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-400">
            🟢 Caixa aberto
          </span>
        </div>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-zinc-500">Estabelecimento</dt>
            <dd>{data.tenantName}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Terminal</dt>
            <dd>{data.terminalName}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Operador</dt>
            <dd>{data.session.operatorName}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Horário de abertura</dt>
            <dd>{formatClock(data.session.openedAt)}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Status</dt>
            <dd className="text-emerald-400">Caixa aberto</dd>
          </div>
        </dl>
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
          <p className="text-xs uppercase tracking-wide text-emerald-400">Saldo físico esperado</p>
          <p className="mt-2 font-heading text-3xl">{formatBRL(data.totals.expectedCashCents)}</p>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-400">Aberto em</dt>
              <dd>{formatClock(data.session.openedAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-400">Saldo inicial</dt>
              <dd>{formatBRL(data.session.openingCents)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-400">PIX e cartão</dt>
              <dd className="text-zinc-500">não entram no físico</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild className="h-11 min-w-36">
              <Link href="/caixa/fechamento">Fechar caixa</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 min-w-36">
              <Link href="/caixa/conferencia">Contagem</Link>
            </Button>
            {data.canManage ? (
              <Button asChild variant="outline" className="h-11 min-w-36">
                <Link href="/app/caixas">Central de conferência</Link>
              </Button>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { href: "/caixa/pdv", label: "Novo pedido", hint: "F2" },
            { href: "/caixa/pagamentos", label: "Receber pagamento", hint: "F4" },
            { href: "/caixa/pedidos", label: "Buscar pedido", hint: "F3" },
            { href: "/caixa/sangria", label: "Sangria", hint: "F7" },
            { href: "/caixa/suprimento", label: "Suprimento", hint: "F8" },
            { href: "/caixa/despesa", label: "Despesa", hint: "" },
          ].map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="flex min-h-20 flex-col justify-center rounded-xl border border-zinc-800 bg-card px-3 py-2 text-sm font-medium hover:border-primary/50 hover:bg-primary/10"
            >
              {item.label}
              {item.hint ? <span className="text-[11px] font-normal text-zinc-500">{item.hint}</span> : null}
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
                    {formatBRL(Math.abs(row.amountCents))}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-card p-4">
          <h2 className="font-heading text-lg">Resumo financeiro</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            {[
              ["Dinheiro", data.paymentSummary.cashCents, data.paymentSummary.cashCount],
              ["PIX", data.paymentSummary.pixCents, data.paymentSummary.pixCount],
              ["Débito", data.paymentSummary.debitCents, data.paymentSummary.debitCount],
              ["Crédito", data.paymentSummary.creditCents, data.paymentSummary.creditCount],
              ["Outros", data.paymentSummary.otherCents, data.paymentSummary.otherCount],
            ].map(([label, cents, count]) => (
              <div key={String(label)} className="flex justify-between">
                <dt className="text-zinc-400">
                  {label}
                  <span className="ml-2 text-xs text-zinc-600">{count} transações</span>
                </dt>
                <dd>{formatBRL(Number(cents))}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-card p-4">
          <h2 className="font-heading text-lg">Avisos</h2>
          <ul className="mt-3 grid gap-2 text-sm">
            {data.notifications.length === 0 ? (
              <li className="text-zinc-500">Nenhum aviso no momento.</li>
            ) : (
              data.notifications.map((item) => (
                <li key={item.id} className="rounded-lg border border-zinc-800 px-3 py-2">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-zinc-500">{item.body}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
