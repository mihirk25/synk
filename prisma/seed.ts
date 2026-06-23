import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";
import { getMondayOfWeek, todayKey } from "../lib/dates";

const employeeSeed = [
  { name: "Priya", role: "Shift Lead", hourlyRate: 28 },
  { name: "Jake", role: "Scooper", hourlyRate: 22 },
  { name: "Chloe", role: "Cashier", hourlyRate: 23 },
  { name: "Ravi", role: "Scooper", hourlyRate: 21 },
  { name: "Mia", role: "Cashier", hourlyRate: 21.5 },
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
      grossSales: 1842.5,
      cardSales: 1120,
      cashSales: 742.5,
      refunds: 18,
      transactionCount: 156,
      notes: "Busy Friday evening rush",
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
      published: false,
    },
  });

  const rosterSlots = days.flatMap((day) =>
    Array.from({ length: 5 }, (_, slotIndex) => ({
      rosterWeekId: rosterWeek.id,
      day,
      slotIndex,
      employeeId: null,
    })),
  );

  await prisma.rosterSlot.createMany({ data: rosterSlots });

  console.log("Seed complete.");
  console.log(`Login: ${process.env.SEED_EMAIL ?? "manager@synk.app"}`);
  console.log(`Password: ${process.env.SEED_PASSWORD ?? "synk1234"}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
