import { NextResponse } from "next/server";
import { canManage, requireSessionUser } from "@/lib/auth/session";
import { fetchAppState } from "@/lib/server/app-state";
import { jsonError } from "@/lib/server/api";

export async function GET() {
  try {
    const user = await requireSessionUser();
    if (!canManage(user)) return jsonError("Forbidden", 403);

    const state = await fetchAppState(user.shopId);
    return NextResponse.json({ state, shopName: user.shopName });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("GET /api/app-state failed:", error);
    return jsonError("Failed to load app state", 500);
  }
}
