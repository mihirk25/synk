import { NextResponse } from "next/server";
import { canManage, requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { DAYS, MAX_ROSTER_SLOTS_PER_DAY } from "@/lib/constants";
import { ensureRosterWeekInDb } from "@/lib/server/app-state";
import { jsonError } from "@/lib/server/api";
import { writeAuditLog } from "@/lib/server/audit";

const DAY_KEYS = DAYS.map((d) => d.key);

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ weekStart: string }> },
) {
  try {
    const user = await requireSessionUser();
    if (!canManage(user)) return jsonError("Forbidden", 403);

    const { weekStart } = await params;
    await ensureRosterWeekInDb(user.shopId, weekStart);

    const rosterWeek = await prisma.rosterWeek.findUniqueOrThrow({
      where: { shopId_weekStart: { shopId: user.shopId, weekStart } },
    });

    if (rosterWeek.slotsPerDay >= MAX_ROSTER_SLOTS_PER_DAY) {
      return jsonError(`Maximum ${MAX_ROSTER_SLOTS_PER_DAY} slots per day`, 400);
    }

    const newIndex = rosterWeek.slotsPerDay;

    await prisma.$transaction([
      prisma.rosterWeek.update({
        where: { id: rosterWeek.id },
        data: {
          slotsPerDay: newIndex + 1,
          published: false,
          publishedAt: null,
        },
      }),
      prisma.rosterSlot.createMany({
        data: DAY_KEYS.map((day) => ({
          rosterWeekId: rosterWeek.id,
          day,
          slotIndex: newIndex,
          employeeId: null,
        })),
      }),
    ]);

    await writeAuditLog({
      shopId: user.shopId,
      userId: user.id,
      action: "roster.slot.add",
      entityType: "RosterWeek",
      entityId: rosterWeek.id,
      metadata: { weekStart, slotIndex: newIndex },
    });

    const roster = await ensureRosterWeekInDb(user.shopId, weekStart);
    return NextResponse.json({ roster });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonError("Failed to add slot", 500);
  }
}
