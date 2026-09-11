"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatBRL } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import type { ControlCenterSnapshot, SalesRange } from "@/domain/dashboard/control-center";
import type { OrderStatus } from "@/domain/ordering/status";

const RANGES: { id: SalesRange; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "month", label: "Mês" },
];

export function ControlCenter({ initial }: { initial: ControlCenterSnapshot }) {
  const [range, setRange] = useState<SalesRange>("today");
  const [data, setData] = useState(initial);

  useEffect(() => {
    let active = true;
    async function load() {
      const response = await fetch(`/api/app/painel?range=${range}`, { cache: "no-store" });
      if (!response.ok || !active) return;
      setData((await response.json()) as ControlCenterSnapshot);
    }
    void load();
    const timer = window.setInterval(() => void load(), 8000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [range]);

  const delta = data.kpis.todaySalesDelta;
  const maxBar = Math.max(1, ...data.salesSeries.map((row) => row.salesCents));

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{data.storeName}</p>
          <h1 className="font-heading text-3xl">Visão geral do estabelecimento</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {data.greeting} Veja como está a operação agora.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/garcom">Novo pedido</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/salao">Abrir mesa</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/cardapio">Cadastrar produto</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/clientes">Cadastrar cliente</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/financeiro">Registrar despesa</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/caixas">Caixa</Link>
          </Button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Vendas hoje" value={formatBRL(data.kpis.todaySalesCents)} hint={`${delta >= 0 ? "+" : ""}${delta}% em relação a ontem`} />
        <Kpi label="Vendas do mês" value={formatBRL(data.kpis.monthSalesCents)} />
        <Kpi label="Pedidos hoje" value={String(data.kpis.todayOrders)} hint={`${data.kpis.yesterdayOrders} ontem`} />
        <Kpi label="Pedidos abertos" value={String(data.kpis.openOrders)} />
        <Kpi label="Ticket médio" value={formatBRL(data.kpis.averageTicketCents)} />
        <Kpi label="Clientes" value={String(data.kpis.customers)} />
        <Kpi label="Mesas ocupadas" value={`${data.kpis.tablesOccupied} / ${data.kpis.tablesTotal}`} />
        <Kpi
          label="Caixa"
          value={data.cash.open ? "Aberto" : "Fechado"}
          hint={`${formatBRL(data.cash.balanceCents)}${data.cash.operatorName ? ` · ${data.cash.operatorName}` : ""}`}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Gráfico de vendas</CardTitle>
            <div className="flex flex-wrap gap-1">
              {RANGES.map((item) => (
                <Button key={item.id} type="button" size="sm" variant={range === item.id ? "default" : "outline"} onClick={() => setRange(item.id)}>
                  {item.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="grid gap-2">
            {data.salesSeries.length === 0 ? <p className="text-sm text-muted-foreground">Sem movimento neste período.</p> : null}
            {data.salesSeries.map((row) => (
              <div key={row.label} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-2 text-xs">
                <span className="text-muted-foreground">{row.label}</span>
                <div className="h-6 overflow-hidden rounded-md bg-zinc-800">
                  <div className="h-full rounded-md bg-orange-500/80 transition-all" style={{ width: `${Math.max(4, (row.salesCents / maxBar) * 100)}%` }} />
                </div>
                <span className="tabular-nums text-zinc-300">
                  {formatBRL(row.salesCents)} · {row.orders}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Formas de pagamento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.payments.length === 0 ? <p className="text-sm text-muted-foreground">Ainda sem vendas neste recorte.</p> : null}
            {data.payments.map((item) => (
              <div key={item.method} className="grid gap-1">
                <div className="flex justify-between text-sm">
                  <span>{item.label}</span>
                  <span>
                    {formatBRL(item.cents)} · {item.percent}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full rounded-full bg-amber-400/80" style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pedidos recentes</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/pedidos">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-2">
            {data.recentOrders.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p> : null}
            {data.recentOrders.map((order) => (
              <Link key={order.id} href="/app/pedidos" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-sm hover:bg-muted/40">
                <span className="font-medium">#{order.publicCode}</span>
                <span className="text-zinc-400">{order.customerName}</span>
                <span>{order.channel}</span>
                <span>{new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                <span>{formatBRL(order.totalCents)}</span>
                <StatusBadge status={order.status as OrderStatus} />
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Operação agora</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <Block
              title="Mesas"
              href="/app/salao"
              lines={[
                `${data.operation.tables.total} mesas`,
                `${data.operation.tables.free} livres · ${data.operation.tables.occupied} ocupadas · ${data.operation.tables.reserved} reservadas`,
              ]}
            />
            <Block
              title="Cozinha"
              href="/app/cozinha"
              lines={[`${data.operation.kitchen.waiting} aguardando`, `${data.operation.kitchen.preparing} em preparo`, `${data.operation.kitchen.ready} prontos hoje`]}
            />
            <Block
              title="Delivery"
              href="/app/entregas"
              lines={[`${data.operation.delivery.waiting} aguardando`, `${data.operation.delivery.inRoute} em rota`, `${data.operation.delivery.deliveredToday} entregues hoje`]}
            />
            <Block
              title="Caixa"
              href="/app/caixas"
              lines={[data.cash.open ? "Aberto" : "Fechado", data.cash.operatorName ? `Operador: ${data.cash.operatorName}` : formatBRL(data.cash.balanceCents)]}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Alertas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {data.alerts.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum alerta no momento.</p> : null}
            {data.alerts.map((alert) => (
              <Link key={alert.id} href={alert.href} className="rounded-lg border border-zinc-800 px-3 py-2 text-sm hover:bg-muted/40">
                <p className={alert.tone === "alert" ? "text-red-300" : alert.tone === "warn" ? "text-amber-200" : "text-sky-200"}>{alert.title}</p>
                <p className="text-xs text-muted-foreground">{alert.detail}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mais vendidos no mês</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {data.topProducts.length === 0 ? <p className="text-muted-foreground">Sem itens faturados neste mês.</p> : null}
            {data.topProducts.map((item) => (
              <div key={item.name} className="flex justify-between gap-3">
                <span>
                  {item.name} · {item.quantity}x
                </span>
                <span>{formatBRL(item.cents)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-2xl">{value}</p>
        {hint ? <p className="mt-1 text-xs text-zinc-400">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function Block({ title, href, lines }: { title: string; href: string; lines: string[] }) {
  return (
    <Link href={href} className="rounded-lg border border-zinc-800 p-3 hover:bg-muted/30">
      <p className="font-medium">{title}</p>
      {lines.map((line) => (
        <p key={line} className="text-muted-foreground">
          {line}
        </p>
      ))}
    </Link>
  );
}
