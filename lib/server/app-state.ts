import type { DayKey, RosterWeek, AppState } from "@/lib/types";
import { DAYS, ROSTER_SLOTS_PER_DAY } from "@/lib/constants";
import { createEmptyDaySlots } from "@/lib/roster";
import { prisma } from "@/lib/db";

const DAY_KEYS = DAYS.map((d) => d.key);

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
    employees: employees.map((e) => ({
      id: e.id,
      name: e.name,
      role: e.role,
      hourlyRate: e.hourlyRate,
    })),
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
  slots: Array<{
    day: DayKey;
    slotIndex: number;
    employeeId: string | null;
    start: string;
    end: string;
  }>;
}): RosterWeek {
  const slots = DAY_KEYS.reduce(
    (acc, day) => {
      acc[day] = createEmptyDaySlots();
      return acc;
    },
    {} as RosterWeek["slots"],
  );

  for (const slot of week.slots) {
    if (slot.slotIndex < 0 || slot.slotIndex >= ROSTER_SLOTS_PER_DAY) continue;
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
