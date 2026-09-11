import { requireOpenCashPage } from "@/server/cash-page";
import { CashMovementForm } from "@/components/cashier/movement-form";

export default async function SuprimentoPage() {
  await requireOpenCashPage();
  return (
    <CashMovementForm
      type="SUPPLY"
      title="Suprimento"
      description="Registre dinheiro colocado no caixa. O saldo esperado sobe na hora."
    />
  );
}