import type { DayKey } from "./types";

export const STORAGE_KEY = "synk-v1";
export const PRODUCT_NAME = "Synk";

export const DAYS: { key: DayKey; label: string; short: string }[] = [
  { key: "mon", label: "Monday", short: "Mon" },
  { key: "tue", label: "Tuesday", short: "Tue" },
  { key: "wed", label: "Wednesday", short: "Wed" },
  { key: "thu", label: "Thursday", short: "Thu" },
  { key: "fri", label: "Friday", short: "Fri" },
  { key: "sat", label: "Saturday", short: "Sat" },
  { key: "sun", label: "Sunday", short: "Sun" },
];

export const DEFAULT_SHIFT = { on: false, start: "10:00", end: "18:00" };
export const ROSTER_SLOTS_PER_DAY = 5;
