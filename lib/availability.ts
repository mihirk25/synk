import type { DayKey, Employee } from "./types";
import { DAYS } from "./constants";
import type { ShiftBandId } from "./shiftBands";
import { bandsForShift } from "./shiftBands";

export type TimeBand = ShiftBandId;
export type AvailabilityKey = `${DayKey}:${TimeBand}`;

export const TIME_BANDS: { id: TimeBand; label: string; short: string }[] = [
  { id: "morning", label: "Morning", short: "AM" },
  { id: "afternoon", label: "Afternoon", short: "PM" },
  { id: "evening", label: "Evening", short: "Eve" },
];

export const ALL_AVAILABILITY_KEYS: AvailabilityKey[] = DAYS.flatMap((d) =>
  TIME_BANDS.map((b) => `${d.key}:${b.id}` as AvailabilityKey),
);

export function availabilityKey(day: DayKey, band: TimeBand): AvailabilityKey {
  return `${day}:${band}`;
}

/** Supports legacy `mon,tue` and new `mon:morning,mon:afternoon` formats. */
export function parseAvailability(raw: string): AvailabilityKey[] {
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length === 0) return [];

  if (parts.every((p) => !p.includes(":"))) {
    const days = parts as DayKey[];
    return days.flatMap((day) =>
      TIME_BANDS.map((b) => availabilityKey(day, b.id)),
    );
  }

  return parts.filter((p) => {
    const [day, band] = p.split(":");
    return DAYS.some((d) => d.key === day) && TIME_BANDS.some((b) => b.id === band);
  }) as AvailabilityKey[];
}

export function serializeAvailability(keys: readonly string[]): string {
  return keys.join(",");
}

export function isEmployeeAvailableOnDay(employee: Employee, day: DayKey): boolean {
  return employee.availability.some((k) => k.startsWith(`${day}:`));
}

export function isEmployeeAvailableForShift(
  employee: Employee,
  day: DayKey,
  start: string,
  end: string,
): boolean {
  const bands = bandsForShift(start, end);
  return bands.some((band) => employee.availability.includes(availabilityKey(day, band)));
}
