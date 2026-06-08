import { format, startOfWeek, subDays, parseISO } from "date-fns";
import type { Expense } from "@/types/database";
import { roundOMR } from "@/lib/format-omr";

export function buildDailyChart(expenses: Expense[], days = 7) {
  const map = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = format(subDays(new Date(), i), "yyyy-MM-dd");
    map.set(d, 0);
  }
  expenses.forEach((e) => {
    if (map.has(e.purchase_date)) {
      map.set(e.purchase_date, roundOMR((map.get(e.purchase_date) ?? 0) + Number(e.amount)));
    }
  });
  return Array.from(map.entries()).map(([date, total]) => ({
    label: format(parseISO(date), "dd MMM"),
    total,
  }));
}

export function buildWeeklyChart(expenses: Expense[], weeks = 4) {
  const map = new Map<string, number>();
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subDays(new Date(), i * 7), { weekStartsOn: 1 });
    map.set(format(weekStart, "yyyy-MM-dd"), 0);
  }
  expenses.forEach((e) => {
    const weekKey = format(startOfWeek(parseISO(e.purchase_date), { weekStartsOn: 1 }), "yyyy-MM-dd");
    if (map.has(weekKey)) {
      map.set(weekKey, roundOMR((map.get(weekKey) ?? 0) + Number(e.amount)));
    }
  });
  return Array.from(map.entries()).map(([date, total]) => ({
    label: `Wk ${format(parseISO(date), "dd MMM")}`,
    total,
  }));
}
