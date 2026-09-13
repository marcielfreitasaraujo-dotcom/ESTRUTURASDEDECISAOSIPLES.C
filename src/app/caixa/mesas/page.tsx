import { CashierPosFloor } from "@/components/cashier/pos-floor";
import { requireOpenCashPage } from "@/server/cash-page";

export default async function CaixaMesasPage() {
  await requireOpenCashPage();
  return <CashierPosFloor />;
}