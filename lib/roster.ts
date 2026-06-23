import type { AppState, DayKey, RosterSlot, RosterWeek } from "./types";
import { DAYS, DEFAULT_SHIFT, ROSTER_SLOTS_PER_DAY } from "./constants";
import { shiftHours } from "./dates";

const DAY_KEYS = DAYS.map((d) => d.key);

export function createEmptyDaySlots(): RosterSlot[] {
  return Array.from({ length: ROSTER_SLOTS_PER_DAY }, (_, slotIndex) => ({
    slotIndex,
    employeeId: null,
    start: DEFAULT_SHIFT.start,
    end: DEFAULT_SHIFT.end,
  }));
}

export function createEmptyWeekSlots(): Record<DayKey, RosterSlot[]> {
  return DAY_KEYS.reduce(
    (acc, day) => {
      acc[day] = createEmptyDaySlots();
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
  return { weekStart, published: false, slots: createEmptyWeekSlots() };
}

export function rosterStats(week: RosterWeek, employees: AppState["employees"]) {
  let shifts = 0;
  let hours = 0;
  let cost = 0;

  for (const day of DAY_KEYS) {
    for (const slot of week.slots[day]) {
      if (!isSlotFilled(slot)) continue;
      const emp = employees.find((e) => e.id === slot.employeeId);
      if (!emp) continue;
      shifts += 1;
      const h = shiftHours(slot.start, slot.end);
      hours += h;
      cost += h * emp.hourlyRate;
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
      lines.push(`  ${emp.name} (${emp.role}) · ${slot.start}–${slot.end}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}
