export type CashUiStatus = "open" | "pending" | "conferred" | "difference" | "closed";

export const CASH_UI_STATUS_LABELS: Record<CashUiStatus, string> = {
  open: "Aberto",
  pending: "Aguardando conferência",
  conferred: "Conferido",
  difference: "Com diferença",
  closed: "Fechado",
};

export function cashSessionUiStatus(input: {
  status: "OPEN" | "CLOSED" | string;
  conferenceStatus?: "NONE" | "PENDING" | "CONFERRED" | "DIFFERENCE" | string | null;
  differenceCents?: number | null;
}): { key: CashUiStatus; label: string; tone: "success" | "warning" | "info" | "danger" | "neutral" } {
  if (input.status === "OPEN") {
    return { key: "open", label: "Caixa aberto", tone: "success" };
  }
  if (input.conferenceStatus === "PENDING") {
    return { key: "pending", label: "Aguardando conferência", tone: "warning" };
  }
  if (input.conferenceStatus === "DIFFERENCE" || ((input.differenceCents ?? 0) !== 0 && input.conferenceStatus === "CONFERRED")) {
    return { key: "difference", label: "Com diferença", tone: "danger" };
  }
  if (input.conferenceStatus === "CONFERRED") {
    return { key: "conferred", label: "Conferido", tone: "info" };
  }
  return { key: "closed", label: "Fechado", tone: "neutral" };
}

export function operatorLabel(user?: { displayName?: string | null; name?: string | null } | null) {
  return user?.displayName?.trim() || user?.name?.trim() || "Operador";
}
