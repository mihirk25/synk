import { shiftHours } from "./dates";

export type ShiftBandId = "morning" | "afternoon" | "evening";

export type ShiftBand = {
  id: ShiftBandId;
  slotIndex: number;
  label: string;
  shortLabel: string;
  icon: string;
  defaultStart: string;
  defaultEnd: string;
  border: string;
  bar: string;
  text: string;
  time: string;
  emptyBorder: string;
};

export const SHIFT_BANDS: ShiftBand[] = [
  {
    id: "morning",
    slotIndex: 0,
    label: "Morning slot",
    shortLabel: "Morning",
    icon: "🌅",
    defaultStart: "08:00",
    defaultEnd: "12:00",
    border: "#f59e0b",
    bar: "#f59e0b",
    text: "#92400e",
    time: "#b45309",
    emptyBorder: "#fcd34d",
  },
  {
    id: "afternoon",
    slotIndex: 1,
    label: "Afternoon slot",
    shortLabel: "Afternoon",
    icon: "☀️",
    defaultStart: "12:00",
    defaultEnd: "17:00",
    border: "#e85d8a",
    bar: "#e85d8a",
    text: "#8b2340",
    time: "#a85573",
    emptyBorder: "#f0d4dc",
  },
  {
    id: "evening",
    slotIndex: 2,
    label: "Evening slot",
    shortLabel: "Evening",
    icon: "🌙",
    defaultStart: "17:00",
    defaultEnd: "22:00",
    border: "#3730a3",
    bar: "#3730a3",
    text: "#1e1b4b",
    time: "#4338ca",
    emptyBorder: "#a5b4fc",
  },
];

const MORNING_END = 12 * 60;
const AFTERNOON_END = 17 * 60;
const MAX_BAR_HOURS = 10;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function bandBySlotIndex(slotIndex: number): ShiftBand {
  return SHIFT_BANDS[slotIndex] ?? SHIFT_BANDS[1]!;
}

export function bandsForShift(start: string, end: string): ShiftBandId[] {
  const startMin = timeToMinutes(start);
  let endMin = timeToMinutes(end);
  if (endMin <= startMin) endMin += 24 * 60;

  const bands: ShiftBandId[] = [];
  if (startMin < MORNING_END) bands.push("morning");
  if (endMin > MORNING_END && startMin < AFTERNOON_END) bands.push("afternoon");
  if (endMin > AFTERNOON_END) bands.push("evening");

  return bands.length > 0 ? bands : ["afternoon"];
}

export function bandColor(id: ShiftBandId): string {
  return SHIFT_BANDS.find((b) => b.id === id)!.border;
}

export type SlotVisualStyle = {
  borderColors: string[];
  isMixed: boolean;
  primary: ShiftBand;
  text: string;
  time: string;
  barColor: string;
};

export function slotVisualStyle(
  start: string,
  end: string,
  filled: boolean,
): SlotVisualStyle {
  if (!filled) {
    return {
      borderColors: ["#d4d4d8"],
      isMixed: false,
      primary: SHIFT_BANDS[1]!,
      text: "#71717a",
      time: "#a1a1aa",
      barColor: "#e4e4e7",
    };
  }

  const bandIds = bandsForShift(start, end);
  const bands = bandIds.map((id) => SHIFT_BANDS.find((b) => b.id === id)!);
  const primary = bands[0]!;

  return {
    borderColors: bands.map((b) => b.border),
    isMixed: bands.length > 1,
    primary,
    text: primary.text,
    time: primary.time,
    barColor: primary.bar,
  };
}

export function durationBarWidth(start: string, end: string): number {
  const hours = shiftHours(start, end);
  return Math.min(100, Math.max(8, (hours / MAX_BAR_HOURS) * 100));
}

/** Minimum filled slots before a day is flagged as understaffed. */
export function minStaffForDay(day: string): number {
  return ["fri", "sat", "sun"].includes(day) ? 2 : 1;
}

export function isDayUnderstaffed(filledCount: number, day: string): boolean {
  return filledCount < minStaffForDay(day);
}
