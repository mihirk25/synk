import { NextResponse } from "next/server";
import {
  canManage,
  isStaffOnlyUser,
  requireSessionUser,
} from "@/lib/auth/session";
import { fetchAppState } from "@/lib/server/app-state";
import { fetchStaffCloseState } from "@/lib/server/staff-close-state";
import { getShop } from "@/lib/firestore/repository";
import { jsonError } from "@/lib/server/api";

export async function GET() {
  try {
    const user = await requireSessionUser();

    if (isStaffOnlyUser(user)) {
      const state = await fetchStaffCloseState(user.shopId);
      return NextResponse.json({ state, shopName: user.shopName });
    }

    if (!canManage(user) && user.role !== "VIEWER") {
      return jsonError("Forbidden", 403);
    }

    const [state, shop] = await Promise.all([
      fetchAppState(user.shopId),
      getShop(user.shopId),
    ]);

    return NextResponse.json({
      state,
      shopName: user.shopName,
      staffPinConfigured: Boolean(shop?.staffPinHash),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("GET /api/app-state failed:", error);
    return jsonError("Failed to load app state", 500);
  }
}
