import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { listOwnClosings } from "@/server/services/cash";
import { formatBRL } from "@/lib/money";
import { formatClock, formatDay } from "@/domain/cash/labels";
import { PageHeader, PageStack } from "@/components/ds/page-header";
import { DataTable, StatusPill } from "@/components/ds/data-table";
import { EmptyState } from "@/components/empty-state";
import { Surface } from "@/components/ds/surface";

export default async function HistoricoPage() {
  const ctx = await requirePage(PERMISSIONS.CASH_READ);
  const rows = await listOwnClosings(ctx.tenantId, ctx.userId);
  return (
    <PageStack>
      <PageHeader
        title="Histórico"
        description="Somente os seus fechamentos. Não é possível alterar um caixa antigo."
      />
      {rows.length === 0 ? (
        <Surface>
          <EmptyState title="Nenhum fechamento" description="Quando você fechar o caixa, o registro aparece aqui." />
        </Surface>
      ) : (
        <DataTable
          headers={["Data", "Código", "Abertura", "Fechamento", "Vendas", "Dinheiro", "PIX", "Cartão", "Sangrias", "Diferença", "Status"]}
          minWidth="720px"
        >
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="whitespace-nowrap px-3 py-2.5">{formatDay(row.openedAt)}</td>
              <td className="whitespace-nowrap px-3 py-2.5">{row.publicCode ?? row.terminal.name}</td>
              <td className="whitespace-nowrap px-3 py-2.5">{formatClock(row.openedAt)}</td>
              <td className="whitespace-nowrap px-3 py-2.5">{row.closedAt ? formatClock(row.closedAt) : "—"}</td>
              <td className="whitespace-nowrap px-3 py-2.5">{formatBRL(row.salesCents)}</td>
              <td className="whitespace-nowrap px-3 py-2.5">{formatBRL(row.cashCents)}</td>
              <td className="whitespace-nowrap px-3 py-2.5">{formatBRL(row.pixCents)}</td>
              <td className="whitespace-nowrap px-3 py-2.5">{formatBRL(row.cardCents)}</td>
              <td className="whitespace-nowrap px-3 py-2.5">{formatBRL(row.sangriaCents)}</td>
              <td className="whitespace-nowrap px-3 py-2.5">{formatBRL(Math.abs(row.differenceCents ?? 0))}</td>
              <td className="whitespace-nowrap px-3 py-2.5">
                <StatusPill tone={row.status === "CLOSED" ? "neutral" : "success"}>
                  {row.status === "CLOSED" ? "Fechado" : "Aberto"}
                </StatusPill>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </PageStack>
  );
}
