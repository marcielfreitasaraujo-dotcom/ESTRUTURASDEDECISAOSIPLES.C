import { requireOpenCashPage } from "@/server/cash-page";
import { CashMovementForm } from "@/components/cashier/movement-form";

export default async function SangriaPage() {
  await requireOpenCashPage();
  return (
    <CashMovementForm
      type="SANGRIA"
      title="Sangria"
      description="Retire dinheiro do caixa e registre o motivo. O saldo esperado é atualizado na hora."
    />
  );
}