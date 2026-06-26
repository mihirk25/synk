import { randomUUID } from "crypto";
import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";
import { getFirestoreDb } from "@/lib/firebase/admin";
import { DAYS, ROSTER_SLOTS_PER_DAY } from "@/lib/constants";
import { createEmptyWeekSlots } from "@/lib/roster";
import type { DayKey, RosterSlot } from "@/lib/types";

const DAY_KEYS = DAYS.map((d) => d.key);

export const COLLECTIONS = {
  shops: "shops",
  users: "users",
  sessions: "sessions",
  employees: "employees",
  shiftLogs: "shiftLogs",
  eodReports: "eodReports",
  cashCounts: "cashCounts",
  rosterWeeks: "rosterWeeks",
  auditLogs: "auditLogs",
} as const;

export function rosterDocId(shopId: string, weekStart: string) {
  return `${shopId}__${weekStart}`;
}

export function datedDocId(shopId: string, date: string) {
  return `${shopId}__${date}`;
}

function db() {
  return getFirestoreDb();
}

function toDate(value: Timestamp | Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") return new Date(value);
  return value.toDate();
}

export type UserRecord = {
  id: string;
  shopId: string;
  email: string;
  passwordHash: string;
  name: string | null;
  role: "OWNER" | "MANAGER" | "VIEWER";
};

export type ShopRecord = {
  id: string;
  name: string;
};

export type EmployeeRecord = {
  id: string;
  shopId: string;
  name: string;
  role: string;
  hourlyRate: number;
  saturdayRate: number | null;
  sundayRate: number | null;
  publicHolidayRate: number | null;
  availableDays: string;
  active: boolean;
  pinHash: string | null;
};

export type RosterWeekRecord = {
  id: string;
  shopId: string;
  weekStart: string;
  slotsPerDay: number;
  published: boolean;
  publishedAt: Date | null;
  slots: Record<DayKey, RosterSlot[]>;
};

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const snap = await db()
    .collection(COLLECTIONS.users)
    .where("email", "==", email.toLowerCase())
    .limit(1)
    .get();

  const doc = snap.docs[0];
  if (!doc) return null;
  const data = doc.data();
  return {
    id: doc.id,
    shopId: data.shopId,
    email: data.email,
    passwordHash: data.passwordHash,
    name: data.name ?? null,
    role: data.role,
  };
}

export async function getShop(shopId: string): Promise<ShopRecord | null> {
  const doc = await db().collection(COLLECTIONS.shops).doc(shopId).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  return { id: doc.id, name: data.name };
}

export async function getDefaultShop(): Promise<ShopRecord | null> {
  const snap = await db().collection(COLLECTIONS.shops).limit(1).get();
  const doc = snap.docs[0];
  if (!doc) return null;
  return { id: doc.id, name: doc.data().name };
}

function mapEmployeeDoc(id: string, data: DocumentData): EmployeeRecord {
  return {
    id,
    shopId: String(data.shopId),
    name: String(data.name),
    role: String(data.role ?? "Staff"),
    hourlyRate: Number(data.hourlyRate),
    saturdayRate: data.saturdayRate != null ? Number(data.saturdayRate) : null,
    sundayRate: data.sundayRate != null ? Number(data.sundayRate) : null,
    publicHolidayRate: data.publicHolidayRate != null ? Number(data.publicHolidayRate) : null,
    availableDays: String(data.availableDays),
    active: Boolean(data.active),
    pinHash: data.pinHash ? String(data.pinHash) : null,
  };
}

export async function createSession(input: {
  token: string;
  userId: string;
  expiresAt: Date;
}) {
  await db().collection(COLLECTIONS.sessions).doc(input.token).set({
    kind: "user",
    userId: input.userId,
    expiresAt: Timestamp.fromDate(input.expiresAt),
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function createStaffSession(input: {
  token: string;
  shopId: string;
  employeeId: string;
  expiresAt: Date;
}) {
  await db().collection(COLLECTIONS.sessions).doc(input.token).set({
    kind: "staff",
    shopId: input.shopId,
    employeeId: input.employeeId,
    expiresAt: Timestamp.fromDate(input.expiresAt),
    createdAt: FieldValue.serverTimestamp(),
  });
}

export type SessionAuth =
  | { kind: "user"; user: UserRecord; shop: ShopRecord }
  | { kind: "staff"; employee: EmployeeRecord; shop: ShopRecord };

export async function getSessionByToken(token: string): Promise<SessionAuth | null> {
  const sessionDoc = await db().collection(COLLECTIONS.sessions).doc(token).get();
  if (!sessionDoc.exists) return null;

  const session = sessionDoc.data()!;
  const expiresAt = toDate(session.expiresAt as Timestamp);
  if (!expiresAt || expiresAt < new Date()) {
    await sessionDoc.ref.delete().catch(() => {});
    return null;
  }

  if (session.kind === "staff" || session.employeeId) {
    const shop = await getShop(String(session.shopId));
    if (!shop) return null;
    const employeeDoc = await db()
      .collection(COLLECTIONS.employees)
      .doc(String(session.employeeId))
      .get();
    if (!employeeDoc.exists) return null;
    const employee = mapEmployeeDoc(employeeDoc.id, employeeDoc.data()!);
    if (employee.shopId !== shop.id || !employee.active) return null;
    return { kind: "staff", employee, shop };
  }

  const userDoc = await db().collection(COLLECTIONS.users).doc(String(session.userId)).get();
  if (!userDoc.exists) return null;
  const userData = userDoc.data()!;

  const shop = await getShop(userData.shopId);
  if (!shop) return null;

  return {
    kind: "user",
    user: {
      id: userDoc.id,
      shopId: userData.shopId,
      email: userData.email,
      passwordHash: userData.passwordHash,
      name: userData.name ?? null,
      role: userData.role,
    },
    shop,
  };
}

export async function deleteSession(token: string) {
  await db().collection(COLLECTIONS.sessions).doc(token).delete().catch(() => {});
}

export async function listEmployees(shopId: string): Promise<EmployeeRecord[]> {
  const snap = await db()
    .collection(COLLECTIONS.employees)
    .where("shopId", "==", shopId)
    .where("active", "==", true)
    .get();

  return snap.docs
    .map((doc) => mapEmployeeDoc(doc.id, doc.data()))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function listStaffLoginEmployees(shopId: string): Promise<{ id: string; name: string }[]> {
  const employees = await listEmployees(shopId);
  return employees.filter((e) => e.pinHash).map((e) => ({ id: e.id, name: e.name }));
}

export async function authenticateStaffPin(
  shopId: string,
  employeeId: string,
  pin: string,
): Promise<EmployeeRecord | null> {
  const employee = await findEmployee(shopId, employeeId);
  if (!employee?.pinHash) return null;
  const { verifyPassword } = await import("@/lib/auth/password");
  const ok = await verifyPassword(pin, employee.pinHash);
  return ok ? employee : null;
}

export async function findEmployee(
  shopId: string,
  employeeId: string,
): Promise<EmployeeRecord | null> {
  const doc = await db().collection(COLLECTIONS.employees).doc(employeeId).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  if (data.shopId !== shopId || !data.active) return null;
  return mapEmployeeDoc(doc.id, data);
}

export async function setEmployeePin(shopId: string, employeeId: string, pinHash: string) {
  const employee = await findEmployee(shopId, employeeId);
  if (!employee) return false;
  await db().collection(COLLECTIONS.employees).doc(employeeId).set(
    { pinHash, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  return true;
}

export async function createEmployee(
  shopId: string,
  data: {
    name: string;
    hourlyRate: number;
    saturdayRate: number;
    sundayRate: number;
    publicHolidayRate: number;
    availableDays: string;
    pinHash?: string | null;
  },
) {
  const id = randomUUID();
  const now = FieldValue.serverTimestamp();
  const record = {
    shopId,
    name: data.name,
    role: "Staff",
    hourlyRate: data.hourlyRate,
    saturdayRate: data.saturdayRate,
    sundayRate: data.sundayRate,
    publicHolidayRate: data.publicHolidayRate,
    availableDays: data.availableDays,
    pinHash: data.pinHash ?? null,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  await db().collection(COLLECTIONS.employees).doc(id).set(record);
  return {
    id,
    shopId,
    name: record.name,
    role: record.role,
    hourlyRate: record.hourlyRate,
    saturdayRate: record.saturdayRate,
    sundayRate: record.sundayRate,
    publicHolidayRate: record.publicHolidayRate,
    availableDays: record.availableDays,
    active: true,
    pinHash: record.pinHash,
  } satisfies EmployeeRecord;
}

export async function listShiftLogs(shopId: string) {
  const snap = await db()
    .collection(COLLECTIONS.shiftLogs)
    .where("shopId", "==", shopId)
    .get();
  return snap.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        shopId: data.shopId,
        employeeId: data.employeeId,
        date: data.date,
        hours: data.hours,
        notes: data.notes ?? null,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function createShiftLog(input: {
  shopId: string;
  employeeId: string;
  date: string;
  hours: number;
  notes?: string;
}) {
  const id = randomUUID();
  await db()
    .collection(COLLECTIONS.shiftLogs)
    .doc(id)
    .set({
      ...input,
      notes: input.notes ?? null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  return { id, ...input, notes: input.notes ?? null };
}

export async function findShiftLog(shopId: string, id: string) {
  const doc = await db().collection(COLLECTIONS.shiftLogs).doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  if (data.shopId !== shopId) return null;
  return { id: doc.id, ...data };
}

export async function deleteShiftLog(id: string) {
  await db().collection(COLLECTIONS.shiftLogs).doc(id).delete();
}

export type EodReportDoc = {
  id: string;
  shopId: string;
  date: string;
  grossSales: number;
  cardSales: number;
  cashSales: number;
  refunds: number;
  transactionCount: number;
  notes: string | null;
  tillCash: number;
  expensesAmount: number;
  expenseNotes: string | null;
  urgentStock: string | null;
  staffSignature: string | null;
  floatTarget: number;
  denomCounts: string | null;
};

export type CashCountDoc = {
  id: string;
  shopId: string;
  date: string;
  openingFloat: number;
  countedCash: number;
  notes: string | null;
};

function mapEodDoc(id: string, data: DocumentData): EodReportDoc {
  return {
    id,
    shopId: String(data.shopId),
    date: String(data.date),
    grossSales: Number(data.grossSales),
    cardSales: Number(data.cardSales),
    cashSales: Number(data.cashSales),
    refunds: Number(data.refunds ?? 0),
    transactionCount: Number(data.transactionCount ?? 0),
    notes: data.notes ? String(data.notes) : null,
    tillCash: Number(data.tillCash ?? 0),
    expensesAmount: Number(data.expensesAmount ?? 0),
    expenseNotes: data.expenseNotes ? String(data.expenseNotes) : null,
    urgentStock: data.urgentStock ? String(data.urgentStock) : null,
    staffSignature: data.staffSignature ? String(data.staffSignature) : null,
    floatTarget: Number(data.floatTarget ?? 1100),
    denomCounts: data.denomCounts ? String(data.denomCounts) : null,
  };
}

function mapCashCountDoc(id: string, data: DocumentData): CashCountDoc {
  return {
    id,
    shopId: String(data.shopId),
    date: String(data.date),
    openingFloat: Number(data.openingFloat),
    countedCash: Number(data.countedCash),
    notes: data.notes ? String(data.notes) : null,
  };
}

export async function listEodReports(shopId: string): Promise<EodReportDoc[]> {
  const snap = await db()
    .collection(COLLECTIONS.eodReports)
    .where("shopId", "==", shopId)
    .get();
  return snap.docs
    .map((doc) => mapEodDoc(doc.id, doc.data()))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function upsertEodReport(
  shopId: string,
  data: {
    date: string;
    grossSales: number;
    cardSales: number;
    cashSales: number;
    refunds: number;
    transactionCount: number;
    tillCash: number;
    expensesAmount: number;
    expenseNotes: string | null;
    urgentStock: string | null;
    staffSignature: string;
    floatTarget: number;
    denomCounts: string;
  },
): Promise<{
  id: string;
  date: string;
  grossSales: number;
  cardSales: number;
  cashSales: number;
  refunds: number;
  transactionCount: number;
  notes: string | null;
  tillCash: number;
  expensesAmount: number;
  expenseNotes: string | null;
  urgentStock: string | null;
  staffSignature: string | null;
  floatTarget: number;
  denomCounts: string | null;
}> {
  const id = datedDocId(shopId, data.date);
  const now = FieldValue.serverTimestamp();
  await db()
    .collection(COLLECTIONS.eodReports)
    .doc(id)
    .set(
      {
        shopId,
        ...data,
        notes: null,
        updatedAt: now,
        createdAt: now,
      },
      { merge: true },
    );
  const saved = await db().collection(COLLECTIONS.eodReports).doc(id).get();
  const row = saved.data()!;
  return {
    id,
    date: String(row.date),
    grossSales: Number(row.grossSales),
    cardSales: Number(row.cardSales),
    cashSales: Number(row.cashSales),
    refunds: Number(row.refunds ?? 0),
    transactionCount: Number(row.transactionCount ?? 0),
    notes: row.notes ? String(row.notes) : null,
    tillCash: Number(row.tillCash ?? 0),
    expensesAmount: Number(row.expensesAmount ?? 0),
    expenseNotes: row.expenseNotes ? String(row.expenseNotes) : null,
    urgentStock: row.urgentStock ? String(row.urgentStock) : null,
    staffSignature: row.staffSignature ? String(row.staffSignature) : null,
    floatTarget: Number(row.floatTarget ?? 1100),
    denomCounts: row.denomCounts ? String(row.denomCounts) : null,
  };
}

export async function listCashCounts(shopId: string): Promise<CashCountDoc[]> {
  const snap = await db()
    .collection(COLLECTIONS.cashCounts)
    .where("shopId", "==", shopId)
    .get();
  return snap.docs
    .map((doc) => mapCashCountDoc(doc.id, doc.data()))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function upsertCashCount(
  shopId: string,
  data: {
    date: string;
    openingFloat: number;
    countedCash: number;
    notes?: string;
  },
): Promise<{
  id: string;
  date: string;
  openingFloat: number;
  countedCash: number;
  notes: string | null;
}> {
  const id = datedDocId(shopId, data.date);
  const now = FieldValue.serverTimestamp();
  await db()
    .collection(COLLECTIONS.cashCounts)
    .doc(id)
    .set(
      {
        shopId,
        date: data.date,
        openingFloat: data.openingFloat,
        countedCash: data.countedCash,
        notes: data.notes ?? null,
        updatedAt: now,
        createdAt: now,
      },
      { merge: true },
    );
  const saved = await db().collection(COLLECTIONS.cashCounts).doc(id).get();
  const row = saved.data()!;
  return {
    id,
    date: String(row.date),
    openingFloat: Number(row.openingFloat),
    countedCash: Number(row.countedCash),
    notes: row.notes ? String(row.notes) : null,
  };
}

export async function listRosterWeeks(shopId: string): Promise<RosterWeekRecord[]> {
  const snap = await db()
    .collection(COLLECTIONS.rosterWeeks)
    .where("shopId", "==", shopId)
    .get();

  return snap.docs
    .map((doc) => rosterRecordFromDoc(doc.id, doc.data()))
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart));
}

function rosterRecordFromDoc(id: string, data: Record<string, unknown>): RosterWeekRecord {
  const slotsPerDay = Number(data.slotsPerDay) || ROSTER_SLOTS_PER_DAY;
  const storedSlots = (data.slots ?? {}) as Record<DayKey, RosterSlot[]>;
  const slots = createEmptyWeekSlots(slotsPerDay);

  for (const day of DAY_KEYS) {
    const daySlots = storedSlots[day] ?? [];
    for (const slot of daySlots) {
      if (slot.slotIndex >= 0 && slot.slotIndex < slotsPerDay) {
        slots[day][slot.slotIndex] = {
          slotIndex: slot.slotIndex,
          employeeId: slot.employeeId ?? null,
          start: slot.start,
          end: slot.end,
        };
      }
    }
  }

  return {
    id,
    shopId: String(data.shopId),
    weekStart: String(data.weekStart),
    slotsPerDay,
    published: Boolean(data.published),
    publishedAt: toDate(data.publishedAt as Timestamp),
    slots,
  };
}

export async function getRosterWeekRecord(
  shopId: string,
  weekStart: string,
): Promise<RosterWeekRecord | null> {
  const doc = await db()
    .collection(COLLECTIONS.rosterWeeks)
    .doc(rosterDocId(shopId, weekStart))
    .get();
  if (!doc.exists) return null;
  return rosterRecordFromDoc(doc.id, doc.data()!);
}

export async function ensureRosterWeekRecord(
  shopId: string,
  weekStart: string,
): Promise<RosterWeekRecord> {
  const id = rosterDocId(shopId, weekStart);
  const ref = db().collection(COLLECTIONS.rosterWeeks).doc(id);
  const existing = await ref.get();
  if (existing.exists) {
    return rosterRecordFromDoc(existing.id, existing.data()!);
  }

  const slots = createEmptyWeekSlots(ROSTER_SLOTS_PER_DAY);
  const data = {
    shopId,
    weekStart,
    slotsPerDay: ROSTER_SLOTS_PER_DAY,
    published: false,
    publishedAt: null,
    slots,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await ref.set(data);
  return rosterRecordFromDoc(id, data);
}

export async function updateRosterSlot(
  shopId: string,
  weekStart: string,
  day: DayKey,
  slotIndex: number,
  patch: { employeeId: string | null; start: string; end: string },
) {
  const record = await ensureRosterWeekRecord(shopId, weekStart);
  const slots = { ...record.slots, [day]: [...record.slots[day]] };
  slots[day][slotIndex] = { slotIndex, ...patch };

  await db()
    .collection(COLLECTIONS.rosterWeeks)
    .doc(record.id)
    .set(
      {
        slots,
        published: false,
        publishedAt: null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  return getRosterWeekRecord(shopId, weekStart);
}

export async function addRosterSlotRow(shopId: string, weekStart: string, newIndex: number) {
  const record = await ensureRosterWeekRecord(shopId, weekStart);
  const slots = { ...record.slots } as Record<DayKey, RosterSlot[]>;

  for (const day of DAY_KEYS) {
    slots[day] = [
      ...slots[day],
      {
        slotIndex: newIndex,
        employeeId: null,
        start: slots[day][0]?.start ?? "10:00",
        end: slots[day][0]?.end ?? "18:00",
      },
    ];
  }

  await db()
    .collection(COLLECTIONS.rosterWeeks)
    .doc(record.id)
    .set(
      {
        slotsPerDay: newIndex + 1,
        slots,
        published: false,
        publishedAt: null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  return getRosterWeekRecord(shopId, weekStart);
}

export async function replaceRosterWeek(
  shopId: string,
  weekStart: string,
  slotsPerDay: number,
  sourceSlots: Array<{
    day: DayKey;
    slotIndex: number;
    employeeId: string | null;
    start: string;
    end: string;
  }>,
) {
  const record = await ensureRosterWeekRecord(shopId, weekStart);
  const slots = createEmptyWeekSlots(slotsPerDay);

  if (sourceSlots.length > 0) {
    for (const slot of sourceSlots) {
      if (slot.slotIndex >= 0 && slot.slotIndex < slotsPerDay) {
        slots[slot.day][slot.slotIndex] = {
          slotIndex: slot.slotIndex,
          employeeId: slot.employeeId,
          start: slot.start,
          end: slot.end,
        };
      }
    }
  }

  await db()
    .collection(COLLECTIONS.rosterWeeks)
    .doc(record.id)
    .set(
      {
        slotsPerDay,
        slots,
        published: false,
        publishedAt: null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  return getRosterWeekRecord(shopId, weekStart);
}

export async function setRosterPublished(
  shopId: string,
  weekStart: string,
  published: boolean,
) {
  const record = await ensureRosterWeekRecord(shopId, weekStart);
  await db()
    .collection(COLLECTIONS.rosterWeeks)
    .doc(record.id)
    .set(
      {
        published,
        publishedAt: published ? Timestamp.fromDate(new Date()) : null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  return getRosterWeekRecord(shopId, weekStart);
}

export async function createAuditLog(input: {
  shopId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  const id = randomUUID();
  await db()
    .collection(COLLECTIONS.auditLogs)
    .doc(id)
    .set({
      ...input,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      createdAt: FieldValue.serverTimestamp(),
    });
  return id;
}

export async function findRosterWeekByWeekStart(shopId: string, weekStart: string) {
  return getRosterWeekRecord(shopId, weekStart);
}
