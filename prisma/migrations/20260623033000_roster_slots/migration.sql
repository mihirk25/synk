-- Drop old employee-row roster model
DROP TABLE IF EXISTS "RosterShift";

-- Create slot-based roster model (5 slots per day)
CREATE TABLE "RosterSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rosterWeekId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "employeeId" TEXT,
    "start" TEXT NOT NULL DEFAULT '10:00',
    "end" TEXT NOT NULL DEFAULT '18:00',
    CONSTRAINT "RosterSlot_rosterWeekId_fkey" FOREIGN KEY ("rosterWeekId") REFERENCES "RosterWeek" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RosterSlot_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "RosterSlot_rosterWeekId_day_slotIndex_key" ON "RosterSlot"("rosterWeekId", "day", "slotIndex");
