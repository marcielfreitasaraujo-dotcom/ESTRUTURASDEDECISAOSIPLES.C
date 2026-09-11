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

function statusClass(tone: string) {
  if (tone === "success") return "text-emerald-400";
  if (tone === "warning") return "text-amber-300";
  if (tone === "danger") return "text-red-400";
  if (tone === "info") return "text-sky-400";
  return "text-zinc-400";
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
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl">Central de conferência</h1>
          <p className="text-sm text-zinc-400">Todos os caixas da loja, inclusive turnos antigos. Nada é apagado depois do fechamento.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/app/caixas/terminais">Terminais</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/caixas/relatorios">Relatórios</Link>
          </Button>
          <Button asChild>
            <Link href={`/app/caixas/export?${exportQuery}`}>Exportar CSV</Link>
          </Button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi label="Caixas abertos" value={String(snapshot.openCount)} />
        <Kpi label="Fechados hoje" value={String(snapshot.closedToday)} />
        <Kpi label="Aguardando conferência" value={String(snapshot.pendingConference)} tone="warn" />
        <Kpi label="Com diferença" value={String(snapshot.withDifference)} tone="alert" />
        <Kpi label="Vendas hoje" value={formatBRL(snapshot.salesTodayCents)} />
        <Kpi label="Dinheiro nos caixas" value={formatBRL(snapshot.cashInDrawersCents)} />
      </section>

      {snapshot.openSessions.length ? (
        <section className="grid gap-3 md:grid-cols-2">
          {snapshot.openSessions.map((row) => (
            <Link key={row.id} href={`/app/caixas/${row.id}`} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-heading text-xl">{row.terminalName}</h2>
                <span className="text-sm text-emerald-400">🟢 Em operação</span>
              </div>
              <dl className="mt-3 grid gap-1 text-sm">
                <div className="flex justify-between"><dt className="text-zinc-500">Operador</dt><dd>{row.operatorName}</dd></div>
                <div className="flex justify-between"><dt className="text-zinc-500">Aberto às</dt><dd>{formatClock(row.openedAt)}</dd></div>
                <div className="flex justify-between"><dt className="text-zinc-500">Saldo inicial</dt><dd>{formatBRL(row.openingCents)}</dd></div>
                <div className="flex justify-between"><dt className="text-zinc-500">Vendas</dt><dd>{formatBRL(row.salesCents)}</dd></div>
                <div className="flex justify-between"><dt className="text-zinc-500">Saldo esperado</dt><dd>{formatBRL(row.expectedCashCents)}</dd></div>
              </dl>
            </Link>
          ))}
        </section>
      ) : null}

      {snapshot.alerts.length ? (
        <section className="grid gap-2">
          {snapshot.alerts.map((alert) => (
            <Link key={alert.id} href={alert.href} className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              <strong>{alert.title}.</strong> {alert.detail}
            </Link>
          ))}
        </section>
      ) : null}

      <form method="get" className="grid gap-3 rounded-2xl border border-zinc-800 bg-card p-4 md:grid-cols-4">
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

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-[1200px] text-left text-sm">
          <thead className="bg-zinc-950 text-zinc-400">
            <tr>
              {[
                "Código",
                "Abertura",
                "Fechamento",
                "Situação",
                "Conferido",
                "Operador",
                "Terminal",
                "Saldo inicial",
                "Vendas",
                "Dinheiro",
                "PIX",
                "Cartões",
                "Sangrias",
                "Suprimentos",
                "Despesas",
                "Esperado",
                "Contado",
                "Diferença",
              ].map((head) => (
                <th key={head} className="px-3 py-2 font-medium">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={18} className="px-3 py-8 text-center text-zinc-500">
                  Nenhum caixa encontrado neste filtro. Amplie o período ou pesquise o código da sessão.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-zinc-800 hover:bg-zinc-900/60">
                  <td className="px-3 py-2">
                    <Link href={`/app/caixas/${row.id}`} className="text-primary underline">
                      {row.publicCode}
                    </Link>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatDay(row.openedAt)} {formatClock(row.openedAt)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {row.closedAt ? `${formatDay(row.closedAt)} ${formatClock(row.closedAt)}` : "—"}
                  </td>
                  <td className={`px-3 py-2 ${statusClass(row.ui.tone)}`}>{row.ui.label}</td>
                  <td className="px-3 py-2">{row.conferred ? "Sim" : "Não"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row.operatorName}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row.terminalName}</td>
                  <td className="px-3 py-2">{formatBRL(row.openingCents)}</td>
                  <td className="px-3 py-2">{formatBRL(row.salesCents)}</td>
                  <td className="px-3 py-2">{formatBRL(row.cashCents)}</td>
                  <td className="px-3 py-2">{formatBRL(row.pixCents)}</td>
                  <td className="px-3 py-2">{formatBRL(row.cardCents)}</td>
                  <td className="px-3 py-2">{formatBRL(row.sangriaCents)}</td>
                  <td className="px-3 py-2">{formatBRL(row.supplyCents)}</td>
                  <td className="px-3 py-2">{formatBRL(row.expenseCents)}</td>
                  <td className="px-3 py-2">{formatBRL(row.expectedCashCents)}</td>
                  <td className="px-3 py-2">{row.countedCents == null ? "—" : formatBRL(row.countedCents)}</td>
                  <td className={`px-3 py-2 ${(row.differenceCents ?? 0) === 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {row.differenceCents == null ? "—" : formatSignedBRL(row.differenceCents)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "warn" | "alert" }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-1 font-heading text-2xl ${tone === "alert" ? "text-red-400" : tone === "warn" ? "text-amber-300" : ""}`}>
        {value}
      </p>
    </div>
  );
}
