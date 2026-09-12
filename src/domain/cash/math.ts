import { assertCents, type Cents } from "@/lib/money";
import { AppError } from "@/lib/errors";

export type CashTenderInput = {
  method: "CASH" | "PIX" | "CARD" | "OTHER";
  amountCents: Cents;
  receivedCents?: Cents;
  cardKind?: "DEBIT" | "CREDIT";
  installments?: number;
  brand?: string;
  notes?: string;
  confirmPix?: boolean;
};

export function changeCents(totalCents: Cents, receivedCents: Cents): Cents {
  const total = assertCents(totalCents, "total");
  const received = assertCents(receivedCents, "valor recebido");
  if (received < total) {
    throw new AppError("INSUFFICIENT_CASH", "Valor recebido inferior ao total. Não é possível finalizar o pagamento.");
  }
  return received - total;
}

export function assertTendersCoverTotal(tenders: { amountCents: number }[], totalCents: Cents) {
  if (tenders.length === 0) {
    throw new AppError("EMPTY_TENDER", "Informe ao menos uma forma de pagamento.");
  }
  const sum = tenders.reduce((acc, tender) => acc + assertCents(tender.amountCents, "parcela"), 0);
  const total = assertCents(totalCents, "total");
  if (sum !== total) {
    throw new AppError(
      "TENDER_MISMATCH",
      `A soma das formas de pagamento precisa fechar o total. Restante: ${formatSigned(total - sum)}.`,
    );
  }
}

export function remainingCents(totalCents: Cents, allocatedCents: Cents): number {
  return assertCents(totalCents, "total") - assertCents(allocatedCents, "alocado");
}

export function splitEqually(totalCents: Cents, people: number): Cents[] {
  const total = assertCents(totalCents, "total");
  if (!Number.isInteger(people) || people < 2) {
    throw new AppError("INVALID_SPLIT", "Informe pelo menos 2 pessoas para dividir a conta.");
  }
  const base = Math.floor(total / people);
  const remainder = total - base * people;
  return Array.from({ length: people }, (_, index) => base + (index < remainder ? 1 : 0));
}

export function expectedCashCents(input: {
  openingCents: Cents;
  cashSalesCents: Cents;
  supplyCents: Cents;
  sangriaCents: Cents;
  expenseCents: Cents;
  refundCashCents?: Cents;
  adjustmentCents?: number;
}): Cents {
  const opening = assertCents(input.openingCents, "saldo inicial");
  const sales = assertCents(input.cashSalesCents, "vendas em dinheiro");
  const supply = assertCents(input.supplyCents, "suprimentos");
  const sangria = assertCents(input.sangriaCents, "sangrias");
  const expense = assertCents(input.expenseCents, "despesas");
  const refunds = assertCents(input.refundCashCents ?? 0, "estornos");
  const adjustments = input.adjustmentCents ?? 0;
  if (!Number.isInteger(adjustments)) {
    throw new AppError("INVALID_AMOUNT", "Ajuste inválido.");
  }
  const expected = opening + sales + supply - sangria - expense - refunds + adjustments;
  if (expected < 0) return 0;
  return expected;
}

export function differenceCents(expectedCents: Cents, countedCents: Cents): number {
  return assertCents(countedCents, "dinheiro contado") - assertCents(expectedCents, "dinheiro esperado");
}

export function differenceLabel(difference: number) {
  if (difference === 0) return { kind: "ok" as const, label: "Caixa exato" };
  if (difference < 0) return { kind: "shortage" as const, label: "Falta de caixa" };
  return { kind: "overage" as const, label: "Sobra de caixa" };
}

export function discountWithinLimit(totalCents: Cents, discountCents: Cents, maxPercent: number) {
  const total = assertCents(totalCents, "total");
  const discount = assertCents(discountCents, "desconto");
  if (discount === 0) return true;
  if (maxPercent <= 0) return false;
  const max = Math.round((total * maxPercent) / 100);
  return discount <= max;
}

function formatSigned(cents: number) {
  const value = Math.abs(cents) / 100;
  const formatted = value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return cents < 0 ? `-${formatted}` : formatted;
}
