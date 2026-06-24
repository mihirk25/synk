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
import { ScrollRow } from "./ScrollRow";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
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
  hourlyRate: string;
  saturdayRate: string;
  sundayRate: string;
  publicHolidayRate: string;
  availability: AvailabilityKey[];
};

const emptyStaffForm = (): StaffForm => ({
  name: "",
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

    setStaffPayError(null);
    setSaving(true);
    try {
      await addEmployee({
        name: staffForm.name.trim(),
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

  const editorEmployees = editor
    ? availableEmployeesForEditor(editor.day, editor.start, editor.end)
    : [];

  return (
    <div className="space-y-6">
      <ScrollRow>
        <div className="flex w-max min-w-full flex-nowrap items-center justify-between gap-4 md:w-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => shiftWeek(-1)}
              className="rounded-full border border-[#f0d4dc] bg-white p-2 hover:bg-[#fff8f3]"
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="font-semibold text-[#3d2a32]">{weekLabel}</p>
              <p className="text-xs text-[#8b5a6b]">Week starting {formatDateKey(weekStart, "long")}</p>
            </div>
            <button
              type="button"
              onClick={() => shiftWeek(1)}
              className="rounded-full border border-[#f0d4dc] bg-white p-2 hover:bg-[#fff8f3]"
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setWeekStart(getMondayOfWeek())}
              className="ml-2 rounded-full px-3 py-1.5 text-xs font-medium text-[#e85d8a] ring-1 ring-[#f0d4dc] hover:bg-[#fff0f5]"
            >
              This week
            </button>
            <button
              type="button"
              onClick={handleCopyFromLastWeek}
              disabled={copyingWeek}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-[#6b4f5a] ring-1 ring-[#f0d4dc] hover:bg-[#fff8f3] disabled:opacity-50"
            >
              {copyingWeek ? "Copying…" : "Copy from last week"}
            </button>
          </div>

          <div className="flex shrink-0 flex-nowrap gap-2">
            <button
              type="button"
              onClick={() => {
                setStaffPayError(null);
                setStaffForm(emptyStaffForm());
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[#f0d4dc] bg-white px-4 py-2 text-sm font-medium text-[#6b4f5a] hover:bg-[#fff8f3]"
            >
              <UserPlus className="h-4 w-4" />
              Add staff
            </button>
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-[#f0d4dc] bg-white px-4 py-2 text-sm font-medium text-[#6b4f5a] hover:bg-[#fff8f3]"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
            {currentRoster.published ? (
              <>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f8ee] px-3 py-2 text-sm font-medium text-[#1f5a34]">
                  <CheckCircle2 className="h-4 w-4" />
                  Published
                </span>
                <button
                  type="button"
                  onClick={unpublishRoster}
                  className="rounded-full px-4 py-2 text-sm font-medium text-[#8b5a6b] ring-1 ring-[#f0d4dc] hover:bg-white"
                >
                  Unpublish
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={publishRoster}
                className="rounded-full bg-[#e85d8a] px-5 py-2 text-sm font-medium text-white hover:bg-[#d44d7a]"
              >
                Publish roster
              </button>
            )}
          </div>
        </div>
      </ScrollRow>

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
        <div className="scroll-x -mx-5 px-5">
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
    </div>
  );
}
