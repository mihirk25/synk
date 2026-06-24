"use client";

import { useManagerApp } from "@/context/ManagerAppContext";
import { getAustralianHoliday } from "@/lib/australianHolidays";
import { formatDateKey, getWeekEnd, todayKey } from "@/lib/dates";
import { rateLabelForDate } from "@/lib/employeePay";
import { formatCurrency, formatHours } from "@/lib/format";
import { getLaborForDate, getLaborForRange } from "@/lib/laborCost";
import { getRosterLaborForWeek } from "@/lib/roster";
import { Card } from "./StatCard";
import { ResponsiveGrid } from "./ResponsiveGrid";

export function LaborSection() {
  const { state, selectedDate, setSelectedDate, weekStart } = useManagerApp();
  const labor = getLaborForDate(state, selectedDate);
  const weekLabor = getRosterLaborForWeek(state, weekStart);
  const holiday = getAustralianHoliday(selectedDate);

  const trend = getLaborForRange(state, weekStart, getWeekEnd(weekStart));

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
        {holiday ? (
          <span className="rounded-full bg-[#eef2ff] px-3 py-1.5 text-xs font-medium text-[#3730a3]">
            {holiday} — public holiday rates apply
          </span>
        ) : null}
      </div>

      <p className="text-sm text-[#8b5a6b]">
        Labour cost is synced from your roster. Update shifts in the Roster tab and costs here
        update automatically.
      </p>

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
        <Card title={`Daily breakdown · ${formatDateKey(selectedDate)}`}>
          {labor.lines.length === 0 ? (
            <p className="text-sm text-[#8b5a6b]">No shifts scheduled for this date in the roster.</p>
          ) : (
            <div className="scroll-x -mx-5 px-5">
              <table className="min-w-[28rem] w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f0d4dc] text-left text-[#8b5a6b]">
                    <th className="pb-2 pr-4 font-medium">Staff</th>
                    <th className="pb-2 pr-4 font-medium">Shift</th>
                    <th className="pb-2 pr-4 font-medium">Hours</th>
                    <th className="pb-2 font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {labor.lines.map((line) => (
                    <tr key={`${line.employee.id}-${line.shiftLabel}`} className="border-b border-[#faf0f3]">
                      <td className="py-3 pr-4 font-medium text-[#3d2a32]">{line.employee.name}</td>
                      <td className="py-3 pr-4 text-[#8b5a6b]">
                        {line.shiftLabel}
                        <span className="mt-0.5 block text-[10px]">
                          {formatCurrency(line.rate)}/hr · {rateLabelForDate(line.employee, selectedDate)}
                        </span>
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

        <Card title={`Week total · ${formatDateKey(weekStart)} onwards`}>
          {weekLabor.lines.length === 0 ? (
            <p className="text-sm text-[#8b5a6b]">No shifts scheduled this week yet.</p>
          ) : (
            <>
              <p className="mb-3 text-2xl font-semibold text-[#3d2a32]">
                {formatCurrency(weekLabor.totalCost)}
              </p>
              <p className="mb-4 text-sm text-[#8b5a6b]">
                {formatHours(weekLabor.totalHours)} across {weekLabor.lines.length} staff
              </p>
              <ul className="divide-y divide-[#faf0f3] text-sm">
                {weekLabor.lines.map((line) => (
                  <li key={line.employee.id} className="flex justify-between py-2">
                    <span className="font-medium text-[#3d2a32]">{line.employee.name}</span>
                    <span className="text-[#8b5a6b]">
                      {formatHours(line.hours)} · {formatCurrency(line.cost)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </ResponsiveGrid>

      <Card title={`This week · ${formatDateKey(weekStart)} – ${formatDateKey(getWeekEnd(weekStart))}`}>
        <ResponsiveGrid cols={7}>
          {trend.map((day) => {
            const dayHoliday = getAustralianHoliday(day.date);
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelectedDate(day.date)}
                className={`rounded-xl border px-3 py-3 text-left text-xs transition ${
                  day.date === selectedDate
                    ? "border-[#e85d8a] bg-[#fff0f5]"
                    : dayHoliday
                      ? "border-[#a5b4fc] bg-[#eef2ff] hover:bg-white"
                      : "border-[#f0d4dc] bg-[#fff8f3] hover:bg-white"
                }`}
              >
                <p className="font-medium text-[#3d2a32]">{formatDateKey(day.date)}</p>
                {dayHoliday ? (
                  <p className="mt-0.5 text-[10px] text-[#3730a3]">{dayHoliday}</p>
                ) : null}
                <p className="mt-1 text-[#8b5a6b]">{formatCurrency(day.cost)}</p>
                <p className="text-[#8b5a6b]">{formatHours(day.hours)}</p>
              </button>
            );
          })}
        </ResponsiveGrid>
      </Card>
    </div>
  );
}
