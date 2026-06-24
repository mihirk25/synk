import "dotenv/config";
import bcrypt from "bcryptjs";
import { FieldValue } from "firebase-admin/firestore";
import { getFirestoreDb } from "../lib/firebase/admin";
import { COLLECTIONS, rosterDocId, datedDocId } from "../lib/firestore/repository";
import { getMondayOfWeek, todayKey } from "../lib/dates";
import { createEmptyWeekSlots } from "../lib/roster";
import { randomUUID } from "crypto";

const employeeSeed = [
  {
    name: "Priya",
    role: "Shift Lead",
    hourlyRate: 28,
    saturdayRate: 32,
    sundayRate: 34,
    publicHolidayRate: 42,
    availableDays: "mon,tue,wed,thu,fri,sat,sun",
  },
  {
    name: "Jake",
    role: "Scooper",
    hourlyRate: 22,
    saturdayRate: 26,
    availableDays: "mon,tue,wed,thu,fri,sat",
  },
  {
    name: "Chloe",
    role: "Cashier",
    hourlyRate: 23,
    availableDays: "mon,tue,wed,thu,fri,sat,sun",
  },
  {
    name: "Ravi",
    role: "Scooper",
    hourlyRate: 21,
    availableDays: "wed,thu,fri,sat,sun",
  },
  {
    name: "Mia",
    role: "Cashier",
    hourlyRate: 21.5,
    availableDays: "mon,tue,wed,thu,fri",
  },
];

async function clearCollection(name: string) {
  const db = getFirestoreDb();
  const snap = await db.collection(name).get();
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  if (!snap.empty) await batch.commit();
}

async function main() {
  for (const collection of Object.values(COLLECTIONS)) {
    await clearCollection(collection);
  }

  const db = getFirestoreDb();
  const shopId = randomUUID();
  const now = FieldValue.serverTimestamp();

  await db.collection(COLLECTIONS.shops).doc(shopId).set({
    name: "Demo Shop",
    createdAt: now,
    updatedAt: now,
  });

  const passwordHash = await bcrypt.hash(process.env.SEED_PASSWORD ?? "synk1234", 12);
  const managerId = randomUUID();
  const staffId = randomUUID();

  await db.collection(COLLECTIONS.users).doc(managerId).set({
    shopId,
    email: (process.env.SEED_EMAIL ?? "manager@synk.app").toLowerCase(),
    name: "Demo Manager",
    role: "OWNER",
    passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  await db.collection(COLLECTIONS.users).doc(staffId).set({
    shopId,
    email: (process.env.SEED_STAFF_EMAIL ?? "staff@synk.app").toLowerCase(),
    name: "Demo Staff",
    role: "VIEWER",
    passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  const employees = await Promise.all(
    employeeSeed.map(async (emp) => {
      const id = randomUUID();
      await db.collection(COLLECTIONS.employees).doc(id).set({
        shopId,
        ...emp,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
      return { id, ...emp };
    }),
  );

  const today = todayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  const priya = employees[0]!;
  const jake = employees[1]!;
  const chloe = employees[2]!;

  for (const log of [
    { employeeId: priya.id, date: yesterdayKey, hours: 8 },
    { employeeId: jake.id, date: yesterdayKey, hours: 6 },
    { employeeId: chloe.id, date: today, hours: 4 },
  ]) {
    await db.collection(COLLECTIONS.shiftLogs).doc(randomUUID()).set({
      shopId,
      ...log,
      notes: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  await db.collection(COLLECTIONS.eodReports).doc(datedDocId(shopId, yesterdayKey)).set({
    shopId,
    date: yesterdayKey,
    grossSales: 635.69,
    cardSales: 562.89,
    cashSales: 72.8,
    refunds: 0,
    transactionCount: 0,
    tillCash: 152.75,
    expensesAmount: 0,
    staffSignature: "Demo Staff",
    floatTarget: 1100,
    denomCounts: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
  });

  await db.collection(COLLECTIONS.cashCounts).doc(datedDocId(shopId, yesterdayKey)).set({
    shopId,
    date: yesterdayKey,
    openingFloat: 200,
    countedCash: 942.5,
    notes: "Balanced",
    createdAt: now,
    updatedAt: now,
  });

  const weekStart = getMondayOfWeek();
  await db.collection(COLLECTIONS.rosterWeeks).doc(rosterDocId(shopId, weekStart)).set({
    shopId,
    weekStart,
    slotsPerDay: 1,
    published: false,
    publishedAt: null,
    slots: createEmptyWeekSlots(1),
    createdAt: now,
    updatedAt: now,
  });

  console.log("Firebase seed complete.");
  console.log(`Manager: ${process.env.SEED_EMAIL ?? "manager@synk.app"}`);
  console.log(`Staff:   ${process.env.SEED_STAFF_EMAIL ?? "staff@synk.app"}`);
  console.log(`Password: ${process.env.SEED_PASSWORD ?? "synk1234"}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
