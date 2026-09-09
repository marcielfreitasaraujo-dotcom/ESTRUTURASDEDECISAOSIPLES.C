import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/domain/ordering/status";

const LABELS: Record<OrderStatus, string> = {
  PENDING: "Novo",
  CONFIRMED: "Confirmado",
  PREPARING: "Preparando",
  READY: "Pronto",
  OUT_FOR_DELIVERY: "Saiu",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const variant = status === "CANCELLED" ? "destructive" : status === "DELIVERED" ? "secondary" : "default";
  return <Badge variant={variant}>{LABELS[status]}</Badge>;
}
