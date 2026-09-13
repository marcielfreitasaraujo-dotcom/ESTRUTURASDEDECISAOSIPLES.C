export const CASH_MOVEMENT_LABELS: Record<string, string> = {
  OPENING: "Abertura",
  SALE: "Venda",
  PAYMENT: "Pagamento",
  CHANGE: "Troco",
  SANGRIA: "Sangria",
  SUPPLY: "Suprimento",
  EXPENSE: "Despesa",
  REFUND: "Estorno",
  ADJUSTMENT: "Ajuste",
  CLOSING: "Fechamento",
};

export const SANGRIA_REASONS = [
  { value: "deposit", label: "Retirada para depósito bancário" },
  { value: "excess", label: "Excesso de dinheiro" },
  { value: "expense", label: "Pagamento de despesa" },
  { value: "admin", label: "Retirada administrativa" },
  { value: "other", label: "Outro" },
] as const;

export const SUPPLY_REASONS = [
  { value: "change", label: "Reposição de troco" },
  { value: "opening", label: "Reforço de fundo" },
  { value: "other", label: "Outro" },
] as const;

export const EXPENSE_CATEGORIES = [
  { value: "emergency", label: "Compra emergencial" },
  { value: "material", label: "Material" },
  { value: "transport", label: "Transporte" },
  { value: "food", label: "Alimentação" },
  { value: "maintenance", label: "Manutenção" },
  { value: "other", label: "Outros" },
] as const;

export const PAYMENT_METHOD_LABELS_CASH: Record<string, string> = {
  CASH: "Dinheiro",
  PIX: "PIX",
  CARD: "Cartão",
  DEBIT: "Débito",
  CREDIT: "Crédito",
  OTHER: "Outros",
  ONLINE: "Online",
};

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
