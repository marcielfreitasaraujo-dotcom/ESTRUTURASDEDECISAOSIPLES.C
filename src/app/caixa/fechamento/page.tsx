import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { summarizeCashDay } from "@/server/services/pos";
import { CloseCashButton } from "@/components/close-cash-button";
import { formatBRL } from "@/lib/money";

const METHOD_LABEL: Record<string, string> = {
  CASH: "Dinheiro",
  PIX: "Pix",
  CARD: "Cartão",
};

export default async function CaixaFechamentoPage() {
  const ctx = await requirePage(PERMISSIONS.FINANCE_READ);
  const summary = await summarizeCashDay(ctx.tenantId);

  return (
    <div className="grid max-w-2xl gap-6">
      <div>
        <p className="text-sm text-primary">Monitoramento</p>
        <h1 className="text-3xl font-semibold">Fechar caixa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          O gerente acompanha as vendas do dia e fecha o caixa. O operador de caixa vende e controla estoque, sem este
          fechamento.
        </p>
      </div>
      <section className="grid gap-2 rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">Recebido hoje</p>
        <p className="font-heading text-3xl">{formatBRL(summary.paidTotalCents)}</p>
        <p className="text-sm text-muted-foreground">
          {summary.paidCount} pagos · {summary.unpaidCount} sem receber · {summary.openCount} ainda em produção
        </p>
      </section>
      <ul className="grid gap-2">
        {Object.entries(summary.byMethod).map(([method, bucket]) => (
          <li key={method} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm">
            <span>{METHOD_LABEL[method] ?? method}</span>
            <span>
              {bucket.count} · {formatBRL(bucket.totalCents)}
            </span>
          </li>
        ))}
        {summary.paidCount === 0 ? (
          <li className="text-sm text-muted-foreground">Nenhuma venda recebida hoje.</li>
        ) : null}
      </ul>
      <CloseCashButton />
    </div>
  );
}
