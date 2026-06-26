import { NextResponse } from "next/server";
import { canManage, requireSessionUser } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { employeePinSchema } from "@/lib/validations";
import { jsonError, parseJson, zodError } from "@/lib/server/api";
import { setEmployeePin } from "@/lib/firestore/repository";
import { writeAuditLog } from "@/lib/server/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSessionUser();
    if (!canManage(user)) return jsonError("Forbidden", 403);

    const { id } = await params;
    const body = await parseJson<unknown>(request);
    const parsed = employeePinSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    const pinHash = await hashPassword(parsed.data.pin);
    const ok = await setEmployeePin(user.shopId, id, pinHash);
    if (!ok) return jsonError("Employee not found", 404);

    await writeAuditLog({
      shopId: user.shopId,
      userId: user.id,
      action: "employee.set_pin",
      entityType: "Employee",
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonError("Failed to set PIN", 500);
  }
}
