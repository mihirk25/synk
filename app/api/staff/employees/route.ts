import { NextResponse } from "next/server";
import { getDefaultShop } from "@/lib/firestore/repository";
import { jsonError } from "@/lib/server/api";

export async function GET() {
  try {
    const shop = await getDefaultShop();
    if (!shop) return jsonError("Shop not configured", 500);

    return NextResponse.json({
      shopName: shop.name,
      pinConfigured: Boolean(shop.staffPinHash),
    });
  } catch (error) {
    console.error("Staff config error:", error);
    return jsonError("Could not load staff sign-in", 500);
  }
}
