import type { SalonTableStatus } from "@prisma/client";

export const TABLE_STATUS_LABEL: Record<SalonTableStatus, string> = {
  FREE: "Livre",
  OCCUPIED: "Ocupada",
  RESERVED: "Reservada",
  BLOCKED: "Indisponível",
};

export type FloorQuickAction =
  | "open"
  | "view"
  | "add"
  | "rename"
  | "transfer"
  | "join"
  | "split"
  | "reserve"
  | "block"
  | "close"
  | "vacate"
  | "occupy-reservation"
  | "edit-reservation"
  | "cancel-reservation"
  | "unblock";

export function actionsForTableStatus(status: SalonTableStatus): FloorQuickAction[] {
  switch (status) {
    case "FREE":
      return ["open", "reserve", "block"];
    case "OCCUPIED":
      return ["view", "add", "rename", "transfer", "join", "split", "close", "vacate"];
    case "RESERVED":
      return ["occupy-reservation", "edit-reservation", "cancel-reservation"];
    case "BLOCKED":
      return ["unblock"];
    default:
      return [];
  }
}

export function summarizeFloorStatus(statuses: SalonTableStatus[]) {
  return {
    total: statuses.length,
    free: statuses.filter((status) => status === "FREE").length,
    occupied: statuses.filter((status) => status === "OCCUPIED").length,
    reserved: statuses.filter((status) => status === "RESERVED").length,
    blocked: statuses.filter((status) => status === "BLOCKED").length,
  };
}
