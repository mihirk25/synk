import type { AppState } from "./types";
import { dateKeyForDay, getWeekEnd, parseDateKey } from "./dates";
import { DAYS } from "./constants";
import { getLaborForDate } from "./laborCost";
import { getEODForDate, netSales } from "./eodStats";

export type WeeklyTrendPoint = {
  date: string;
  label: string;
  sales: number | null;
  labor: number;
};

export function getWeeklySalesLaborTrend(
  state: AppState,
  weekStart: string,
): WeeklyTrendPoint[] {
  const weekEnd = getWeekEnd(weekStart);
  const end = parseDateKey(weekEnd);

  return DAYS.map((day) => {
    const date = dateKeyForDay(weekStart, day.key);
    if (parseDateKey(date) > end) {
      return { date, label: day.label, sales: null, labor: 0 };
    }

    const labor = getLaborForDate(state, date);
    const eod = getEODForDate(state, date);
    const sales = eod ? netSales(eod) : null;

    return {
      date,
      label: day.label,
      sales,
      labor: labor.totalCost,
    };
  });
}
