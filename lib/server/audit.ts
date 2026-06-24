import { createAuditLog } from "@/lib/firestore/repository";

export async function writeAuditLog(input: {
  shopId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  await createAuditLog(input);
}
