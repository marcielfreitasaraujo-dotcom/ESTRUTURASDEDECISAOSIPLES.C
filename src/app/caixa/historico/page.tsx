import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { listOwnClosings } from "@/server/services/cash";
import { formatBRL } from "@/lib/money";
import { formatClock, formatDay } from "@/domain/cash/labels";

export default async function HistoricoPage() {
  const ctx = await requirePage(PERMISSIONS.CASH_READ);
  const rows = await listOwnClosings(ctx.tenantId, ctx.userId);
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="font-heading text-2xl">Histórico</h1>
        <p className="text-sm text-zinc-400">Somente os seus fechamentos. Não é possível alterar um caixa antigo.</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-zinc-950 text-zinc-400">
            <tr>
              {["Data", "Terminal", "Abertura", "Fechamento", "Vendas", "Dinheiro", "PIX", "Cartão", "Sangrias", "Diferença", "Status"].map((head) => (
                <th key={head} className="px-3 py-2 font-medium">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-zinc-800">
                <td className="px-3 py-2">{formatDay(row.openedAt)}</td>
                <td className="px-3 py-2">{row.terminal.name}</td>
                <td className="px-3 py-2">{formatClock(row.openedAt)}</td>
                <td className="px-3 py-2">{row.closedAt ? formatClock(row.closedAt) : "—"}</td>
                <td className="px-3 py-2">{formatBRL(row.salesCents)}</td>
                <td className="px-3 py-2">{formatBRL(row.cashCents)}</td>
                <td className="px-3 py-2">{formatBRL(row.pixCents)}</td>
                <td className="px-3 py-2">{formatBRL(row.cardCents)}</td>
                <td className="px-3 py-2">{formatBRL(row.sangriaCents)}</td>
                <td className="px-3 py-2">{formatBRL(Math.abs(row.differenceCents ?? 0))}</td>
                <td className="px-3 py-2">{row.status === "CLOSED" ? "Fechado" : "Aberto"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}