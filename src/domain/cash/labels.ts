export const CASH_MOVEMENT_LABELS: Record<string, string> = {
  OPENING: "Abertura",
  SALE: "Venda",
  CHANGE: "Troco",
  SANGRIA: "Sangria",
  SUPPLY: "Suprimento",
  EXPENSE: "Despesa",
  REFUND: "Estorno",
  ADJUSTMENT: "Ajuste",
};

export const SANGRIA_REASONS = [
  { value: "excess", label: "Excesso de dinheiro" },
  { value: "expense", label: "Pagamento de despesa" },
  { value: "admin", label: "Retirada administrativa" },
  { value: "other", label: "Outro" },
] as const;

export const CASH_TENDER_OPTIONS = [
  { method: "CASH" as const, label: "Dinheiro" },
  { method: "PIX" as const, label: "PIX" },
  { method: "CARD" as const, cardKind: "DEBIT" as const, label: "Cartão de débito" },
  { method: "CARD" as const, cardKind: "CREDIT" as const, label: "Cartão de crédito" },
  { method: "OTHER" as const, label: "Outros" },
];

export function formatClock(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export function formatDay(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}
