import type { AppState } from "./types";
import { toDateKey, parseDateKey } from "./dates";
import { getRosterLaborForDate } from "./roster";

export type LaborLine = {
  employee: AppState["employees"][0];
  hours: number;
  cost: number;
  rate: number;
  shiftLabel?: string;
};

/** Labour cost is derived from the published roster schedule (synced with roster edits). */
export function getLaborForDate(
  state: AppState,
  date: string,
): { lines: LaborLine[]; totalHours: number; totalCost: number } {
  const { lines, totalHours, totalCost } = getRosterLaborForDate(state, date);
  return {
    lines: lines.map((l) => ({
      employee: l.employee,
      hours: l.hours,
      cost: l.cost,
      rate: l.rate,
      shiftLabel: l.shiftLabel,
    })),
    totalHours,
    totalCost,
  };
}

export function getLaborForRange(
  state: AppState,
  startDate: string,
  endDate: string,
): { date: string; hours: number; cost: number }[] {
  const result: { date: string; hours: number; cost: number }[] = [];
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = toDateKey(d);
    const { totalHours, totalCost } = getLaborForDate(state, key);
    result.push({ date: key, hours: totalHours, cost: totalCost });
  }

  return result;
}
