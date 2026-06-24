-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Staff',
    "hourlyRate" REAL NOT NULL,
    "saturdayRate" REAL,
    "sundayRate" REAL,
    "publicHolidayRate" REAL,
    "availableDays" TEXT NOT NULL DEFAULT 'mon,tue,wed,thu,fri,sat,sun',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Employee_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Employee" ("active", "createdAt", "hourlyRate", "id", "name", "role", "shopId", "updatedAt") SELECT "active", "createdAt", "hourlyRate", "id", "name", "role", "shopId", "updatedAt" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
CREATE TABLE "new_RosterWeek" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "weekStart" TEXT NOT NULL,
    "slotsPerDay" INTEGER NOT NULL DEFAULT 5,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RosterWeek_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RosterWeek" ("createdAt", "id", "published", "publishedAt", "shopId", "updatedAt", "weekStart") SELECT "createdAt", "id", "published", "publishedAt", "shopId", "updatedAt", "weekStart" FROM "RosterWeek";
DROP TABLE "RosterWeek";
ALTER TABLE "new_RosterWeek" RENAME TO "RosterWeek";
CREATE UNIQUE INDEX "RosterWeek_shopId_weekStart_key" ON "RosterWeek"("shopId", "weekStart");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
