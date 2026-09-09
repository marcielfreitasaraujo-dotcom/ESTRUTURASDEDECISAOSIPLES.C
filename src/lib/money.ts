export type Cents = number;

export function assertCents(value: number, label = "valor"): Cents {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} deve ser um inteiro em centavos.`);
  }
  if (value < 0) {
    throw new Error(`${label} não pode ser negativo.`);
  }
  return value;
}

export function addCents(...values: Cents[]): Cents {
  return values.reduce((sum, value) => sum + assertCents(value), 0);
}

export function percentOf(amount: Cents, percent: number): Cents {
  if (percent < 0) throw new Error("Percentual não pode ser negativo.");
  return Math.round((assertCents(amount) * percent) / 100);
}

export function formatBRL(cents: Cents): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(assertCents(cents) / 100);
}

export function parseBRLToCents(input: string): Cents {
  const normalized = input.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Valor monetário inválido.");
  }
  return Math.round(value * 100);
}
