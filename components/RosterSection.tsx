"use client";

import { useManagerApp } from "@/context/ManagerAppContext";
import { DAYS, DEFAULT_SHIFT, MAX_ROSTER_SLOTS_PER_DAY } from "@/lib/constants";
import { getAustralianHoliday } from "@/lib/australianHolidays";
import {
  type AvailabilityKey,
  ALL_AVAILABILITY_KEYS,
  TIME_BANDS,
  availabilityKey,
  isEmployeeAvailableForShift,
  isEmployeeAvailableOnDay,
} from "@/lib/availability";
import {
  dateKeyForDay,
  formatDateKey,
  getMondayOfWeek,
  getWeekEnd,
  parseDateKey,
  toDateKey,
} from "@/lib/dates";
import { employeeColor } from "@/lib/employeeColors";
import { formatCurrency } from "@/lib/format";
import { isSlotFilled, publishedRosterText, rosterStats } from "@/lib/roster";
import { durationBarWidth } from "@/lib/shiftBands";
import type { DayKey, RosterSlot } from "@/lib/types";
import { Card } from "./StatCard";
import { ResponsiveGrid } from "./ResponsiveGrid";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  KeyRound,
  Plus,
  UserPlus,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type SlotEditor = {
  day: DayKey;
  slotIndex: number;
  start: string;
  end: string;
  employeeId: string;
};

type StaffForm = {
  name: string;
  pin: string;
  hourlyRate: string;
  saturdayRate: string;
  sundayRate: string;
  publicHolidayRate: string;
  availability: AvailabilityKey[];
};

const emptyStaffForm = (): StaffForm => ({
  name: "",
  pin: "",
  hourlyRate: "",
  saturdayRate: "",
  sundayRate: "",
  publicHolidayRate: "",
  availability: [...ALL_AVAILABILITY_KEYS],
});

function RosterSlotCard({
  slot,
  employeeName,
  employeeId,
  employees,
  onClick,
}: {
  slot: RosterSlot;
  employeeName: string | null;
  employeeId: string | null;
  employees: ReadonlyArray<{ id: string }>;
  onClick: () => void;
}) {
  const filled = isSlotFilled(slot);
  const colors = employeeId ? employeeColor(employeeId, employees) : null;
  const barWidth = durationBarWidth(slot.start, slot.end);

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex min-h-[5rem] w-full flex-col justify-center overflow-hidden rounded-xl border bg-white px-3 py-2.5 text-left shadow-sm transition hover:shadow-md"
      style={{
        borderColor: filled && colors ? colors.border : "#f0d4dc",
        backgroundColor: filled && colors ? colors.bg : "#ffffff",
      }}
    >
      {filled && colors ? (
        <div
          className="absolute bottom-0 left-0 top-0 w-[4px] rounded-l-xl"
          style={{ backgroundColor: colors.border }}
        />
      ) : null}
      {filled ? (
        <>
          <p className="relative text-xs font-semibold" style={{ color: colors?.text }}>
            {employeeName}
          </p>
          <p className="relative mt-0.5 text-[10px] text-[#8b5a6b]">
            {slot.start} – {slot.end}
          </p>
          <div className="relative mt-2 h-1 w-full rounded-full bg-black/5">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${barWidth}%`, backgroundColor: colors?.bar }}
            />
          </div>
        </>
      ) : (
        <div className="relative flex flex-col items-center justify-center gap-1 py-1">
          <Plus className="h-5 w-5 text-[#c9a0ad]" />
          <span className="text-[10px] text-[#8b5a6b]">Add shift</span>
        </div>
      )}
    </button>
  );
}

export function RosterSection() {
  const {
    state,
    weekStart,
    setWeekStart,
    currentRoster,
    saveRosterSlot,
    publishRoster,
    unpublishRoster,
    addEmployee,
    setEmployeePin,
    addRosterSlotRow,
    copyRosterFromPreviousWeek,
  } = useManagerApp();
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editor, setEditor] = useState<SlotEditor | null>(null);
  const [staffForm, setStaffForm] = useState<StaffForm | null>(null);
  const [staffPayError, setStaffPayError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addingSlot, setAddingSlot] = useState(false);
  const [copyingWeek, setCopyingWeek] = useState(false);
  const [copyNotice, setCopyNotice] = useState<{ tone: "ok" | "warn"; text: string } | null>(null);
  const [pinManagerOpen, setPinManagerOpen] = useState(false);
  const [pinDrafts, setPinDrafts] = useState<Record<string, string>>({});
  const [pinSavingId, setPinSavingId] = useState<string | null>(null);
  const [pinFeedback, setPinFeedback] = useState<{ id: string; text: string; ok: boolean } | null>(
    null,
  );

  const stats = rosterStats(currentRoster, state.employees);
  const weekEnd = useMemo(() => getWeekEnd(weekStart), [weekStart]);
  const weekLabel = `${formatDateKey(weekStart)} – ${formatDateKey(weekEnd)}`;
  const previewText = publishedRosterText(currentRoster, state.employees, weekLabel);
  const slotRows = useMemo(
    () => Array.from({ length: currentRoster.slotsPerDay }, (_, i) => i),
    [currentRoster.slotsPerDay],
  );

  function shiftWeek(delta: number) {
    const d = parseDateKey(weekStart);
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(toDateKey(d));
  }

  async function copyRoster() {
    await navigator.clipboard.writeText(previewText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCopyFromLastWeek() {
    setCopyingWeek(true);
    setCopyNotice(null);
    try {
      const result = await copyRosterFromPreviousWeek();
      setCopyNotice({
        tone: result.copied ? "ok" : "warn",
        text: result.message,
      });
    } catch {
      setCopyNotice({
        tone: "warn",
        text: "Could not copy roster. Try again or build this week manually.",
      });
    } finally {
      setCopyingWeek(false);
    }
  }

  function openSlotEditor(day: DayKey, slot: RosterSlot) {
    setEditor({
      day,
      slotIndex: slot.slotIndex,
      start: isSlotFilled(slot) ? slot.start : DEFAULT_SHIFT.start,
      end: isSlotFilled(slot) ? slot.end : DEFAULT_SHIFT.end,
      employeeId: slot.employeeId ?? "",
    });
  }

  function availableEmployeesForEditor(day: DayKey, start: string, end: string) {
    return state.employees.filter((emp) => {
      if (!isEmployeeAvailableOnDay(emp, day)) return false;
      return isEmployeeAvailableForShift(emp, day, start, end);
    });
  }

  async function handleSaveSlot() {
    if (!editor || !editor.employeeId) return;
    setSaving(true);
    try {
      await saveRosterSlot(editor.day, editor.slotIndex, {
        employeeId: editor.employeeId,
        start: editor.start,
        end: editor.end,
      });
      setEditor(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleClearSlot() {
    if (!editor) return;
    setSaving(true);
    try {
      await saveRosterSlot(editor.day, editor.slotIndex, {
        employeeId: null,
        start: DEFAULT_SHIFT.start,
        end: DEFAULT_SHIFT.end,
      });
      setEditor(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!staffForm || !staffForm.name.trim()) return;

    const rates = {
      hourlyRate: parseFloat(staffForm.hourlyRate),
      saturdayRate: parseFloat(staffForm.saturdayRate),
      sundayRate: parseFloat(staffForm.sundayRate),
      publicHolidayRate: parseFloat(staffForm.publicHolidayRate),
    };

    if (Object.values(rates).some((r) => !Number.isFinite(r) || r <= 0)) {
      setStaffPayError("All pay rates are required and must be greater than zero.");
      return;
    }

    if (!/^\d{4,6}$/.test(staffForm.pin)) {
      setStaffPayError("PIN must be 4–6 digits (staff use this to sign in).");
      return;
    }

    setStaffPayError(null);
    setSaving(true);
    try {
      await addEmployee({
        name: staffForm.name.trim(),
        pin: staffForm.pin,
        ...rates,
        availability: staffForm.availability,
      });
      setStaffForm(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSlotRow() {
    if (currentRoster.slotsPerDay >= MAX_ROSTER_SLOTS_PER_DAY) return;
    setAddingSlot(true);
    try {
      await addRosterSlotRow();
    } finally {
      setAddingSlot(false);
    }
  }

  function toggleAvailability(key: AvailabilityKey) {
    if (!staffForm) return;
    const has = staffForm.availability.includes(key);
    setStaffForm({
      ...staffForm,
      availability: has
        ? staffForm.availability.filter((k) => k !== key)
        : [...staffForm.availability, key],
    });
  }

  function employeeName(id: string | null) {
    if (!id) return null;
    return state.employees.find((e) => e.id === id)?.name ?? "Unknown";
  }

  async function handleSavePin(employeeId: string) {
    const pin = pinDrafts[employeeId] ?? "";
    if (!/^\d{4,6}$/.test(pin)) {
      setPinFeedback({ id: employeeId, text: "PIN must be 4–6 digits", ok: false });
      return;
    }

    setPinSavingId(employeeId);
    setPinFeedback(null);
    try {
      await setEmployeePin(employeeId, pin);
      setPinDrafts((prev) => ({ ...prev, [employeeId]: "" }));
      setPinFeedback({ id: employeeId, text: "PIN saved", ok: true });
      setTimeout(() => setPinFeedback((f) => (f?.id === employeeId ? null : f)), 2500);
    } catch {
      setPinFeedback({ id: employeeId, text: "Could not save PIN", ok: false });
    } finally {
      setPinSavingId(null);
    }
  }

  const editorEmployees = editor
    ? availableEmployeesForEditor(editor.day, editor.start, editor.end)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => shiftWeek(-1)}
            className="rounded-full border border-[#f0d4dc] bg-white p-2 hover:bg-[#fff8f3]"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[#3d2a32]">{weekLabel}</p>
            <p className="text-xs text-[#8b5a6b]">
              <span className="sm:hidden">Week of {formatDateKey(weekStart)}</span>
              <span className="hidden sm:inline">Week starting {formatDateKey(weekStart, "long")}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => shiftWeek(1)}
            className="rounded-full border border-[#f0d4dc] bg-white p-2 hover:bg-[#fff8f3]"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setWeekStart(getMondayOfWeek())}
            className="rounded-full px-3 py-2 text-xs font-medium text-[#e85d8a] ring-1 ring-[#f0d4dc] hover:bg-[#fff0f5]"
          >
            This week
          </button>
          <button
            type="button"
            onClick={handleCopyFromLastWeek}
            disabled={copyingWeek}
            className="rounded-full px-3 py-2 text-xs font-medium text-[#6b4f5a] ring-1 ring-[#f0d4dc] hover:bg-[#fff8f3] disabled:opacity-50"
          >
            {copyingWeek ? "Copying…" : "Copy from last week"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setStaffPayError(null);
              setStaffForm(emptyStaffForm());
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#f0d4dc] bg-white px-4 py-2 text-sm font-medium text-[#6b4f5a] hover:bg-[#fff8f3] sm:flex-none"
          >
            <UserPlus className="h-4 w-4" />
            Add staff
          </button>
          <button
            type="button"
            onClick={() => {
              setPinFeedback(null);
              setPinManagerOpen(true);
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#f0d4dc] bg-white px-4 py-2 text-sm font-medium text-[#6b4f5a] hover:bg-[#fff8f3] sm:flex-none"
          >
            <KeyRound className="h-4 w-4" />
            Staff PINs
          </button>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#f0d4dc] bg-white px-4 py-2 text-sm font-medium text-[#6b4f5a] hover:bg-[#fff8f3] sm:flex-none"
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
          {currentRoster.published ? (
            <>
              <span className="inline-flex w-full items-center justify-center gap-1 rounded-full bg-[#e8f8ee] px-3 py-2 text-sm font-medium text-[#1f5a34] sm:w-auto">
                <CheckCircle2 className="h-4 w-4" />
                Published
              </span>
              <button
                type="button"
                onClick={unpublishRoster}
                className="w-full rounded-full px-4 py-2 text-sm font-medium text-[#8b5a6b] ring-1 ring-[#f0d4dc] hover:bg-white sm:w-auto"
              >
                Unpublish
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={publishRoster}
              className="w-full rounded-full bg-[#e85d8a] px-5 py-2 text-sm font-medium text-white hover:bg-[#d44d7a] sm:w-auto"
            >
              Publish roster
            </button>
          )}
        </div>
      </div>

      {copyNotice ? (
        <p
          className={`rounded-xl px-4 py-2.5 text-sm ${
            copyNotice.tone === "ok"
              ? "bg-[#e8f8ee] text-[#1f5a34]"
              : "bg-[#fff5f0] text-[#c43d5a]"
          }`}
        >
          {copyNotice.text}
        </p>
      ) : null}

      <ResponsiveGrid cols={3}>
        <div className="rounded-2xl border border-[#f0d4dc] bg-[#fff8f3] p-4">
          <p className="text-sm text-[#8b5a6b]">Total shifts</p>
          <p className="text-2xl font-semibold">{stats.shifts}</p>
        </div>
        <div className="rounded-2xl border border-[#f0d4dc] bg-[#fff8f3] p-4">
          <p className="text-sm text-[#8b5a6b]">Scheduled hours</p>
          <p className="text-2xl font-semibold">{stats.hours.toFixed(1)}h</p>
        </div>
        <div className="rounded-2xl border border-[#f0d4dc] bg-[#fff8f3] p-4">
          <p className="text-sm text-[#8b5a6b]">Est. labour cost</p>
          <p className="text-2xl font-semibold">{formatCurrency(stats.cost)}</p>
        </div>
      </ResponsiveGrid>

      {showPreview ? (
        <Card
          title="Staff roster preview"
          action={
            <button
              type="button"
              onClick={copyRoster}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-[#e85d8a] ring-1 ring-[#f0d4dc] hover:bg-[#fff0f5]"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copied!" : "Copy for WhatsApp"}
            </button>
          }
        >
          <pre className="whitespace-pre-wrap rounded-xl bg-[#fff8f3] p-4 text-sm text-[#3d2a32]">
            {previewText || "No shifts scheduled yet."}
          </pre>
        </Card>
      ) : null}

      <Card title="Weekly schedule">
        {/* Mobile: one block per day */}
        <div className="space-y-4 md:hidden">
          {DAYS.map((d) => {
            const dateKey = dateKeyForDay(weekStart, d.key);
            const holiday = getAustralianHoliday(dateKey);
            return (
              <div
                key={d.key}
                className={`rounded-xl border p-3 ${
                  holiday ? "border-[#a5b4fc] bg-[#eef2ff]/40" : "border-[#f0d4dc] bg-[#fff8f3]/50"
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#3d2a32]">{d.label}</p>
                    <p className="text-xs text-[#8b5a6b]">{formatDateKey(dateKey)}</p>
                  </div>
                  {holiday ? (
                    <span className="rounded-full bg-[#eef2ff] px-2 py-0.5 text-[10px] font-medium text-[#3730a3]">
                      {holiday}
                    </span>
                  ) : null}
                </div>
                <div className="space-y-2">
                  {slotRows.map((slotIndex) => {
                    const slot = currentRoster.slots[d.key][slotIndex];
                    if (!slot) return null;
                    return (
                      <RosterSlotCard
                        key={slotIndex}
                        slot={slot}
                        employeeName={employeeName(slot.employeeId)}
                        employeeId={slot.employeeId}
                        employees={state.employees}
                        onClick={() => openSlotEditor(d.key, slot)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
          {currentRoster.slotsPerDay < MAX_ROSTER_SLOTS_PER_DAY ? (
            <button
              type="button"
              onClick={handleAddSlotRow}
              disabled={addingSlot}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#f0d4dc] py-3 text-sm text-[#8b5a6b] hover:border-[#e85d8a] hover:bg-[#fff0f5] hover:text-[#e85d8a] disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {addingSlot ? "Adding…" : "Add shift row for week"}
            </button>
          ) : null}
        </div>

        {/* Desktop: 7-day grid */}
        <div className="scroll-x -mx-5 hidden px-5 md:block">
          <table className="min-w-[48rem] w-full border-separate border-spacing-2 text-sm">
            <thead>
              <tr>
                {DAYS.map((d) => {
                  const dateKey = dateKeyForDay(weekStart, d.key);
                  const holiday = getAustralianHoliday(dateKey);
                  return (
                    <th
                      key={d.key}
                      className={`min-w-[6.5rem] rounded-lg px-1 py-2 text-center text-sm font-semibold ${
                        holiday
                          ? "bg-[#eef2ff] text-[#3730a3] ring-1 ring-[#a5b4fc]"
                          : "text-[#3d2a32]"
                      }`}
                    >
                      {d.short}
                      {holiday ? (
                        <span className="mt-0.5 block text-[10px] font-normal">{holiday}</span>
                      ) : null}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {slotRows.map((slotIndex) => (
                <tr key={slotIndex}>
                  {DAYS.map((d) => {
                    const slot = currentRoster.slots[d.key][slotIndex];
                    if (!slot) return <td key={d.key} />;
                    return (
                      <td key={d.key} className="align-top">
                        <RosterSlotCard
                          slot={slot}
                          employeeName={employeeName(slot.employeeId)}
                          employeeId={slot.employeeId}
                          employees={state.employees}
                          onClick={() => openSlotEditor(d.key, slot)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
              {currentRoster.slotsPerDay < MAX_ROSTER_SLOTS_PER_DAY ? (
                <tr>
                  {DAYS.map((d) => (
                    <td key={d.key} className="align-top pt-0">
                      <button
                        type="button"
                        onClick={handleAddSlotRow}
                        disabled={addingSlot}
                        className="flex min-h-[2rem] w-full items-center justify-center rounded-lg border border-dashed border-[#f0d4dc] text-[#c9a0ad] transition hover:border-[#e85d8a] hover:bg-[#fff0f5] hover:text-[#e85d8a] disabled:opacity-50"
                        aria-label={`Add slot on ${d.label}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </td>
                  ))}
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {editor ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="w-full max-w-md rounded-2xl border border-[#f0d4dc] bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="slot-editor-title"
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 id="slot-editor-title" className="text-lg font-semibold text-[#3d2a32]">
                {DAYS.find((d) => d.key === editor.day)?.label} · Slot {editor.slotIndex + 1}
              </h3>
              <button
                type="button"
                onClick={() => setEditor(null)}
                className="min-h-0 min-w-0 rounded-lg p-2 text-[#8b5a6b] hover:bg-[#fff0f5]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">Start time</span>
                  <input
                    type="time"
                    value={editor.start}
                    onChange={(e) => setEditor({ ...editor, start: e.target.value })}
                    className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2.5 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">End time</span>
                  <input
                    type="time"
                    value={editor.end}
                    onChange={(e) => setEditor({ ...editor, end: e.target.value })}
                    className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2.5 text-sm"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">Staff member</span>
                <select
                  value={editor.employeeId}
                  onChange={(e) => setEditor({ ...editor, employeeId: e.target.value })}
                  className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2.5 text-sm"
                >
                  <option value="">Select staff…</option>
                  {editorEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
                {editorEmployees.length === 0 ? (
                  <p className="mt-1 text-xs text-[#c43d5a]">
                    No staff available for this day and shift time.
                  </p>
                ) : null}
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveSlot}
                disabled={saving || !editor.employeeId}
                className="rounded-full bg-[#e85d8a] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#d44d7a] disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save shift"}
              </button>
              {currentRoster.slots[editor.day][editor.slotIndex]?.employeeId ? (
                <button
                  type="button"
                  onClick={handleClearSlot}
                  disabled={saving}
                  className="rounded-full px-5 py-2.5 text-sm font-medium text-[#c43d5a] ring-1 ring-[#f0d4dc] hover:bg-[#fff5f8] disabled:opacity-50"
                >
                  Clear slot
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setEditor(null)}
                className="rounded-full px-5 py-2.5 text-sm font-medium text-[#8b5a6b] hover:bg-[#fff8f3]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {staffForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#f0d4dc] bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-form-title"
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 id="staff-form-title" className="text-lg font-semibold text-[#3d2a32]">
                Add staff member
              </h3>
              <button
                type="button"
                onClick={() => setStaffForm(null)}
                className="rounded-lg p-2 text-[#8b5a6b] hover:bg-[#fff0f5]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-5">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">Name</span>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2.5 text-sm"
                  placeholder="e.g. Sam"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">
                  Staff PIN (4–6 digits)
                </span>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4,6}"
                  maxLength={6}
                  required
                  value={staffForm.pin}
                  onChange={(e) =>
                    setStaffForm({ ...staffForm, pin: e.target.value.replace(/\D/g, "") })
                  }
                  className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2.5 text-sm tracking-widest"
                  placeholder="e.g. 1234"
                  autoComplete="off"
                />
                <p className="mt-1 text-xs text-[#8b5a6b]">
                  Staff use their name and this PIN to fill the closing form.
                </p>
              </label>

              <div>
                <p className="mb-2 text-sm font-medium text-[#6b4f5a]">
                  Pay rates ($/hr) — all required
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <label className="block">
                    <span className="mb-1 block text-[10px] text-[#8b5a6b]">Base</span>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.5"
                      value={staffForm.hourlyRate}
                      onChange={(e) => {
                        setStaffPayError(null);
                        setStaffForm({ ...staffForm, hourlyRate: e.target.value });
                      }}
                      className="w-full rounded-xl border border-[#f0d4dc] px-2 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] text-[#8b5a6b]">Saturday</span>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.5"
                      value={staffForm.saturdayRate}
                      onChange={(e) => {
                        setStaffPayError(null);
                        setStaffForm({ ...staffForm, saturdayRate: e.target.value });
                      }}
                      className="w-full rounded-xl border border-[#f0d4dc] px-2 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] text-[#8b5a6b]">Sunday</span>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.5"
                      value={staffForm.sundayRate}
                      onChange={(e) => {
                        setStaffPayError(null);
                        setStaffForm({ ...staffForm, sundayRate: e.target.value });
                      }}
                      className="w-full rounded-xl border border-[#f0d4dc] px-2 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] text-[#8b5a6b]">Public holiday</span>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.5"
                      value={staffForm.publicHolidayRate}
                      onChange={(e) => {
                        setStaffPayError(null);
                        setStaffForm({ ...staffForm, publicHolidayRate: e.target.value });
                      }}
                      className="w-full rounded-xl border border-[#f0d4dc] px-2 py-2 text-sm"
                    />
                  </label>
                </div>
                {staffPayError ? (
                  <p className="mt-2 text-xs text-[#c43d5a]">{staffPayError}</p>
                ) : null}
              </div>

              <fieldset>
                <legend className="mb-3 text-sm font-medium text-[#6b4f5a]">Availability</legend>
                <div className="space-y-3">
                  {DAYS.map((d) => (
                    <div key={d.key} className="flex items-center gap-3">
                      <span className="w-8 shrink-0 text-xs font-semibold text-[#3d2a32]">
                        {d.short}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {TIME_BANDS.map((band) => {
                          const key = availabilityKey(d.key, band.id);
                          const selected = staffForm.availability.includes(key);
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => toggleAvailability(key)}
                              className={`rounded-lg px-2.5 py-1 text-[10px] font-medium transition ${
                                selected
                                  ? "bg-[#e85d8a] text-white"
                                  : "bg-[#fff8f3] text-[#8b5a6b] ring-1 ring-[#f0d4dc]"
                              }`}
                            >
                              {band.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving || staffForm.availability.length === 0}
                  className="rounded-full bg-[#e85d8a] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#d44d7a] disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Add staff"}
                </button>
                <button
                  type="button"
                  onClick={() => setStaffForm(null)}
                  className="rounded-full px-5 py-2.5 text-sm font-medium text-[#8b5a6b] hover:bg-[#fff8f3]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {pinManagerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#f0d4dc] bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pin-manager-title"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 id="pin-manager-title" className="text-lg font-semibold text-[#3d2a32]">
                  Staff PINs
                </h3>
                <p className="mt-1 text-sm text-[#8b5a6b]">
                  Set a PIN for each staff member so they can sign in and fill the closing form.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPinManagerOpen(false)}
                className="rounded-lg p-2 text-[#8b5a6b] hover:bg-[#fff0f5]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {state.employees.length === 0 ? (
              <p className="text-sm text-[#8b5a6b]">Add staff in the roster first.</p>
            ) : (
              <ul className="space-y-4">
                {[...state.employees]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((emp) => (
                    <li
                      key={emp.id}
                      className="rounded-xl border border-[#f0d4dc] bg-[#fff8f3] p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="font-medium text-[#3d2a32]">{emp.name}</p>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                            emp.hasPin
                              ? "bg-[#e8f8ee] text-[#1f5a34]"
                              : "bg-[#fff5f0] text-[#c43d5a]"
                          }`}
                        >
                          {emp.hasPin ? "PIN set" : "No PIN"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          type="password"
                          inputMode="numeric"
                          pattern="\d{4,6}"
                          maxLength={6}
                          value={pinDrafts[emp.id] ?? ""}
                          onChange={(e) =>
                            setPinDrafts((prev) => ({
                              ...prev,
                              [emp.id]: e.target.value.replace(/\D/g, ""),
                            }))
                          }
                          placeholder={emp.hasPin ? "New PIN (4–6 digits)" : "PIN (4–6 digits)"}
                          className="w-full flex-1 rounded-xl border border-[#f0d4dc] bg-white px-3 py-2 text-sm tracking-widest"
                          autoComplete="off"
                        />
                        <button
                          type="button"
                          disabled={pinSavingId === emp.id}
                          onClick={() => handleSavePin(emp.id)}
                          className="rounded-full bg-[#e85d8a] px-4 py-2 text-sm font-medium text-white hover:bg-[#d44d7a] disabled:opacity-60 sm:shrink-0"
                        >
                          {pinSavingId === emp.id ? "Saving…" : emp.hasPin ? "Update" : "Set PIN"}
                        </button>
                      </div>
                      {pinFeedback?.id === emp.id ? (
                        <p
                          className={`mt-2 text-xs ${
                            pinFeedback.ok ? "text-[#1f5a34]" : "text-[#c43d5a]"
                          }`}
                        >
                          {pinFeedback.text}
                        </p>
                      ) : null}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
