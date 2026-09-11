import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { getCashierDashboard, getOpenSession } from "@/server/services/cash";
import { formatBRL } from "@/lib/money";
import { printReceiptAction } from "@/app/actions/cash";
import { Button } from "@/components/ui/button";
import { PageHeader, PageStack } from "@/components/ds/page-header";
import { Surface, StatCard } from "@/components/ds/surface";

export default async function TurnoPage() {
  const ctx = await requirePage(PERMISSIONS.CASH_READ);
  const session = await getOpenSession(ctx.tenantId, { operatorId: ctx.userId });
  const data = await getCashierDashboard(ctx.tenantId, ctx.userId);
  const totals = data.totals;
  return (
    <PageStack>
      <PageHeader
        title="Meu turno"
        description="Resumo operacional. Relatórios gerenciais ficam com o gerente."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pedidos pagos" value={String(totals.paidCount)} />
        <StatCard label="Vendas" value={formatBRL(totals.salesCents)} />
        <StatCard label="Dinheiro" value={formatBRL(totals.cashSalesCents)} />
        <StatCard label="PIX" value={formatBRL(totals.pixCents)} />
        <StatCard label="Cartão" value={formatBRL(totals.debitCents + totals.creditCents)} />
        <StatCard label="Sangrias" value={formatBRL(totals.sangriaCents)} />
        <StatCard
          label="Diferença"
          value={session ? "Em andamento" : formatBRL(Math.abs(data.lastClosed?.differenceCents ?? 0))}
        />
      </div>
      <Surface>
        <form
          action={async () => {
            "use server";
            await printReceiptAction({ kind: "shift", totals });
          }}
        >
          <Button type="submit" variant="outline">
            Imprimir resumo
          </Button>
        </form>
      </Surface>
    </PageStack>
  );
}
