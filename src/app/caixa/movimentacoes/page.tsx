import { requireOpenCashPage } from "@/server/cash-page";
import { listSessionMovements } from "@/server/services/cash";
import { formatBRL } from "@/lib/money";
import { CASH_MOVEMENT_LABELS, formatClock } from "@/domain/cash/labels";
import { PageHeader, PageStack } from "@/components/ds/page-header";
import { Surface } from "@/components/ds/surface";
import { EmptyState } from "@/components/empty-state";

export default async function MovimentacoesPage() {
  const ctx = await requireOpenCashPage();
  const rows = await listSessionMovements(ctx.tenantId, ctx.session.id);
  return (
    <PageStack>
      <PageHeader
        title="Movimentações"
        description="Linha do tempo deste turno. Nada é apagado: cancelamentos ficam com status."
      />
      {rows.length === 0 ? (
        <Surface>
          <EmptyState title="Nenhuma movimentação" description="Sangrias, suprimentos e vendas aparecem aqui." />
        </Surface>
      ) : (
        <ol className="grid gap-2">
          {rows.map((row) => {
            const outbound = row.type === "SANGRIA" || row.type === "EXPENSE" || row.type === "REFUND";
            return (
              <li key={row.id} className="rounded-xl border border-border bg-card px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {formatClock(row.createdAt)} · {CASH_MOVEMENT_LABELS[row.type] ?? row.type}
                      {row.status === "CANCELLED" ? " (cancelado)" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.operator.name}
                      {row.order ? ` · Pedido #${row.order.publicCode}` : ""}
                      {row.notes ? ` · ${row.notes}` : ""}
                    </p>
                  </div>
                  <p className={outbound ? "text-destructive" : "text-success"}>
                    {outbound ? "-" : "+"}
                    {formatBRL(row.amountCents)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </PageStack>
  );
}
