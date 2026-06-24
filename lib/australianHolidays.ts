/** Australian national public holidays (en-AU). State-specific holidays not included. */

export type AustralianHoliday = {
  date: string;
  name: string;
};

function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

function observeWeekend(date: Date): Date {
  const day = date.getDay();
  if (day === 6) return addDays(date, 2);
  if (day === 0) return addDays(date, 1);
  return date;
}

function fixedHoliday(year: number, month: number, day: number, name: string): AustralianHoliday {
  const observed = observeWeekend(new Date(year, month - 1, day));
  return { date: toKey(observed), name };
}

export function holidaysForYear(year: number): AustralianHoliday[] {
  const easter = easterSunday(year);
  const goodFriday = addDays(easter, -2);
  const easterMonday = addDays(easter, 1);

  return [
    fixedHoliday(year, 1, 1, "New Year's Day"),
    fixedHoliday(year, 1, 26, "Australia Day"),
    { date: toKey(goodFriday), name: "Good Friday" },
    { date: toKey(easterMonday), name: "Easter Monday" },
    fixedHoliday(year, 4, 25, "ANZAC Day"),
    fixedHoliday(year, 12, 25, "Christmas Day"),
    fixedHoliday(year, 12, 26, "Boxing Day"),
  ];
}

const HOLIDAY_CACHE = new Map<string, string>();

function buildCache(startYear: number, endYear: number) {
  for (let y = startYear; y <= endYear; y++) {
    for (const h of holidaysForYear(y)) {
      HOLIDAY_CACHE.set(h.date, h.name);
    }
  }
}

buildCache(2024, 2030);

export function getAustralianHoliday(date: string): string | null {
  if (!HOLIDAY_CACHE.has(date)) {
    const year = parseInt(date.slice(0, 4), 10);
    if (!Number.isNaN(year)) {
      for (const h of holidaysForYear(year)) {
        HOLIDAY_CACHE.set(h.date, h.name);
      }
    }
  }
  return HOLIDAY_CACHE.get(date) ?? null;
}

export function isAustralianPublicHoliday(date: string): boolean {
  return getAustralianHoliday(date) !== null;
}
