export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type Employee = {
  id: string;
  name: string;
  role: string;
  hourlyRate: number;
};

export type ShiftLog = {
  id: string;
  date: string;
  employeeId: string;
  hours: number;
  notes?: string;
};

export type EODReport = {
  id: string;
  date: string;
  grossSales: number;
  cardSales: number;
  cashSales: number;
  refunds: number;
  transactionCount: number;
  notes?: string;
};

export type CashCount = {
  id: string;
  date: string;
  openingFloat: number;
  countedCash: number;
  notes?: string;
};

export type RosterSlot = {
  slotIndex: number;
  employeeId: string | null;
  start: string;
  end: string;
};

export type RosterWeek = {
  weekStart: string;
  published: boolean;
  publishedAt?: string;
  slots: Record<DayKey, RosterSlot[]>;
};

export type AppState = {
  employees: Employee[];
  shiftLogs: ShiftLog[];
  eodReports: EODReport[];
  cashCounts: CashCount[];
  rosterWeeks: RosterWeek[];
};

export type Section =
  | "dashboard"
  | "labor"
  | "roster"
  | "eod"
  | "cash";
