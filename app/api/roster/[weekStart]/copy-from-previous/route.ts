import { NextResponse } from "next/server";
import { canManage, requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { DAYS } from "@/lib/constants";
import type { DayKey } from "@/lib/types";
import { parseDateKey, toDateKey } from "@/lib/dates";
import { ensureRosterWeekInDb } from "@/lib/server/app-state";
import { jsonError, parseJson, zodError } from "@/lib/server/api";
import { writeAuditLog } from "@/lib/server/audit";
import { copyRosterFromPreviousSchema } from "@/lib/validations";

const DAY_KEYS = DAYS.map((d) => d.key);

type SourceSlot = {
  day: DayKey;
  slotIndex: number;
  employeeId: string | null;
  start: string;
  end: string;
};

function slotsFromLocal(
  slotsPerDay: number,
  slots: Record<string, Array<{ slotIndex: number; employeeId: string | null; start: string; end: string }>>,
): { slotsPerDay: number; slots: SourceSlot[] } {
  const flat: SourceSlot[] = [];
  for (const day of DAY_KEYS) {
    const daySlots = slots[day] ?? [];
    for (const slot of daySlots) {
      flat.push({
        day,
        slotIndex: slot.slotIndex,
        employeeId: slot.employeeId,
        start: slot.start,
        end: slot.end,
      });
    }
  }
  return { slotsPerDay, slots: flat };
}

function hasFilledSlots(slots: SourceSlot[]): boolean {
  return slots.some((s) => s.employeeId !== null);
}

async function applyCopy(
  targetId: string,
  slotsPerDay: number,
  sourceSlots: SourceSlot[],
) {
  await prisma.$transaction(async (tx) => {
    await tx.rosterSlot.deleteMany({ where: { rosterWeekId: targetId } });

    await tx.rosterWeek.update({
      where: { id: targetId },
      data: {
        slotsPerDay,
        published: false,
        publishedAt: null,
      },
    });

    if (sourceSlots.length > 0) {
      await tx.rosterSlot.createMany({
        data: sourceSlots.map((slot) => ({
          rosterWeekId: targetId,
          day: slot.day,
          slotIndex: slot.slotIndex,
          employeeId: slot.employeeId,
          start: slot.start,
          end: slot.end,
        })),
      });
    } else {
      await tx.rosterSlot.createMany({
        data: DAY_KEYS.flatMap((day) =>
          Array.from({ length: slotsPerDay }, (_, slotIndex) => ({
            rosterWeekId: targetId,
            day,
            slotIndex,
            employeeId: null,
          })),
        ),
      });
    }
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ weekStart: string }> },
) {
  try {
    const user = await requireSessionUser();
    if (!canManage(user)) return jsonError("Forbidden", 403);

    const { weekStart } = await params;
    const body = await parseJson<unknown>(request).catch(() => ({}));
    const parsed = copyRosterFromPreviousSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    const prevMonday = parseDateKey(weekStart);
    prevMonday.setDate(prevMonday.getDate() - 7);
    const sourceWeekStart = toDateKey(prevMonday);

    let slotsPerDay = 5;
    let sourceSlots: SourceSlot[] = [];

    if (parsed.data.localSource) {
      const local = slotsFromLocal(parsed.data.localSource.slotsPerDay, parsed.data.localSource.slots);
      slotsPerDay = local.slotsPerDay;
      sourceSlots = local.slots;
    } else {
      const source = await prisma.rosterWeek.findUnique({
        where: { shopId_weekStart: { shopId: user.shopId, weekStart: sourceWeekStart } },
        include: { slots: true },
      });

      if (source) {
        slotsPerDay = source.slotsPerDay;
        sourceSlots = source.slots.map((slot) => ({
          day: slot.day,
          slotIndex: slot.slotIndex,
          employeeId: slot.employeeId,
          start: slot.start,
          end: slot.end,
        }));
      }
    }

    if (!hasFilledSlots(sourceSlots)) {
      return NextResponse.json({
        roster: await ensureRosterWeekInDb(user.shopId, weekStart),
        copied: false,
        message: "Last week has no shifts to copy. Schedule shifts first, then try again.",
      });
    }

    await ensureRosterWeekInDb(user.shopId, weekStart);

    const target = await prisma.rosterWeek.findUniqueOrThrow({
      where: { shopId_weekStart: { shopId: user.shopId, weekStart } },
    });

    await applyCopy(target.id, slotsPerDay, sourceSlots);

    await writeAuditLog({
      shopId: user.shopId,
      userId: user.id,
      action: "roster.copy_from_previous",
      entityType: "RosterWeek",
      entityId: target.id,
      metadata: { weekStart, sourceWeekStart },
    });

    const roster = await ensureRosterWeekInDb(user.shopId, weekStart);
    return NextResponse.json({
      roster,
      copied: true,
      message: "Roster copied from last week.",
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonError("Failed to copy roster", 500);
  }
}
