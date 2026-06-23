import type { DayKey } from "./types";
import { DAYS } from "./constants";

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateKey(key: string, style: "short" | "long" = "short"): string {
  const d = parseDateKey(key);
  return d.toLocaleDateString("en-AU", {
    weekday: style === "long" ? "long" : "short",
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: style === "long" ? "numeric" : undefined,
  });
}

export function getMondayOfWeek(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toDateKey(d);
}

/** Sunday at the end of the week that starts on the given Monday. */
export function getWeekEnd(weekStart: string): string {
  const d = parseDateKey(weekStart);
  d.setDate(d.getDate() + 6);
  return toDateKey(d);
}

export function getDayKeyFromDate(dateKey: string): DayKey {
  const dayIndex = parseDateKey(dateKey).getDay();
  const map: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[dayIndex];
}

export function dateKeyForDay(weekStart: string, day: DayKey): string {
  const start = parseDateKey(weekStart);
  const offset = DAYS.findIndex((d) => d.key === day);
  start.setDate(start.getDate() + offset);
  return toDateKey(start);
}

export function shiftHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  return Math.max(0, mins / 60);
}
