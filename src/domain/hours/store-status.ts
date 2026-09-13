export type BusinessHour = {
  weekday: number;
  opensAt: string;
  closesAt: string;
  closed: boolean;
};

export type StoreStatus = {
  open: boolean;
  label: string;
  nextChange?: string;
};

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function parseMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  if (hours === undefined || minutes === undefined || Number.isNaN(hours) || Number.isNaN(minutes)) {
    throw new Error(`Horário inválido: ${value}`);
  }
  return hours * 60 + minutes;
}

export function getStoreStatus(hours: BusinessHour[], now: Date, timeZone = "America/Sao_Paulo"): StoreStatus {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const weekdayLabel = parts.find((part) => part.type === "weekday")?.value ?? "Sun";
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  const todayIndex = WEEKDAY_INDEX[weekdayLabel] ?? 0;
  const today = hours.find((item) => item.weekday === todayIndex);

  if (!today || today.closed) {
    return { open: false, label: "Fechado agora" };
  }

  if (isAroundTheClock(today)) {
    return { open: true, label: "Aberto agora", nextChange: "24 horas" };
  }

  const current = parseMinutes(`${hour}:${minute}`);
  const opens = parseMinutes(today.opensAt);
  const closes = parseMinutes(today.closesAt);
  const open = current >= opens && current < closes;

  return {
    open,
    label: open ? "Aberto agora" : "Fechado agora",
    nextChange: open ? `fecha às ${today.closesAt}` : `abre às ${today.opensAt}`,
  };
}

export function isAroundTheClock(hour: BusinessHour) {
  return !hour.closed && hour.opensAt === "00:00" && (hour.closesAt === "23:59" || hour.closesAt === "24:00");
}
