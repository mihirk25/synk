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
  grossSales: z.number().min(0),
  cardSales: z.number().min(0),
  cashSales: z.number().min(0),
  refunds: z.number().min(0),
  transactionCount: z.number().int().min(0),
  notes: z.string().max(1000).optional(),
});

export const cashCountSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  openingFloat: z.number().min(0),
  countedCash: z.number().min(0),
  notes: z.string().max(1000).optional(),
});

export const rosterSlotSchema = z.object({
  day: z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
  slotIndex: z.number().int().min(0).max(4),
  employeeId: z.string().min(1).nullable(),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});
