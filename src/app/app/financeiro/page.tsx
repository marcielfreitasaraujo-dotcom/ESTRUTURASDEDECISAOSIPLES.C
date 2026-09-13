import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { hasPermission, isPlatformAdmin } from "@/domain/rbac/roles";
import { listFinance } from "@/server/services/finance";
import { saveExpenseAction, saveRevenueAction } from "@/app/actions/ops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ds/page-header";
import { StatCard } from "@/components/ds/surface";
import { formatBRL } from "@/lib/money";

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

export default async function FinanceiroPage() {
  const ctx = await requirePage(PERMISSIONS.FINANCE_READ);
  const finance = await listFinance(ctx.tenantId);
  const canWrite =
    isPlatformAdmin(ctx.platformRole) ||
    (ctx.tenantRole ? hasPermission(ctx.tenantRole, PERMISSIONS.FINANCE_WRITE) : false);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Financeiro"
        description="Despesas, receitas extras, caixa do dia e relatórios."
        actions={
          <>
            <Button asChild variant="outline">
              <a href="/caixa/fechamento">Caixa do dia</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/app/relatorios">Relatórios</a>
            </Button>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pedidos (não cancelados)" value={formatBRL(finance.salesTotal)} />
        <StatCard label="Receitas extras" value={formatBRL(finance.revenueTotal - finance.salesTotal)} />
        <StatCard label="Despesas" value={formatBRL(finance.expenseTotal)} tone="danger" />
      </div>
      {canWrite ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Nova despesa</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={saveExpenseAction} className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="exp-cat">Categoria</Label>
                  <Input id="exp-cat" name="category" required placeholder="Aluguel" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="exp-desc">Descrição</Label>
                  <Input id="exp-desc" name="description" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="exp-amount">Valor (R$)</Label>
                  <Input id="exp-amount" name="amount" type="number" step="0.01" min={0.01} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="exp-due">Vencimento</Label>
                  <Input id="exp-due" name="dueDate" type="date" defaultValue={todayInput()} />
                </div>
                <Button type="submit">Lançar despesa</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Nova receita extra</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={saveRevenueAction} className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="rev-cat">Fonte</Label>
                  <Input id="rev-cat" name="category" required placeholder="Evento" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rev-desc">Descrição</Label>
                  <Input id="rev-desc" name="description" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rev-amount">Valor (R$)</Label>
                  <Input id="rev-amount" name="amount" type="number" step="0.01" min={0.01} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rev-at">Recebido em</Label>
                  <Input id="rev-at" name="receivedAt" type="date" defaultValue={todayInput()} />
                </div>
                <Button type="submit">Lançar receita</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card">
          <h2 className="border-b px-4 py-3 text-sm font-semibold">Despesas</h2>
          <ul>
            {finance.expenses.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground">Nenhuma despesa.</li>
            ) : (
              finance.expenses.map((item) => (
                <li key={item.id} className="flex justify-between border-b px-4 py-2 text-sm last:border-0">
                  <span>
                    {item.category}
                    <span className="block text-xs text-muted-foreground">{item.description}</span>
                  </span>
                  <span>{formatBRL(item.amountCents)}</span>
                </li>
              ))
            )}
          </ul>
        </section>
        <section className="rounded-xl border bg-card">
          <h2 className="border-b px-4 py-3 text-sm font-semibold">Receitas extras</h2>
          <ul>
            {finance.revenues.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground">Nenhuma receita extra.</li>
            ) : (
              finance.revenues.map((item) => (
                <li key={item.id} className="flex justify-between border-b px-4 py-2 text-sm last:border-0">
                  <span>
                    {item.category}
                    <span className="block text-xs text-muted-foreground">{item.description}</span>
                  </span>
                  <span>{formatBRL(item.amountCents)}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
