import { NextResponse } from "next/server";
import { canManage, requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/server/api";
import { writeAuditLog } from "@/lib/server/audit";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSessionUser();
    if (!canManage(user)) return jsonError("Forbidden", 403);

    const { id } = await params;

    const existing = await prisma.shiftLog.findFirst({
      where: { id, shopId: user.shopId },
    });
    if (!existing) return jsonError("Shift log not found", 404);

    await prisma.shiftLog.delete({ where: { id } });

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
