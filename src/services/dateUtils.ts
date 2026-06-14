const SPANISH_DATE = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/**
 * Devuelve una fecha local en formato ISO yyyy-MM-dd.
 */
export function toApiDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayApiDate() {
  return toApiDate(new Date());
}

export function parseApiDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatApiDate(value?: string | null) {
  if (!value) return "Sin fecha";
  return SPANISH_DATE.format(parseApiDate(value));
}

export function formatDateTime(value?: string | null) {
  if (!value) return "Sin fecha";
  const normalized = value.replace(/\.(\d{3})\d+(Z|[+-]\d\d:\d\d)$/, ".$1$2");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}
