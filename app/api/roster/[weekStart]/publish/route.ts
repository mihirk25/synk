import { NextResponse } from "next/server";
import { canManage, requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ensureRosterWeekInDb } from "@/lib/server/app-state";
import { jsonError } from "@/lib/server/api";
import { writeAuditLog } from "@/lib/server/audit";

async function setPublished(
  shopId: string,
  userId: string,
  weekStart: string,
  published: boolean,
) {
  await ensureRosterWeekInDb(shopId, weekStart);

  const week = await prisma.rosterWeek.update({
    where: { shopId_weekStart: { shopId, weekStart } },
    data: {
      published,
      publishedAt: published ? new Date() : null,
    },
  });

  await writeAuditLog({
    shopId,
    userId,
    action: published ? "roster.publish" : "roster.unpublish",
    entityType: "RosterWeek",
    entityId: week.id,
    metadata: { weekStart },
  });

  return ensureRosterWeekInDb(shopId, weekStart);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ weekStart: string }> },
) {
  try {
    const user = await requireSessionUser();
    if (!canManage(user)) return jsonError("Forbidden", 403);
    const { weekStart } = await params;
    const roster = await setPublished(user.shopId, user.id, weekStart, true);
    return NextResponse.json({ roster });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonError("Failed to publish roster", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ weekStart: string }> },
) {
  try {
    const user = await requireSessionUser();
    if (!canManage(user)) return jsonError("Forbidden", 403);
    const { weekStart } = await params;
    const roster = await setPublished(user.shopId, user.id, weekStart, false);
    return NextResponse.json({ roster });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonError("Failed to unpublish roster", 500);
  }
}
