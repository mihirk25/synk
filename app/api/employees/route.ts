import { NextResponse } from "next/server";
import { canManage, requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { employeeSchema } from "@/lib/validations";
import { mapEmployee } from "@/lib/server/app-state";
import { parseAvailability, serializeAvailability } from "@/lib/availability";
import { jsonError, parseJson, zodError } from "@/lib/server/api";
import { writeAuditLog } from "@/lib/server/audit";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    if (!canManage(user)) return jsonError("Forbidden", 403);

    const body = await parseJson<unknown>(request);
    const parsed = employeeSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    const { name, hourlyRate, saturdayRate, sundayRate, publicHolidayRate, availability } =
      parsed.data;

    const employee = await prisma.employee.create({
      data: {
        shopId: user.shopId,
        name,
        role: "Staff",
        hourlyRate,
        saturdayRate,
        sundayRate,
        publicHolidayRate,
        availableDays: serializeAvailability(availability),
      },
    });

    await writeAuditLog({
      shopId: user.shopId,
      userId: user.id,
      action: "employee.create",
      entityType: "Employee",
      entityId: employee.id,
      metadata: { name },
    });

    return NextResponse.json({ employee: mapEmployee(employee) });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonError("Failed to create employee", 500);
  }
}
