import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { getCashSessionDetail } from "@/server/services/cash-desk";
import { formatBRL, formatSignedBRL } from "@/lib/money";
import { CASH_MOVEMENT_LABELS, EXPENSE_CATEGORIES, formatClock, formatDay } from "@/domain/cash/labels";
import { operatorLabel } from "@/domain/cash/status";
import { ConferCashForm } from "@/components/cash-desk/confer-form";
import { AdjustCashForm } from "@/components/cash-desk/adjust-form";
import { PageHeader } from "@/components/ds/page-header";
import { StatCard } from "@/components/ds/surface";
import { StatusPill } from "@/components/ds/data-table";

const TABS = [
  { id: "resumo", label: "Resumo" },
  { id: "vendas", label: "Vendas" },
  { id: "pagamentos", label: "Pagamentos" },
  { id: "movimentacoes", label: "Movimentações" },
  { id: "sangrias", label: "Sangrias" },
  { id: "suprimentos", label: "Suprimentos" },
  { id: "despesas", label: "Despesas" },
  { id: "conferencia", label: "Conferência" },
  { id: "auditoria", label: "Auditoria" },
] as const;

function expenseLabel(reason: string | null) {
  return EXPENSE_CATEGORIES.find((item) => item.value === reason)?.label ?? reason ?? "—";
}

export default async function CaixaDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string }>;
}) {
  const ctx = await requirePage(PERMISSIONS.CASH_CONFER);
  const { id } = await params;
  const { aba } = await searchParams;
  const tab = TABS.some((item) => item.id === aba) ? aba! : "resumo";
  let detail;
  try {
    detail = await getCashSessionDetail({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      role: ctx.tenantRole,
      sessionId: id,
    });
  } catch {
    notFound();
  }

  const { session, totals, ui } = detail;
  const cards = [
    ["Saldo inicial", totals.openingCents],
    ["Vendas", totals.salesCents],
    ["Dinheiro", totals.cashSalesCents],
    ["PIX", totals.pixCents],
    ["Débito", totals.debitCents],
    ["Crédito", totals.creditCents],
    ["Sangrias", totals.sangriaCents],
    ["Suprimentos", totals.supplyCents],
    ["Despesas", totals.expenseCents],
    ["Saldo esperado", totals.expectedCashCents],
    ["Saldo contado", session.countedCents ?? 0],
    ["Diferença", session.differenceCents ?? 0],
  ] as const;

  return (
    <div className="grid gap-6">
      <PageHeader
        title={`Sessão ${session.publicCode}`}
        description={`${operatorLabel(session.operator)} · ${session.terminal.name} · ${detail.tenantName}`}
        backHref="/app/caixas"
        backLabel="Central de conferência"
        actions={<StatusPill tone={ui.tone === "success" ? "success" : ui.tone === "warning" ? "warning" : ui.tone === "danger" ? "danger" : ui.tone === "info" ? "info" : "neutral"}>{ui.label}</StatusPill>}
      />

      <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Abertura</dt>
          <dd>
            {formatDay(session.openedAt)} {formatClock(session.openedAt)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Fechamento</dt>
          <dd>
            {session.closedAt ? `${formatDay(session.closedAt)} ${formatClock(session.closedAt)}` : "Em andamento"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Conferência</dt>
          <dd>
            {session.conferredAt
              ? `${operatorLabel(session.conferredBy)} · ${formatDay(session.conferredAt)} ${formatClock(session.conferredAt)}`
              : "Pendente"}
          </dd>
        </div>
      </dl>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <StatCard
            key={label}
            label={label}
            value={label === "Diferença" ? formatSignedBRL(value) : formatBRL(value)}
            tone={
              label === "Diferença"
                ? value < 0
                  ? "danger"
                  : value > 0
                    ? "warning"
                    : "success"
                : undefined
            }
          />
        ))}
      </section>

      <nav className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <Link
            key={item.id}
            href={`/app/caixas/${session.id}?aba=${item.id}`}
            className={
              tab === item.id
                ? "rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground"
                : "rounded-full border border-border px-3 py-1 text-sm"
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === "resumo" ? (
        <p className="text-sm text-muted-foreground">
          PIX e cartão não entram no saldo físico. O esperado usa saldo inicial + dinheiro + suprimentos − sangrias −
          despesas ± ajustes.
        </p>
      ) : null}

      {tab === "vendas" ? (
        <Table
          headers={["Pedido", "Data", "Cliente", "Mesa", "Valor", "Status"]}
          rows={detail.orders.map((order) => [
            `#${order.publicCode}`,
            `${formatDay(order.createdAt)} ${formatClock(order.createdAt)}`,
            order.customerName,
            order.tableNumber ?? "—",
            formatBRL(order.totalCents),
            order.paymentStatus,
          ])}
        />
      ) : null}

      {tab === "pagamentos" ? (
        <Table
          headers={["Pedido", "Cliente", "Valor", "Forma", "Data", "Operador", "Status"]}
          rows={detail.payments.map((payment) => [
            `#${payment.order.publicCode}`,
            payment.order.customerName,
            formatBRL(payment.amountCents),
            payment.cardKind === "CREDIT" ? "Crédito" : payment.cardKind === "DEBIT" ? "Débito" : payment.method,
            `${formatDay(payment.createdAt)} ${formatClock(payment.createdAt)}`,
            operatorLabel(payment.operator),
            payment.status,
          ])}
        />
      ) : null}

      {tab === "movimentacoes" ? (
        <Table
          headers={["Data", "Tipo", "Descrição", "Forma", "Valor", "Operador"]}
          rows={detail.movements.map((row) => [
            `${formatDay(row.createdAt)} ${formatClock(row.createdAt)}`,
            CASH_MOVEMENT_LABELS[row.type] ?? row.type,
            row.order?.publicCode ? `Pedido #${row.order.publicCode}` : row.reason || row.notes || "—",
            row.method ?? "—",
            `${row.type === "SANGRIA" || row.type === "EXPENSE" || row.type === "REFUND" ? "-" : "+"}${formatBRL(Math.abs(row.amountCents))}`,
            operatorLabel(row.operator),
          ])}
        />
      ) : null}

      {tab === "sangrias" ? (
        <Table
          headers={["Data", "Valor", "Motivo", "Operador", "Observação"]}
          rows={detail.withdrawals.map((row) => [
            `${formatDay(row.createdAt)} ${formatClock(row.createdAt)}`,
            formatBRL(row.amountCents),
            row.reason ?? "—",
            operatorLabel(row.operator),
            row.notes ?? "—",
          ])}
        />
      ) : null}

      {tab === "suprimentos" ? (
        <Table
          headers={["Data", "Valor", "Motivo", "Operador", "Observação"]}
          rows={detail.supplies.map((row) => [
            `${formatDay(row.createdAt)} ${formatClock(row.createdAt)}`,
            formatBRL(row.amountCents),
            row.reason ?? "—",
            operatorLabel(row.operator),
            row.notes ?? "—",
          ])}
        />
      ) : null}

      {tab === "despesas" ? (
        <Table
          headers={["Data", "Valor", "Categoria", "Descrição", "Operador"]}
          rows={detail.expenses.map((row) => [
            `${formatDay(row.createdAt)} ${formatClock(row.createdAt)}`,
            formatBRL(row.amountCents),
            expenseLabel(row.reason),
            row.notes ?? "—",
            operatorLabel(row.operator),
          ])}
        />
      ) : null}

      {tab === "conferencia" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="font-heading text-lg">Conferir caixa</h2>
            <dl className="mt-3 grid gap-2 text-sm">
              <div className="flex justify-between">
                <dt>Esperado</dt>
                <dd>{formatBRL(totals.expectedCashCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Contado</dt>
                <dd>{session.countedCents == null ? "—" : formatBRL(session.countedCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Diferença</dt>
                <dd>{session.differenceCents == null ? "—" : formatSignedBRL(session.differenceCents)}</dd>
              </div>
            </dl>
            {session.status === "CLOSED" && session.conferenceStatus === "PENDING" ? (
              <ConferCashForm sessionId={session.id} />
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                {session.conferenceNote || "Conferência já registrada ou o caixa ainda está aberto."}
              </p>
            )}
          </div>
          <AdjustCashForm sessionId={session.id} />
        </div>
      ) : null}

      {tab === "auditoria" ? (
        <ul className="grid gap-2">
          {detail.audit.length === 0 ? (
            <li className="text-sm text-muted-foreground">Nenhum evento de auditoria encontrado para esta sessão.</li>
          ) : (
            detail.audit.map((row) => (
              <li key={row.id} className="rounded-xl border border-border px-4 py-3 text-sm">
                <p className="font-medium">
                  {formatDay(row.createdAt)} {formatClock(row.createdAt)} · {row.action} · {row.entity}
                </p>
                <p className="text-muted-foreground">
                  {operatorLabel(row.user)} {row.metadata ? `· ${JSON.stringify(row.metadata)}` : ""}
                </p>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum registro nesta aba.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-background text-muted-foreground">
          <tr>
            {headers.map((head) => (
              <th key={head} className="px-3 py-2 font-medium">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-border">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
