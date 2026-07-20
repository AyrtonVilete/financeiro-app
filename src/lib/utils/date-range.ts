import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
} from "date-fns";

export type Period = "this-month" | "last-month" | "all";

export function getPeriodRange(period: Period, reference: Date = new Date()) {
  if (period === "all") return { from: undefined, to: undefined };

  const base = period === "last-month" ? subMonths(reference, 1) : reference;
  return {
    from: format(startOfMonth(base), "yyyy-MM-dd"),
    to: format(endOfMonth(base), "yyyy-MM-dd"),
  };
}

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
