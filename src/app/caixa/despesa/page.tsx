import { requireOpenCashPage } from "@/server/cash-page";
import { prisma } from "@/lib/db";
import { CashMovementForm } from "@/components/cashier/movement-form";

export default async function DespesaPage() {
  const ctx = await requireOpenCashPage();
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: ctx.tenantId },
    select: { cashierCanRegisterExpense: true },
  });
  const isManager = ctx.tenantRole === "OWNER" || ctx.tenantRole === "MANAGER";
  if (!tenant.cashierCanRegisterExpense && !isManager) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-amber-500/30 bg-card p-6">
        <h1 className="font-heading text-2xl">Despesa</h1>
        <p className="mt-2 text-sm text-amber-200">Você não possui permissão para registrar despesas.</p>
        <p className="mt-2 text-sm text-zinc-400">Peça ao gerente para autorizar esta operação nas configurações da loja.</p>
      </div>
    );
  }
  return (
    <CashMovementForm
      type="EXPENSE"
      title="Despesa operacional"
      description="Registra uma saída pequena do caixa, como compra emergencial de gelo."
    />
  );
}
