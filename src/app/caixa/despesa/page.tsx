import { requireOpenCashPage } from "@/server/cash-page";
import { prisma } from "@/lib/db";
import { CashMovementForm } from "@/components/cashier/movement-form";
import { PageHeader, PageStack } from "@/components/ds/page-header";
import { Surface } from "@/components/ds/surface";

export default async function DespesaPage() {
  const ctx = await requireOpenCashPage();
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: ctx.tenantId },
    select: { cashierCanRegisterExpense: true },
  });
  const isManager = ctx.tenantRole === "OWNER" || ctx.tenantRole === "MANAGER";
  if (!tenant.cashierCanRegisterExpense && !isManager) {
    return (
      <PageStack className="max-w-2xl">
        <PageHeader title="Despesa" description="Saída pequena do caixa, como compra emergencial." />
        <Surface className="border-warning/30 bg-warning/10">
          <p className="text-sm text-warning">Você não possui permissão para registrar despesas.</p>
          <p className="mt-2 text-sm text-muted-foreground">Peça ao gerente para autorizar esta operação nas configurações da loja.</p>
        </Surface>
      </PageStack>
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
