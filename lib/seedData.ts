import type { AppState, RosterWeek } from "./types";
import { getMondayOfWeek, todayKey } from "./dates";
import { createEmptyWeekSlots } from "./roster";

export function createSeedState(): AppState {
  const today = todayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  return {
    employees: [
      { id: "emp-priya", name: "Priya", role: "Shift Lead", hourlyRate: 28 },
      { id: "emp-jake", name: "Jake", role: "Scooper", hourlyRate: 22 },
      { id: "emp-chloe", name: "Chloe", role: "Cashier", hourlyRate: 23 },
      { id: "emp-ravi", name: "Ravi", role: "Scooper", hourlyRate: 21 },
      { id: "emp-mia", name: "Mia", role: "Cashier", hourlyRate: 21.5 },
    ],
    shiftLogs: [
      { id: "log-1", date: yesterdayKey, employeeId: "emp-priya", hours: 8 },
      { id: "log-2", date: yesterdayKey, employeeId: "emp-jake", hours: 6 },
      { id: "log-3", date: today, employeeId: "emp-chloe", hours: 4 },
    ],
    eodReports: [
      {
        id: "eod-1",
        date: yesterdayKey,
        grossSales: 1842.5,
        cardSales: 1120,
        cashSales: 742.5,
        refunds: 18,
        transactionCount: 156,
        notes: "Busy Friday evening rush",
      },
    ],
    cashCounts: [
      {
        id: "cash-1",
        date: yesterdayKey,
        openingFloat: 200,
        countedCash: 942.5,
        notes: "Balanced",
      },
    ],
    rosterWeeks: [
      {
        weekStart: getMondayOfWeek(),
        published: false,
        slots: createEmptyWeekSlots(),
      },
    ],
  };
}
