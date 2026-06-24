import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";
import { getMondayOfWeek, todayKey } from "../lib/dates";

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

const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.rosterSlot.deleteMany();
  await prisma.rosterWeek.deleteMany();
  await prisma.cashCount.deleteMany();
  await prisma.eodReport.deleteMany();
  await prisma.shiftLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.shop.deleteMany();

  const shop = await prisma.shop.create({
    data: { name: "Demo Shop" },
  });

  const passwordHash = await bcrypt.hash(
    process.env.SEED_PASSWORD ?? "synk1234",
    12,
  );

  await prisma.user.create({
    data: {
      shopId: shop.id,
      email: process.env.SEED_EMAIL ?? "manager@synk.app",
      name: "Demo Manager",
      role: "OWNER",
      passwordHash,
    },
  });

  await prisma.user.create({
    data: {
      shopId: shop.id,
      email: process.env.SEED_STAFF_EMAIL ?? "staff@synk.app",
      name: "Demo Staff",
      role: "VIEWER",
      passwordHash,
    },
  });

  const employees = await Promise.all(
    employeeSeed.map((emp) =>
      prisma.employee.create({
        data: { shopId: shop.id, ...emp },
      }),
    ),
  );

  const today = todayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  const priya = employees[0]!;
  const jake = employees[1]!;
  const chloe = employees[2]!;

  await prisma.shiftLog.createMany({
    data: [
      { shopId: shop.id, employeeId: priya.id, date: yesterdayKey, hours: 8 },
      { shopId: shop.id, employeeId: jake.id, date: yesterdayKey, hours: 6 },
      { shopId: shop.id, employeeId: chloe.id, date: today, hours: 4 },
    ],
  });

  await prisma.eodReport.create({
    data: {
      shopId: shop.id,
      date: yesterdayKey,
      grossSales: 635.69,
      cardSales: 562.89,
      cashSales: 72.8,
      tillCash: 152.75,
      expensesAmount: 0,
      staffSignature: "Demo Staff",
      floatTarget: 1100,
    },
  });

  await prisma.cashCount.create({
    data: {
      shopId: shop.id,
      date: yesterdayKey,
      openingFloat: 200,
      countedCash: 942.5,
      notes: "Balanced",
    },
  });

  const weekStart = getMondayOfWeek();
  const rosterWeek = await prisma.rosterWeek.create({
    data: {
      shopId: shop.id,
      weekStart,
      slotsPerDay: 1,
      published: false,
    },
  });

  const rosterSlots = days.flatMap((day) =>
    Array.from({ length: 1 }, (_, slotIndex) => ({
      rosterWeekId: rosterWeek.id,
      day,
      slotIndex,
      employeeId: null,
      start: "10:00",
      end: "18:00",
    })),
  );

  await prisma.rosterSlot.createMany({ data: rosterSlots });

  console.log("Seed complete.");
  console.log(`Manager: ${process.env.SEED_EMAIL ?? "manager@synk.app"}`);
  console.log(`Staff:   ${process.env.SEED_STAFF_EMAIL ?? "staff@synk.app"}`);
  console.log(`Password: ${process.env.SEED_PASSWORD ?? "synk1234"}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
