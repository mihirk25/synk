import { NextResponse } from "next/server";
import { canManage, requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { shiftLogSchema } from "@/lib/validations";
import { jsonError, parseJson, zodError } from "@/lib/server/api";
import { writeAuditLog } from "@/lib/server/audit";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    if (!canManage(user)) return jsonError("Forbidden", 403);

    const body = await parseJson<unknown>(request);
    const parsed = shiftLogSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    const { date, employeeId, hours, notes } = parsed.data;

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, shopId: user.shopId, active: true },
    });
    if (!employee) return jsonError("Employee not found", 404);

    const log = await prisma.shiftLog.create({
      data: {
        shopId: user.shopId,
        employeeId,
        date,
        hours,
        notes,
      },
    });

    await writeAuditLog({
      shopId: user.shopId,
      userId: user.id,
      action: "shift_log.create",
      entityType: "ShiftLog",
      entityId: log.id,
      metadata: { date, employeeId, hours },
    });

    return NextResponse.json({
      log: {
        id: log.id,
        date: log.date,
        employeeId: log.employeeId,
        hours: log.hours,
        notes: log.notes ?? undefined,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonError("Failed to create shift log", 500);
  }
}
