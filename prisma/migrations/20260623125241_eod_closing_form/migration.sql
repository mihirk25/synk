-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EodReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "grossSales" REAL NOT NULL,
    "cardSales" REAL NOT NULL,
    "cashSales" REAL NOT NULL,
    "refunds" REAL NOT NULL DEFAULT 0,
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "tillCash" REAL NOT NULL DEFAULT 0,
    "expensesAmount" REAL NOT NULL DEFAULT 0,
    "expenseNotes" TEXT,
    "urgentStock" TEXT,
    "staffSignature" TEXT,
    "floatTarget" REAL NOT NULL DEFAULT 1100,
    "denomCounts" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EodReport_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EodReport" ("cardSales", "cashSales", "createdAt", "date", "grossSales", "id", "notes", "refunds", "shopId", "transactionCount", "updatedAt") SELECT "cardSales", "cashSales", "createdAt", "date", "grossSales", "id", "notes", "refunds", "shopId", "transactionCount", "updatedAt" FROM "EodReport";
DROP TABLE "EodReport";
ALTER TABLE "new_EodReport" RENAME TO "EodReport";
CREATE UNIQUE INDEX "EodReport_shopId_date_key" ON "EodReport"("shopId", "date");
CREATE TABLE "new_RosterWeek" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "weekStart" TEXT NOT NULL,
    "slotsPerDay" INTEGER NOT NULL DEFAULT 1,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RosterWeek_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RosterWeek" ("createdAt", "id", "published", "publishedAt", "shopId", "slotsPerDay", "updatedAt", "weekStart") SELECT "createdAt", "id", "published", "publishedAt", "shopId", "slotsPerDay", "updatedAt", "weekStart" FROM "RosterWeek";
DROP TABLE "RosterWeek";
ALTER TABLE "new_RosterWeek" RENAME TO "RosterWeek";
CREATE UNIQUE INDEX "RosterWeek_shopId_weekStart_key" ON "RosterWeek"("shopId", "weekStart");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
