"use client";

import { useState } from "react";
import { useManagerApp } from "@/context/ManagerAppContext";
import { formatDateKey } from "@/lib/dates";
import { formatCurrency, formatHours } from "@/lib/format";
import { getLaborForDate, getLaborForRange } from "@/lib/laborCost";
import { Card } from "./StatCard";
import { ResponsiveGrid } from "./ResponsiveGrid";
import { Trash2 } from "lucide-react";

export function LaborSection() {
  const { state, selectedDate, setSelectedDate, addShiftLog, removeShiftLog } = useManagerApp();
  const labor = getLaborForDate(state, selectedDate);
  const weekStart = new Date(selectedDate);
  weekStart.setDate(weekStart.getDate() - 6);
  const trend = getLaborForRange(
    state,
    weekStart.toISOString().slice(0, 10),
    selectedDate,
  );

  const [employeeId, setEmployeeId] = useState(state.employees[0]?.id ?? "");
  const [hours, setHours] = useState("8");
  const [notes, setNotes] = useState("");

  const logsForDay = state.shiftLogs.filter((l) => l.date === selectedDate);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const h = parseFloat(hours);
    if (!employeeId || !h || h <= 0 || h > 16) return;
    await addShiftLog(employeeId, h, notes.trim() || undefined);
    setHours("8");
    setNotes("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">Date</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-[#f0d4dc] bg-white px-3 py-2 text-sm"
          />
        </label>
      </div>

      <ResponsiveGrid cols={3}>
        <div className="rounded-2xl border border-[#f0d4dc] bg-[#fff8f3] p-5">
          <p className="text-sm text-[#8b5a6b]">Total hours</p>
          <p className="mt-1 text-3xl font-semibold text-[#3d2a32]">{formatHours(labor.totalHours)}</p>
        </div>
        <div className="rounded-2xl border border-[#f0d4dc] bg-[#fff8f3] p-5">
          <p className="text-sm text-[#8b5a6b]">Labour cost</p>
          <p className="mt-1 text-3xl font-semibold text-[#3d2a32]">{formatCurrency(labor.totalCost)}</p>
        </div>
        <div className="rounded-2xl border border-[#f0d4dc] bg-[#fff8f3] p-5">
          <p className="text-sm text-[#8b5a6b]">Staff on shift</p>
          <p className="mt-1 text-3xl font-semibold text-[#3d2a32]">{labor.lines.length}</p>
        </div>
      </ResponsiveGrid>

      <ResponsiveGrid cols={2}>
        <Card title="Log shift hours">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">Employee</span>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2 text-sm"
              >
                {state.employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} · {e.role} · {formatCurrency(e.hourlyRate)}/hr
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">Hours worked</span>
              <input
                type="number"
                min="0.5"
                max="16"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">Notes (optional)</span>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. covered closing shift"
                className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-[#e85d8a] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#d44d7a]"
            >
              Add to {formatDateKey(selectedDate)}
            </button>
          </form>
        </Card>

        <Card title={`Daily breakdown · ${formatDateKey(selectedDate)}`}>
          {labor.lines.length === 0 ? (
            <p className="text-sm text-[#8b5a6b]">No shifts logged for this date yet.</p>
          ) : (
            <div className="scroll-x -mx-5 px-5">
              <table className="min-w-[28rem] w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f0d4dc] text-left text-[#8b5a6b]">
                    <th className="pb-2 pr-4 font-medium">Staff</th>
                    <th className="pb-2 pr-4 font-medium">Hours</th>
                    <th className="pb-2 font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {labor.lines.map((line) => (
                    <tr key={line.employee.id} className="border-b border-[#faf0f3]">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-[#3d2a32]">{line.employee.name}</p>
                        <p className="text-xs text-[#8b5a6b]">{line.employee.role}</p>
                      </td>
                      <td className="py-3 pr-4">{formatHours(line.hours)}</td>
                      <td className="py-3">{formatCurrency(line.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </ResponsiveGrid>

      <Card title="Shift entries">
        {logsForDay.length === 0 ? (
          <p className="text-sm text-[#8b5a6b]">No individual entries for this date.</p>
        ) : (
          <ul className="divide-y divide-[#faf0f3]">
            {logsForDay.map((log) => {
              const emp = state.employees.find((e) => e.id === log.employeeId);
              return (
                <li key={log.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-[#3d2a32]">
                      {emp?.name ?? "Unknown"} · {formatHours(log.hours)}
                    </p>
                    {log.notes ? <p className="text-xs text-[#8b5a6b]">{log.notes}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeShiftLog(log.id)}
                    className="rounded-lg p-2 text-[#8b5a6b] hover:bg-[#fff0f5] hover:text-[#c43d5a]"
                    aria-label="Remove entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title="Last 7 days">
        <ResponsiveGrid cols={7}>
          {trend.map((day) => (
            <button
              key={day.date}
              type="button"
              onClick={() => setSelectedDate(day.date)}
              className={`rounded-xl border px-3 py-3 text-left text-xs transition ${
                day.date === selectedDate
                  ? "border-[#e85d8a] bg-[#fff0f5]"
                  : "border-[#f0d4dc] bg-[#fff8f3] hover:bg-white"
              }`}
            >
              <p className="font-medium text-[#3d2a32]">{formatDateKey(day.date)}</p>
              <p className="mt-1 text-[#8b5a6b]">{formatCurrency(day.cost)}</p>
              <p className="text-[#8b5a6b]">{formatHours(day.hours)}</p>
            </button>
          ))}
        </ResponsiveGrid>
      </Card>
    </div>
  );
}
