import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { canManage, requireSessionUser } from "@/lib/auth/session";
import { employeeSchema } from "@/lib/validations";
import { mapEmployee } from "@/lib/server/app-state";
import { serializeAvailability } from "@/lib/availability";
import { jsonError, parseJson, zodError } from "@/lib/server/api";
import { writeAuditLog } from "@/lib/server/audit";
import { createEmployee } from "@/lib/firestore/repository";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    if (!canManage(user)) return jsonError("Forbidden", 403);

    const body = await parseJson<unknown>(request);
    const parsed = employeeSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    const { name, hourlyRate, saturdayRate, sundayRate, publicHolidayRate, availability, pin } =
      parsed.data;

    const pinHash = pin ? await hashPassword(pin) : null;

    const employee = await createEmployee(user.shopId, {
      name,
      hourlyRate,
      saturdayRate,
      sundayRate,
      publicHolidayRate,
      availableDays: serializeAvailability(availability),
      pinHash,
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
