"use client";

import { useManagerApp } from "@/context/ManagerAppContext";
import { DAYS } from "@/lib/constants";
import { formatDateKey, getMondayOfWeek, getWeekEnd, parseDateKey, toDateKey } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { employeeSlotStyle } from "@/lib/employeeColors";
import { isSlotFilled, publishedRosterText, rosterStats } from "@/lib/roster";
import type { DayKey, RosterSlot } from "@/lib/types";
import { Card } from "./StatCard";
import { ResponsiveGrid } from "./ResponsiveGrid";
import { ScrollRow } from "./ScrollRow";
import { CheckCircle2, ChevronLeft, ChevronRight, Copy, Eye, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";

type SlotEditor = {
  day: DayKey;
  slotIndex: number;
  start: string;
  end: string;
  employeeId: string;
};

export function RosterSection() {
  const {
    state,
    weekStart,
    setWeekStart,
    currentRoster,
    saveRosterSlot,
    publishRoster,
    unpublishRoster,
  } = useManagerApp();
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editor, setEditor] = useState<SlotEditor | null>(null);
  const [saving, setSaving] = useState(false);

  const stats = rosterStats(currentRoster, state.employees);
  const weekEnd = useMemo(() => getWeekEnd(weekStart), [weekStart]);
  const weekLabel = `${formatDateKey(weekStart)} – ${formatDateKey(weekEnd)}`;
  const previewText = publishedRosterText(currentRoster, state.employees, weekLabel);

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

  function openSlotEditor(day: DayKey, slot: RosterSlot) {
    setEditor({
      day,
      slotIndex: slot.slotIndex,
      start: slot.start,
      end: slot.end,
      employeeId: slot.employeeId ?? state.employees[0]?.id ?? "",
    });
  }

  async function handleSaveSlot() {
    if (!editor) return;
    if (!editor.employeeId) return;
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
        start: editor.start,
        end: editor.end,
      });
      setEditor(null);
    } finally {
      setSaving(false);
    }
  }

  function employeeName(id: string | null) {
    if (!id) return null;
    return state.employees.find((e) => e.id === id)?.name ?? "Unknown";
  }

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
          </div>

          <div className="flex shrink-0 flex-nowrap gap-2">
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

      {state.employees.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {state.employees.map((emp) => {
            const style = employeeSlotStyle(emp.id, state.employees);
            return (
              <span
                key={emp.id}
                className="inline-flex items-center gap-2 rounded-full border border-[#f0d4dc] bg-white px-3 py-1.5 text-xs"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
                <span className="font-medium text-[#3d2a32]">{emp.name}</span>
              </span>
            );
          })}
        </div>
      ) : null}

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
          <div className="grid min-w-[48rem] grid-cols-7 gap-3">
            {DAYS.map((d) => (
              <div key={d.key} className="min-w-[6.5rem]">
                <p className="mb-3 text-center text-sm font-semibold text-[#3d2a32]">{d.short}</p>
                <div className="flex flex-col gap-2">
                  {currentRoster.slots[d.key].map((slot) => {
                    const filled = isSlotFilled(slot);
                    const name = employeeName(slot.employeeId);
                    const colors = filled && slot.employeeId
                      ? employeeSlotStyle(slot.employeeId, state.employees)
                      : null;
                    return (
                      <button
                        key={slot.slotIndex}
                        type="button"
                        onClick={() => openSlotEditor(d.key, slot)}
                        className={`flex min-h-[4.5rem] flex-col items-center justify-center rounded-xl border-2 border-dashed px-2 py-2 text-center transition ${
                          filled && colors
                            ? `${colors.box} hover:opacity-90`
                            : "border-[#f0d4dc] bg-[#fff8f3] hover:border-[#e85d8a] hover:bg-white"
                        }`}
                      >
                        {filled && colors ? (
                          <>
                            <p className={`text-xs font-semibold ${colors.name}`}>{name}</p>
                            <p className={`mt-1 text-[10px] ${colors.time}`}>
                              {slot.start} – {slot.end}
                            </p>
                          </>
                        ) : (
                          <Plus className="h-5 w-5 text-[#c9a0ad]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 text-xs text-[#8b5a6b]">
          Click an empty box to assign a shift — pick start time, end time, and staff. Publishing locks the roster for staff viewing.
        </p>
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
                Assign shift · {DAYS.find((d) => d.key === editor.day)?.label}
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
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">Staff member</span>
                <select
                  value={editor.employeeId}
                  onChange={(e) => setEditor({ ...editor, employeeId: e.target.value })}
                  className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2.5 text-sm"
                >
                  <option value="">Select staff…</option>
                  {state.employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} · {emp.role}
                    </option>
                  ))}
                </select>
              </label>

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
    </div>
  );
}
