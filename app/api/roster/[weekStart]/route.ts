import { NextResponse } from "next/server";
import { canManage, requireSessionUser } from "@/lib/auth/session";
import { ensureRosterWeekInDb } from "@/lib/server/app-state";
import { jsonError } from "@/lib/server/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ weekStart: string }> },
) {
  try {
    const user = await requireSessionUser();
    if (!canManage(user)) return jsonError("Forbidden", 403);

    const { weekStart } = await params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
      return jsonError("Invalid weekStart", 400);
    }

    const roster = await ensureRosterWeekInDb(user.shopId, weekStart);
    return NextResponse.json({ roster });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonError("Failed to load roster", 500);
  }
}
