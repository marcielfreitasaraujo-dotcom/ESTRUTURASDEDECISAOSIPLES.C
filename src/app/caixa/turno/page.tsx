import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { getCashierDashboard, getOpenSession } from "@/server/services/cash";
import { formatBRL } from "@/lib/money";
import { printReceiptAction } from "@/app/actions/cash";
import { Button } from "@/components/ui/button";

export default async function TurnoPage() {
  const ctx = await requirePage(PERMISSIONS.CASH_READ);
  const session = await getOpenSession(ctx.tenantId);
  const data = await getCashierDashboard(ctx.tenantId);
  const totals = data.totals;
  return (
    <div className="grid max-w-lg gap-4">
      <div>
        <h1 className="font-heading text-2xl">Meu turno</h1>
        <p className="text-sm text-zinc-400">Resumo operacional. Relatórios gerenciais ficam com o gerente.</p>
      </div>
      <dl className="grid gap-2 rounded-xl border border-zinc-800 bg-card p-4 text-sm">
        <div className="flex justify-between">
          <dt>Pedidos pagos</dt>
          <dd>{totals.paidCount}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Vendas</dt>
          <dd>{formatBRL(totals.salesCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Dinheiro</dt>
          <dd>{formatBRL(totals.cashSalesCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>PIX</dt>
          <dd>{formatBRL(totals.pixCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Cartão</dt>
          <dd>{formatBRL(totals.debitCents + totals.creditCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Sangrias</dt>
          <dd>{formatBRL(totals.sangriaCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Diferença</dt>
          <dd>{session ? "Em andamento" : formatBRL(Math.abs(data.lastClosed?.differenceCents ?? 0))}</dd>
        </div>
      </dl>
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
    </div>
  );
}