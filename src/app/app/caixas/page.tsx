import Link from "next/link";
import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { getCashDeskSnapshot, listCashDeskSessions, listCashTerminals } from "@/server/services/cash-desk";
import { listCashOperators } from "@/server/services/cash";
import { formatBRL, formatSignedBRL } from "@/lib/money";
import { formatClock, formatDay } from "@/domain/cash/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { nativeSelectClass } from "@/lib/field";
import { PageHeader, PageStack } from "@/components/ds/page-header";
import { StatCard } from "@/components/ds/surface";
import { DataTable, StatusPill } from "@/components/ds/data-table";

const PERIODS = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "last7", label: "Últimos 7 dias" },
  { value: "last30", label: "Últimos 30 dias" },
  { value: "month", label: "Este mês" },
  { value: "prevMonth", label: "Mês anterior" },
  { value: "custom", label: "Personalizado" },
  { value: "all", label: "Todo o histórico" },
];

function statusTone(tone: string): "success" | "warning" | "danger" | "info" | "neutral" {
  if (tone === "success") return "success";
  if (tone === "warning") return "warning";
  if (tone === "danger") return "danger";
  if (tone === "info") return "info";
  return "neutral";
}

export default async function CaixasPage({
  searchParams,
}: {
  searchParams: Promise<{
    periodo?: string;
    de?: string;
    ate?: string;
    operador?: string;
    terminal?: string;
    status?: string;
    diferenca?: string;
    q?: string;
  }>;
}) {
  const ctx = await requirePage(PERMISSIONS.CASH_CONFER);
  const params = await searchParams;
  const [snapshot, operators, terminals, rows] = await Promise.all([
    getCashDeskSnapshot(ctx.tenantId),
    listCashOperators(ctx.tenantId),
    listCashTerminals(ctx.tenantId),
    listCashDeskSessions(ctx.tenantId, {
      period: params.periodo || "last30",
      from: params.de,
      to: params.ate,
      operatorId: params.operador || undefined,
      terminalId: params.terminal || undefined,
      status: params.status || undefined,
      difference: params.diferenca || undefined,
      query: params.q || undefined,
    }),
  ]);

  const exportQuery = new URLSearchParams({
    periodo: params.periodo || "last30",
    ...(params.de ? { de: params.de } : {}),
    ...(params.ate ? { ate: params.ate } : {}),
    ...(params.operador ? { operador: params.operador } : {}),
    ...(params.terminal ? { terminal: params.terminal } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.diferenca ? { diferenca: params.diferenca } : {}),
    ...(params.q ? { q: params.q } : {}),
  }).toString();

  return (
    <PageStack>
      <PageHeader
        title="Central de conferência"
        description="Todos os caixas da loja, inclusive turnos antigos. Nada é apagado depois do fechamento."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/app/caixas/terminais">Terminais</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/app/caixas/relatorios">Relatórios</Link>
            </Button>
            <Button asChild>
              <Link href={`/app/caixas/export?${exportQuery}`}>Exportar CSV</Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Caixas abertos" value={String(snapshot.openCount)} />
        <StatCard label="Fechados hoje" value={String(snapshot.closedToday)} />
        <StatCard label="Aguardando conferência" value={String(snapshot.pendingConference)} tone="warning" />
        <StatCard label="Com diferença" value={String(snapshot.withDifference)} tone="danger" />
        <StatCard label="Vendas hoje" value={formatBRL(snapshot.salesTodayCents)} />
        <StatCard label="Dinheiro nos caixas" value={formatBRL(snapshot.cashInDrawersCents)} />
      </section>

      {snapshot.openSessions.length ? (
        <section className="grid gap-4 md:grid-cols-2">
          {snapshot.openSessions.map((row) => (
            <Link key={row.id} href={`/app/caixas/${row.id}`} className="rounded-xl border border-success/20 bg-success/5 p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">{row.terminalName}</h2>
                <StatusPill tone="success">Aberto</StatusPill>
              </div>
              <dl className="mt-3 grid gap-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Operador</dt>
                  <dd>{row.operatorName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Aberto às</dt>
                  <dd>{formatClock(row.openedAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Saldo inicial</dt>
                  <dd>{formatBRL(row.openingCents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Vendas</dt>
                  <dd>{formatBRL(row.salesCents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Saldo esperado</dt>
                  <dd>{formatBRL(row.expectedCashCents)}</dd>
                </div>
              </dl>
            </Link>
          ))}
        </section>
      ) : null}

      {snapshot.alerts.length ? (
        <section className="grid gap-2">
          {snapshot.alerts.map((alert) => (
            <Link key={alert.id} href={alert.href} className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
              <strong>{alert.title}.</strong> {alert.detail}
            </Link>
          ))}
        </section>
      ) : null}

      <form method="get" className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-4">
        <select name="periodo" defaultValue={params.periodo || "last30"} className={nativeSelectClass} aria-label="Período">
          {PERIODS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <Input name="de" type="date" defaultValue={params.de} aria-label="De" />
        <Input name="ate" type="date" defaultValue={params.ate} aria-label="Até" />
        <Input name="q" defaultValue={params.q} placeholder="Pesquisar caixa, operador ou código" />
        <select name="operador" defaultValue={params.operador || ""} className={nativeSelectClass} aria-label="Operador">
          <option value="">Todos os operadores</option>
          {operators.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
        <select name="terminal" defaultValue={params.terminal || ""} className={nativeSelectClass} aria-label="Terminal">
          <option value="">Todos os terminais</option>
          {terminals.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={params.status || ""} className={nativeSelectClass} aria-label="Status">
          <option value="">Todos os status</option>
          <option value="open">Aberto</option>
          <option value="closed">Fechado</option>
          <option value="pending">Aguardando conferência</option>
          <option value="conferred">Conferido</option>
          <option value="difference">Com diferença</option>
        </select>
        <select name="diferenca" defaultValue={params.diferenca || ""} className={nativeSelectClass} aria-label="Diferença">
          <option value="">Todas as diferenças</option>
          <option value="none">Sem diferença</option>
          <option value="shortage">Com falta</option>
          <option value="overage">Com sobra</option>
        </select>
        <Button type="submit" className="md:col-span-4">
          Filtrar
        </Button>
      </form>

      <DataTable
        minWidth="1100px"
        headers={["Código", "Data", "Operador", "Terminal", "Abertura", "Fechamento", "Status", "Vendas", "Esperado", "Contado", "Diferença", "Ações"]}
      >
        {rows.length === 0 ? (
          <tr>
            <td colSpan={12} className="px-3 py-8 text-center text-muted-foreground">
              Nenhum caixa encontrado neste filtro. Amplie o período ou pesquise o código da sessão.
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row.id} className="hover:bg-muted/40">
              <td className="px-3 py-2.5">
                <Link href={`/app/caixas/${row.id}`} className="font-medium text-primary">
                  {row.publicCode}
                </Link>
              </td>
              <td className="whitespace-nowrap px-3 py-2.5">{formatDay(row.openedAt)}</td>
              <td className="whitespace-nowrap px-3 py-2.5">{row.operatorName}</td>
              <td className="whitespace-nowrap px-3 py-2.5">{row.terminalName}</td>
              <td className="whitespace-nowrap px-3 py-2.5">{formatClock(row.openedAt)}</td>
              <td className="whitespace-nowrap px-3 py-2.5">{row.closedAt ? formatClock(row.closedAt) : "—"}</td>
              <td className="px-3 py-2.5">
                <StatusPill tone={statusTone(row.ui.tone)}>{row.ui.label}</StatusPill>
              </td>
              <td className="px-3 py-2.5 tabular-nums">{formatBRL(row.salesCents)}</td>
              <td className="px-3 py-2.5 tabular-nums">{formatBRL(row.expectedCashCents)}</td>
              <td className="px-3 py-2.5 tabular-nums">{row.countedCents == null ? "—" : formatBRL(row.countedCents)}</td>
              <td className={`px-3 py-2.5 tabular-nums ${(row.differenceCents ?? 0) === 0 ? "text-success" : "text-destructive"}`}>
                {row.differenceCents == null ? "—" : formatSignedBRL(row.differenceCents)}
              </td>
              <td className="px-3 py-2.5">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/app/caixas/${row.id}`}>Detalhes</Link>
                </Button>
              </td>
            </tr>
          ))
        )}
      </DataTable>
    </PageStack>
  );
}
