export type CashPeriodPreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "month"
  | "prevMonth"
  | "custom"
  | "all";

export function cashPeriodRange(
  preset: CashPeriodPreset | string | undefined,
  from?: string | Date | null,
  to?: string | Date | null,
  now = new Date(),
): { gte?: Date; lte?: Date } | undefined {
  const startOfDay = (date: Date) => {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };
  const endOfDay = (date: Date) => {
    const copy = new Date(date);
    copy.setHours(23, 59, 59, 999);
    return copy;
  };

  if (preset === "all" || !preset) return undefined;
  if (preset === "custom") {
    if (!from && !to) return undefined;
    return {
      ...(from ? { gte: startOfDay(typeof from === "string" ? new Date(from) : from) } : {}),
      ...(to ? { lte: endOfDay(typeof to === "string" ? new Date(to) : to) } : {}),
    };
  }

  const today = startOfDay(now);
  if (preset === "today") return { gte: today, lte: endOfDay(now) };
  if (preset === "yesterday") {
    const day = new Date(today);
    day.setDate(day.getDate() - 1);
    return { gte: day, lte: endOfDay(day) };
  }
  if (preset === "last7") {
    const day = new Date(today);
    day.setDate(day.getDate() - 6);
    return { gte: day, lte: endOfDay(now) };
  }
  if (preset === "last30") {
    const day = new Date(today);
    day.setDate(day.getDate() - 29);
    return { gte: day, lte: endOfDay(now) };
  }
  if (preset === "month") {
    return { gte: new Date(today.getFullYear(), today.getMonth(), 1), lte: endOfDay(now) };
  }
  if (preset === "prevMonth") {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    return { gte: start, lte: endOfDay(end) };
  }
  return undefined;
}
