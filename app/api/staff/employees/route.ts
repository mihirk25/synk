import { NextResponse } from "next/server";
import { getDefaultShop, listStaffLoginEmployees } from "@/lib/firestore/repository";
import { jsonError } from "@/lib/server/api";

export async function GET() {
  try {
    const shop = await getDefaultShop();
    if (!shop) return jsonError("Shop not configured", 500);

    const employees = await listStaffLoginEmployees(shop.id);
    return NextResponse.json({ shopName: shop.name, employees });
  } catch (error) {
    console.error("Staff employees list error:", error);
    return jsonError("Could not load staff list", 500);
  }
}
