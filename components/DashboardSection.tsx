"use client";

import { useManagerApp } from "@/context/ManagerAppContext";
import { getWeeklySalesLaborTrend } from "@/lib/dashboardTrend";
import { formatDateKey, todayKey } from "@/lib/dates";
import { formatCurrency, formatPercent } from "@/lib/format";
import { getLaborForDate } from "@/lib/laborCost";
import { getEODForDate, laborPercentOfSales, netSales } from "@/lib/eodStats";
import { rosterStats } from "@/lib/roster";
import { StatCard } from "./StatCard";
import { ResponsiveGrid } from "./ResponsiveGrid";
import { WeeklySalesLaborChart } from "./WeeklySalesLaborChart";
import { CheckCircle2, Clock3 } from "lucide-react";

export function DashboardSection() {
  const { state, selectedDate, setSelectedDate, weekStart, currentRoster } = useManagerApp();
  const labor = getLaborForDate(state, selectedDate);
  const eod = getEODForDate(state, selectedDate);
  const sales = eod ? netSales(eod) : 0;
  const laborPct = laborPercentOfSales(labor.totalCost, sales);
  const week = rosterStats(currentRoster, state.employees);
  const weekTrend = getWeeklySalesLaborTrend(state, weekStart);
  const weekSales = weekTrend.reduce((sum, d) => sum + (d.sales ?? 0), 0);
  const weekLabor = weekTrend.reduce((sum, d) => sum + d.labor, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="min-w-0 text-sm text-[#8b5a6b] sm:max-w-md">
          Figures update live from the roster and closing form — change either tab and this
          dashboard refreshes.
        </p>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">Date</span>
          <input
            type="date"
            value={selectedDate}
            max={todayKey()}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-[#f0d4dc] bg-white px-3 py-2 text-sm"
          />
        </label>
      </div>

      <ResponsiveGrid cols={4}>
        <StatCard
          label={`Labour cost · ${formatDateKey(selectedDate)}`}
          value={formatCurrency(labor.totalCost)}
          hint={`${labor.totalHours.toFixed(1)} hours across ${labor.lines.length} staff`}
        />
        <StatCard
          label="Net sales"
          value={eod ? formatCurrency(sales) : "—"}
          hint={eod ? "From closing form" : "Submit closing form"}
          tone={eod ? "good" : "warn"}
        />
        <StatCard
          label="Labour % of sales"
          value={laborPct != null ? formatPercent(laborPct) : "—"}
          hint="Target under 30%"
          tone={laborPct == null ? "neutral" : laborPct <= 30 ? "good" : laborPct <= 35 ? "warn" : "bad"}
        />
        <StatCard
          label="Week total sales"
          value={formatCurrency(weekSales)}
          hint={`Labour ${formatCurrency(weekLabor)} this week`}
        />
      </ResponsiveGrid>

      <ResponsiveGrid cols={2}>
        <div className="rounded-2xl border border-[#f0d4dc] bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-[#3d2a32]">Sales &amp; labour</h2>
            <span className="text-xs text-[#8b5a6b]">
              Week of {formatDateKey(weekStart, "calendar")}
            </span>
          </div>
          <WeeklySalesLaborChart
            data={weekTrend}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        <div className="rounded-2xl border border-[#f0d4dc] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#3d2a32]">This week&apos;s roster</h2>
          <ResponsiveGrid cols={3}>
            <StatCard label="Shifts" value={week.shifts} />
            <StatCard label="Hours" value={week.hours.toFixed(1)} />
            <StatCard label="Est. cost" value={formatCurrency(week.cost)} />
          </ResponsiveGrid>
          <div className="mt-4 flex items-center gap-2 text-sm text-[#6b4f5a]">
            {currentRoster.published ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-[#2f8f4e]" />
                Published {currentRoster.publishedAt ? formatDateKey(currentRoster.publishedAt.slice(0, 10)) : ""}
              </>
            ) : (
              <>
                <Clock3 className="h-4 w-4 text-[#c47a20]" />
                Draft roster — publish when ready
              </>
            )}
          </div>
        </div>
      </ResponsiveGrid>
    </div>
  );
}
