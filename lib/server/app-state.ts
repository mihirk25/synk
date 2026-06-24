import type { DayKey, RosterWeek, AppState } from "@/lib/types";
import { DAYS, ROSTER_SLOTS_PER_DAY } from "@/lib/constants";
import { parseDenomCounts } from "@/lib/eodClosing";
import { createEmptyDaySlots } from "@/lib/roster";
import { parseAvailability } from "@/lib/availability";
import { prisma } from "@/lib/db";

const DAY_KEYS = DAYS.map((d) => d.key);

function mapEmployee(e: {
  id: string;
  name: string;
  role: string;
  hourlyRate: number;
  saturdayRate: number | null;
  sundayRate: number | null;
  publicHolidayRate: number | null;
  availableDays: string;
}) {
  return {
    id: e.id,
    name: e.name,
    role: e.role,
    hourlyRate: e.hourlyRate,
    saturdayRate: e.saturdayRate ?? undefined,
    sundayRate: e.sundayRate ?? undefined,
    publicHolidayRate: e.publicHolidayRate ?? undefined,
    availability: parseAvailability(e.availableDays),
  };
}

export async function fetchAppState(shopId: string): Promise<AppState> {
  const [employees, shiftLogs, eodReports, cashCounts, rosterWeeks] = await Promise.all([
    prisma.employee.findMany({
      where: { shopId, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.shiftLog.findMany({ where: { shopId }, orderBy: { date: "desc" } }),
    prisma.eodReport.findMany({ where: { shopId }, orderBy: { date: "desc" } }),
    prisma.cashCount.findMany({ where: { shopId }, orderBy: { date: "desc" } }),
    prisma.rosterWeek.findMany({
      where: { shopId },
      include: { slots: true },
      orderBy: { weekStart: "desc" },
    }),
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
      refunds: r.refunds,
      transactionCount: r.transactionCount,
      notes: r.notes ?? undefined,
      tillCash: r.tillCash,
      expensesAmount: r.expensesAmount,
      expenseNotes: r.expenseNotes ?? undefined,
      urgentStock: r.urgentStock ?? undefined,
      staffSignature: r.staffSignature ?? undefined,
      floatTarget: r.floatTarget,
      denomCounts: parseDenomCounts(r.denomCounts),
    })),
    cashCounts: cashCounts.map((c) => ({
      id: c.id,
      date: c.date,
      openingFloat: c.openingFloat,
      countedCash: c.countedCash,
      notes: c.notes ?? undefined,
    })),
    rosterWeeks: rosterWeeks.map((week) => rosterWeekFromDb(week)),
  };
}

function rosterWeekFromDb(week: {
  weekStart: string;
  published: boolean;
  publishedAt: Date | null;
  slotsPerDay: number;
  slots: Array<{
    day: DayKey;
    slotIndex: number;
    employeeId: string | null;
    start: string;
    end: string;
  }>;
}): RosterWeek {
  const slotsPerDay = week.slotsPerDay || ROSTER_SLOTS_PER_DAY;
  const maxIndex = week.slots.reduce((m, s) => Math.max(m, s.slotIndex), slotsPerDay - 1);
  const count = Math.max(slotsPerDay, maxIndex + 1);

  const slots = DAY_KEYS.reduce(
    (acc, day) => {
      acc[day] = createEmptyDaySlots(count);
      return acc;
    },
    {} as RosterWeek["slots"],
  );

  for (const slot of week.slots) {
    if (slot.slotIndex < 0 || slot.slotIndex >= count) continue;
    slots[slot.day][slot.slotIndex] = {
      slotIndex: slot.slotIndex,
      employeeId: slot.employeeId,
      start: slot.start,
      end: slot.end,
    };
  }

  return {
    weekStart: week.weekStart,
    published: week.published,
    publishedAt: week.publishedAt?.toISOString(),
    slotsPerDay: count,
    slots,
  };
}

export async function ensureRosterWeekInDb(shopId: string, weekStart: string) {
  let week = await prisma.rosterWeek.findUnique({
    where: { shopId_weekStart: { shopId, weekStart } },
    include: { slots: true },
  });

  if (!week) {
    week = await prisma.rosterWeek.create({
      data: {
        shopId,
        weekStart,
        slotsPerDay: ROSTER_SLOTS_PER_DAY,
        slots: {
          create: DAY_KEYS.flatMap((day) =>
            Array.from({ length: ROSTER_SLOTS_PER_DAY }, (_, slotIndex) => ({
              day,
              slotIndex,
              employeeId: null,
            })),
          ),
        },
      },
      include: { slots: true },
    });
  }

  return rosterWeekFromDb(week);
}

export { mapEmployee };
