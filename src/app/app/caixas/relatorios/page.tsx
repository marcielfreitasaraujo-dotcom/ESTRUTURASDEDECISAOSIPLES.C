import Link from "next/link";
import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { cashReports } from "@/server/services/cash-desk";
import { formatBRL, formatSignedBRL } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ds/page-header";
import { nativeSelectClass } from "@/lib/field";

export default async function RelatoriosCaixaPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; de?: string; ate?: string }>;
}) {
  const ctx = await requirePage(PERMISSIONS.CASH_CONFER);
  const params = await searchParams;
  const report = await cashReports(ctx.tenantId, {
    period: params.periodo || "month",
    from: params.de,
    to: params.ate,
  });
  const query = new URLSearchParams({
    periodo: params.periodo || "month",
    ...(params.de ? { de: params.de } : {}),
    ...(params.ate ? { ate: params.ate } : {}),
  }).toString();

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Relatórios de caixa"
        description="Fechamento por operador, terminal, período, diferenças, sangrias, suprimentos e despesas."
        backHref="/app/caixas"
        actions={
          <Button asChild>
            <Link href={`/app/caixas/export?${query}`}>Exportar CSV</Link>
          </Button>
        }
      />
      <form method="get" className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-4">
        <select name="periodo" defaultValue={params.periodo || "month"} className={nativeSelectClass}>
          <option value="today">Hoje</option>
          <option value="last7">Últimos 7 dias</option>
          <option value="last30">Últimos 30 dias</option>
          <option value="month">Este mês</option>
          <option value="prevMonth">Mês anterior</option>
          <option value="custom">Personalizado</option>
          <option value="all">Todo o histórico</option>
        </select>
        <Input name="de" type="date" defaultValue={params.de} />
        <Input name="ate" type="date" defaultValue={params.ate} />
        <Button type="submit">Atualizar</Button>
      </form>
      <section>
        <h2 className="font-heading text-xl">Por operador</h2>
        <SimpleTable
          headers={["Operador", "Caixas", "Vendas", "Dinheiro", "PIX", "Débito", "Crédito", "Sangrias", "Suprimentos", "Despesas", "Diferenças"]}
          rows={report.byOperator.map((row) => [
            row.operatorName,
            String(row.sessions),
            formatBRL(row.salesCents),
            formatBRL(row.cashCents),
            formatBRL(row.pixCents),
            formatBRL(row.debitCents),
            formatBRL(row.creditCents),
            formatBRL(row.sangriaCents),
            formatBRL(row.supplyCents),
            formatBRL(row.expenseCents),
            formatSignedBRL(row.differenceCents),
          ])}
        />
      </section>
      <section>
        <h2 className="font-heading text-xl">Por terminal</h2>
        <SimpleTable
          headers={["Terminal", "Caixas", "Vendas", "Diferenças"]}
          rows={report.byTerminal.map((row) => [row.terminalName, String(row.sessions), formatBRL(row.salesCents), formatSignedBRL(row.differenceCents)])}
        />
      </section>
      <section>
        <h2 className="font-heading text-xl">Diferenças</h2>
        <SimpleTable
          headers={["Código", "Operador", "Esperado", "Contado", "Diferença"]}
          rows={report.differences.map((row) => [
            row.publicCode,
            row.operatorName,
            formatBRL(row.expectedCashCents),
            row.countedCents == null ? "—" : formatBRL(row.countedCents),
            formatSignedBRL(row.differenceCents ?? 0),
          ])}
        />
      </section>
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-border">
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
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-3 py-6 text-muted-foreground">
                Sem dados neste período.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index} className="border-t border-border">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
