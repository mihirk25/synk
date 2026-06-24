import type { AppState, DayKey, RosterSlot, RosterWeek } from "./types";
import { DAYS, DEFAULT_SHIFT, ROSTER_SLOTS_PER_DAY } from "./constants";
import { dateKeyForDay, getMondayOfWeek, shiftHours } from "./dates";
import { hourlyRateForDate } from "./employeePay";

const DAY_KEYS = DAYS.map((d) => d.key);

export type RosterLaborLine = {
  employee: AppState["employees"][0];
  hours: number;
  cost: number;
  rate: number;
  shiftLabel: string;
};

export function weekStartForDate(date: string): string {
  return getMondayOfWeek(new Date(date + "T12:00:00"));
}

export function getRosterForDate(state: AppState, date: string): RosterWeek | undefined {
  const weekStart = weekStartForDate(date);
  return state.rosterWeeks.find((w) => w.weekStart === weekStart);
}

export function getRosterLaborForDate(
  state: AppState,
  date: string,
): { lines: RosterLaborLine[]; totalHours: number; totalCost: number } {
  const week = getRosterForDate(state, date);
  if (!week) {
    return { lines: [], totalHours: 0, totalCost: 0 };
  }

  const dayKey = DAY_KEYS.find((d) => dateKeyForDay(week.weekStart, d) === date);
  if (!dayKey) {
    return { lines: [], totalHours: 0, totalCost: 0 };
  }

  const slots = week.slots[dayKey].filter(isSlotFilled);
  const lines: RosterLaborLine[] = [];
  let totalHours = 0;
  let totalCost = 0;

  for (const slot of slots) {
    const employee = state.employees.find((e) => e.id === slot.employeeId);
    if (!employee) continue;
    const hours = shiftHours(slot.start, slot.end);
    const rate = hourlyRateForDate(employee, date);
    const cost = hours * rate;
    lines.push({
      employee,
      hours,
      cost,
      rate,
      shiftLabel: `${slot.start}–${slot.end}`,
    });
    totalHours += hours;
    totalCost += cost;
  }

  lines.sort((a, b) => a.employee.name.localeCompare(b.employee.name));
  return { lines, totalHours, totalCost };
}

export function getRosterLaborForWeek(
  state: AppState,
  weekStart: string,
): { lines: RosterLaborLine[]; totalHours: number; totalCost: number } {
  const week = state.rosterWeeks.find((w) => w.weekStart === weekStart);
  if (!week) {
    return { lines: [], totalHours: 0, totalCost: 0 };
  }

  const byEmployee = new Map<
    string,
    { employee: AppState["employees"][0]; hours: number; cost: number }
  >();

  for (const day of DAY_KEYS) {
    const date = dateKeyForDay(weekStart, day);
    for (const slot of week.slots[day]) {
      if (!isSlotFilled(slot)) continue;
      const employee = state.employees.find((e) => e.id === slot.employeeId);
      if (!employee) continue;
      const hours = shiftHours(slot.start, slot.end);
      const rate = hourlyRateForDate(employee, date);
      const cost = hours * rate;
      const existing = byEmployee.get(employee.id);
      if (existing) {
        existing.hours += hours;
        existing.cost += cost;
      } else {
        byEmployee.set(employee.id, { employee, hours, cost });
      }
    }
  }

  const lines: RosterLaborLine[] = [...byEmployee.values()].map((row) => ({
    ...row,
    rate: row.employee.hourlyRate,
    shiftLabel: "Week total",
  }));

  lines.sort((a, b) => a.employee.name.localeCompare(b.employee.name));
  const totalHours = lines.reduce((s, l) => s + l.hours, 0);
  const totalCost = lines.reduce((s, l) => s + l.cost, 0);
  return { lines, totalHours, totalCost };
}

export function createEmptyDaySlots(count: number = ROSTER_SLOTS_PER_DAY): RosterSlot[] {
  return Array.from({ length: count }, (_, slotIndex) => ({
    slotIndex,
    employeeId: null,
    start: DEFAULT_SHIFT.start,
    end: DEFAULT_SHIFT.end,
  }));
}

export function createEmptyWeekSlots(slotsPerDay: number = ROSTER_SLOTS_PER_DAY): Record<DayKey, RosterSlot[]> {
  return DAY_KEYS.reduce(
    (acc, day) => {
      acc[day] = createEmptyDaySlots(slotsPerDay);
      return acc;
    },
    {} as Record<DayKey, RosterSlot[]>,
  );
}

export function isSlotFilled(slot: RosterSlot): boolean {
  return slot.employeeId !== null;
}

export function getRosterForWeek(state: AppState, weekStart: string): RosterWeek | undefined {
  return state.rosterWeeks.find((w) => w.weekStart === weekStart);
}

export function ensureRosterWeek(state: AppState, weekStart: string): RosterWeek {
  const existing = getRosterForWeek(state, weekStart);
  if (existing) return existing;
  return {
    weekStart,
    published: false,
    slotsPerDay: ROSTER_SLOTS_PER_DAY,
    slots: createEmptyWeekSlots(ROSTER_SLOTS_PER_DAY),
  };
}

export function rosterStats(week: RosterWeek, employees: AppState["employees"]) {
  let shifts = 0;
  let hours = 0;
  let cost = 0;

  for (const day of DAY_KEYS) {
    const date = dateKeyForDay(week.weekStart, day);
    for (const slot of week.slots[day]) {
      if (!isSlotFilled(slot)) continue;
      const emp = employees.find((e) => e.id === slot.employeeId);
      if (!emp) continue;
      shifts += 1;
      const h = shiftHours(slot.start, slot.end);
      hours += h;
      cost += h * hourlyRateForDate(emp, date);
    }
  }

  return { shifts, hours, cost };
}

export function publishedRosterText(
  week: RosterWeek,
  employees: AppState["employees"],
  weekLabel: string,
): string {
  const lines = [`Weekly Roster — ${weekLabel}`, ""];
  const dayLabels = DAYS.map((d) => d.short);

  for (let i = 0; i < DAYS.length; i++) {
    const day = DAYS[i]!.key;
    const filled = week.slots[day].filter(isSlotFilled);
    if (filled.length === 0) continue;

    lines.push(`${dayLabels[i]}`);
    for (const slot of filled) {
      const emp = employees.find((e) => e.id === slot.employeeId);
      if (!emp) continue;
      lines.push(`  ${emp.name} · ${slot.start}–${slot.end}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}
