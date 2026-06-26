import type { AppState, RosterWeek } from "@/lib/types";
import { parseDenomCounts } from "@/lib/eodClosing";
import { parseAvailability } from "@/lib/availability";
import {
  ensureRosterWeekRecord,
  listCashCounts,
  listEodReports,
  listEmployees,
  listRosterWeeks,
  listShiftLogs,
  type EmployeeRecord,
  type RosterWeekRecord,
} from "@/lib/firestore/repository";

export function mapEmployee(e: EmployeeRecord) {
  return {
    id: e.id,
    name: e.name,
    role: e.role,
    hourlyRate: e.hourlyRate,
    saturdayRate: e.saturdayRate ?? undefined,
    sundayRate: e.sundayRate ?? undefined,
    publicHolidayRate: e.publicHolidayRate ?? undefined,
    availability: parseAvailability(e.availableDays),
    hasPin: Boolean(e.pinHash),
  };
}

function rosterWeekFromRecord(week: RosterWeekRecord): RosterWeek {
  return {
    weekStart: week.weekStart,
    published: week.published,
    publishedAt: week.publishedAt?.toISOString(),
    slotsPerDay: week.slotsPerDay,
    slots: week.slots,
  };
}

export async function fetchAppState(shopId: string): Promise<AppState> {
  const [employees, shiftLogs, eodReports, cashCounts, rosterWeeks] = await Promise.all([
    listEmployees(shopId),
    listShiftLogs(shopId),
    listEodReports(shopId),
    listCashCounts(shopId),
    listRosterWeeks(shopId),
  ]);

  return {
    employees: employees.map(mapEmployee),
    shiftLogs: shiftLogs.map((l) => ({
      id: l.id,
      date: l.date,
      employeeId: l.employeeId,
      hours: l.hours,
      notes: l.notes ?? undefined,
    })),
    eodReports: eodReports.map((r) => ({
      id: r.id,
      date: r.date,
      grossSales: r.grossSales,
      cardSales: r.cardSales,
      cashSales: r.cashSales,
      refunds: r.refunds ?? 0,
      transactionCount: r.transactionCount ?? 0,
      notes: r.notes ?? undefined,
      tillCash: r.tillCash ?? 0,
      expensesAmount: r.expensesAmount ?? 0,
      expenseNotes: r.expenseNotes ?? undefined,
      urgentStock: r.urgentStock ?? undefined,
      staffSignature: r.staffSignature ?? undefined,
      floatTarget: r.floatTarget ?? 1100,
      denomCounts: parseDenomCounts(r.denomCounts ?? null),
    })),
    cashCounts: cashCounts.map((c) => ({
      id: c.id,
      date: c.date,
      openingFloat: c.openingFloat,
      countedCash: c.countedCash,
      notes: c.notes ?? undefined,
    })),
    rosterWeeks: rosterWeeks.map(rosterWeekFromRecord),
  };
}

export async function ensureRosterWeekInDb(shopId: string, weekStart: string) {
  const week = await ensureRosterWeekRecord(shopId, weekStart);
  return rosterWeekFromRecord(week);
}

export { rosterWeekFromRecord as rosterWeekFromDb };
