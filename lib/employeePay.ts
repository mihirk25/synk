import type { DayKey, Employee } from "./types";
import { isAustralianPublicHoliday } from "./australianHolidays";
import { getDayKeyFromDate } from "./dates";

export const ALL_DAYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export {
  type AvailabilityKey,
  type TimeBand,
  TIME_BANDS,
  ALL_AVAILABILITY_KEYS,
  availabilityKey,
  parseAvailability,
  serializeAvailability,
  isEmployeeAvailableOnDay,
  isEmployeeAvailableForShift,
} from "./availability";

export function hourlyRateForDate(employee: Employee, date: string): number {
  if (isAustralianPublicHoliday(date)) {
    return employee.publicHolidayRate ?? employee.hourlyRate;
  }
  const dayKey = getDayKeyFromDate(date);
  if (dayKey === "sat") return employee.saturdayRate ?? employee.hourlyRate;
  if (dayKey === "sun") return employee.sundayRate ?? employee.hourlyRate;
  return employee.hourlyRate;
}

export function rateLabelForDate(employee: Employee, date: string): string {
  if (isAustralianPublicHoliday(date)) return "Public holiday rate";
  const dayKey = getDayKeyFromDate(date);
  if (dayKey === "sat" && employee.saturdayRate != null) return "Saturday rate";
  if (dayKey === "sun" && employee.sundayRate != null) return "Sunday rate";
  return "Base rate";
}
