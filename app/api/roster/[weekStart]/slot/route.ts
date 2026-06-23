import { NextResponse } from "next/server";
import { canManage, requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { rosterSlotSchema } from "@/lib/validations";
import { ensureRosterWeekInDb } from "@/lib/server/app-state";
import { jsonError, parseJson, zodError } from "@/lib/server/api";
import { writeAuditLog } from "@/lib/server/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ weekStart: string }> },
) {
  try {
    const user = await requireSessionUser();
    if (!canManage(user)) return jsonError("Forbidden", 403);

    const { weekStart } = await params;
    const body = await parseJson<unknown>(request);
    const parsed = rosterSlotSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    const { day, slotIndex, employeeId, start, end } = parsed.data;

    if (employeeId) {
      const employee = await prisma.employee.findFirst({
        where: { id: employeeId, shopId: user.shopId, active: true },
      });
      if (!employee) return jsonError("Employee not found", 404);
    }

    await ensureRosterWeekInDb(user.shopId, weekStart);

    const rosterWeek = await prisma.rosterWeek.findUniqueOrThrow({
      where: { shopId_weekStart: { shopId: user.shopId, weekStart } },
    });

    await prisma.rosterSlot.upsert({
      where: {
        rosterWeekId_day_slotIndex: {
          rosterWeekId: rosterWeek.id,
          day,
          slotIndex,
        },
      },
      create: {
        rosterWeekId: rosterWeek.id,
        day,
        slotIndex,
        employeeId,
        start,
        end,
      },
      update: {
        employeeId,
        start,
        end,
      },
    });

    if (rosterWeek.published) {
      await prisma.rosterWeek.update({
        where: { id: rosterWeek.id },
        data: { published: false, publishedAt: null },
      });
    }

    await writeAuditLog({
      shopId: user.shopId,
      userId: user.id,
      action: "roster.slot.update",
      entityType: "RosterWeek",
      entityId: rosterWeek.id,
      metadata: { weekStart, day, slotIndex, employeeId },
    });

    const roster = await ensureRosterWeekInDb(user.shopId, weekStart);
    return NextResponse.json({ roster });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonError("Failed to update roster", 500);
  }
}
