import type { AppState, Employee, ShiftLog } from "./types";

export type LaborLine = {
  employee: Employee;
  hours: number;
  cost: number;
};

export function getLaborForDate(
  state: AppState,
  date: string,
): { lines: LaborLine[]; totalHours: number; totalCost: number } {
  const logs = state.shiftLogs.filter((l) => l.date === date);
  const byEmployee = new Map<string, number>();

  for (const log of logs) {
    byEmployee.set(log.employeeId, (byEmployee.get(log.employeeId) ?? 0) + log.hours);
  }

  const lines: LaborLine[] = [];
  let totalHours = 0;
  let totalCost = 0;

  for (const [employeeId, hours] of byEmployee) {
    const employee = state.employees.find((e) => e.id === employeeId);
    if (!employee) continue;
    const cost = hours * employee.hourlyRate;
    lines.push({ employee, hours, cost });
    totalHours += hours;
    totalCost += cost;
  }

  lines.sort((a, b) => a.employee.name.localeCompare(b.employee.name));
  return { lines, totalHours, totalCost };
}

export function getLaborForRange(
  state: AppState,
  startDate: string,
  endDate: string,
): { date: string; hours: number; cost: number }[] {
  const result: { date: string; hours: number; cost: number }[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    const { totalHours, totalCost } = getLaborForDate(state, key);
    result.push({ date: key, hours: totalHours, cost: totalCost });
  }

  return result;
}

export function createShiftLog(
  date: string,
  employeeId: string,
  hours: number,
  notes?: string,
): ShiftLog {
  return {
    id: crypto.randomUUID(),
    date,
    employeeId,
    hours,
    notes,
  };
}
