export const OCCUPANCY_WARN_MINUTES = 60;
export const OCCUPANCY_ALERT_MINUTES = 90;

export type OccupancyAlert = "none" | "warn" | "alert";

export function occupancyMinutes(openedAt: Date | string, now = new Date()): number {
  const start = typeof openedAt === "string" ? new Date(openedAt) : openedAt;
  if (Number.isNaN(start.getTime())) return 0;
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 60_000));
}

export function formatOccupancyDuration(openedAt: Date | string, now = new Date()): string {
  const minutes = occupancyMinutes(openedAt, now);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours}h${String(rest).padStart(2, "0")}min`;
}

export function occupancyAlertLevel(openedAt: Date | string | null | undefined, now = new Date()): OccupancyAlert {
  if (!openedAt) return "none";
  const minutes = occupancyMinutes(openedAt, now);
  if (minutes >= OCCUPANCY_ALERT_MINUTES) return "alert";
  if (minutes >= OCCUPANCY_WARN_MINUTES) return "warn";
  return "none";
}
