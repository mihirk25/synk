import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const shiftLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  employeeId: z.string().min(1),
  hours: z.number().min(0.5).max(16),
  notes: z.string().max(500).optional(),
});

export const eodReportSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tillCash: z.number().min(0),
  reportCash: z.number().min(0),
  eftpos: z.number().min(0),
  expensesAmount: z.number().min(0),
  expenseNotes: z.string().max(2000).optional(),
  urgentStock: z.string().max(2000).optional(),
  staffSignature: z.string().min(1).max(100),
  floatTarget: z.number().min(0),
  denomCounts: z.record(z.string(), z.number().int().min(0)),
});

export const cashCountSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  openingFloat: z.number().min(0),
  countedCash: z.number().min(0),
  notes: z.string().max(1000).optional(),
});

export const rosterSlotSchema = z.object({
  day: z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
  slotIndex: z.number().int().min(0).max(11),
  employeeId: z.string().min(1).nullable(),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

const dayKeyEnum = z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
const timeBandEnum = z.enum(["morning", "afternoon", "evening"]);
const availabilityKeyEnum = z.string().regex(
  /^(mon|tue|wed|thu|fri|sat|sun):(morning|afternoon|evening)$/,
);

export const staffLoginSchema = z.object({
  employeeId: z.string().min(1),
  pin: z.string().regex(/^\d{4,6}$/, "PIN must be 4–6 digits"),
});

export const employeePinSchema = z.object({
  pin: z.string().regex(/^\d{4,6}$/, "PIN must be 4–6 digits"),
});

export const employeeSchema = z.object({
  name: z.string().min(1).max(100),
  hourlyRate: z.number().positive(),
  saturdayRate: z.number().positive(),
  sundayRate: z.number().positive(),
  publicHolidayRate: z.number().positive(),
  availability: z.array(availabilityKeyEnum).min(1),
  pin: z.string().regex(/^\d{4,6}$/).optional(),
});

const rosterSlotInputSchema = z.object({
  slotIndex: z.number().int().min(0).max(11),
  employeeId: z.string().min(1).nullable(),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

export const copyRosterFromPreviousSchema = z.object({
  localSource: z
    .object({
      slotsPerDay: z.number().int().min(1).max(12),
      slots: z.record(dayKeyEnum, z.array(rosterSlotInputSchema)),
    })
    .optional(),
});
