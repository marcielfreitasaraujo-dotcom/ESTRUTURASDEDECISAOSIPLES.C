import { CashierPosFloor } from "@/components/cashier/pos-floor";
import { requireOpenCashPage } from "@/server/cash-page";

export default async function CaixaPdvPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireOpenCashPage();
  const { error, ok } = await searchParams;
  return <CashierPosFloor error={error} ok={ok} />;
}