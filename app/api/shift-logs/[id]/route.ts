import { NextResponse } from "next/server";
import { canManage, requireSessionUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/server/api";
import { writeAuditLog } from "@/lib/server/audit";
import { deleteShiftLog, findShiftLog } from "@/lib/firestore/repository";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSessionUser();
    if (!canManage(user)) return jsonError("Forbidden", 403);

    const { id } = await params;

    const existing = await findShiftLog(user.shopId, id);
    if (!existing) return jsonError("Shift log not found", 404);

    await deleteShiftLog(id);

    await writeAuditLog({
      shopId: user.shopId,
      userId: user.id,
      action: "shift_log.delete",
      entityType: "ShiftLog",
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonError("Failed to delete shift log", 500);
  }
}
