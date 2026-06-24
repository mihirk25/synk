import type { AppState } from "./types";
import { getMondayOfWeek, todayKey } from "./dates";
import { createEmptyWeekSlots } from "./roster";
import { ALL_AVAILABILITY_KEYS, availabilityKey } from "./availability";
import { ROSTER_SLOTS_PER_DAY } from "./constants";
import { EMPTY_DENOM_COUNTS } from "./eodClosing";

const allBands = ALL_AVAILABILITY_KEYS;

const weekdays = ["mon", "tue", "wed", "thu", "fri"] as const;
const weekdayBands = weekdays.flatMap((d) =>
  (["morning", "afternoon", "evening"] as const).map((b) => availabilityKey(d, b)),
);
const monSatBands = [...weekdayBands, ...(["sat"] as const).flatMap((d) =>
  (["morning", "afternoon", "evening"] as const).map((b) => availabilityKey(d, b)),
)];
const wedSunBands = (["wed", "thu", "fri", "sat", "sun"] as const).flatMap((d) =>
  (["morning", "afternoon", "evening"] as const).map((b) => availabilityKey(d, b)),
);

export function createSeedState(): AppState {
  const today = todayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  return {
    employees: [
      {
        id: "emp-priya",
        name: "Priya",
        role: "Shift Lead",
        hourlyRate: 28,
        saturdayRate: 32,
        sundayRate: 34,
        publicHolidayRate: 42,
        availability: allBands,
      },
      {
        id: "emp-jake",
        name: "Jake",
        role: "Scooper",
        hourlyRate: 22,
        saturdayRate: 26,
        availability: monSatBands,
      },
      {
        id: "emp-chloe",
        name: "Chloe",
        role: "Cashier",
        hourlyRate: 23,
        availability: allBands,
      },
      {
        id: "emp-ravi",
        name: "Ravi",
        role: "Scooper",
        hourlyRate: 21,
        availability: wedSunBands,
      },
      {
        id: "emp-mia",
        name: "Mia",
        role: "Cashier",
        hourlyRate: 21.5,
        availability: weekdayBands,
      },
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
        grossSales: 635.69,
        cardSales: 562.89,
        cashSales: 72.8,
        refunds: 0,
        transactionCount: 0,
        tillCash: 152.75,
        expensesAmount: 0,
        expenseNotes: "",
        urgentStock: "",
        staffSignature: "Demo Staff",
        floatTarget: 1100,
        denomCounts: { ...EMPTY_DENOM_COUNTS },
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
        slotsPerDay: ROSTER_SLOTS_PER_DAY,
        slots: createEmptyWeekSlots(ROSTER_SLOTS_PER_DAY),
      },
    ],
  };
}
