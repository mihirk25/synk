"use client";

import { useManagerApp } from "@/context/ManagerAppContext";
import { formatDateKey, todayKey } from "@/lib/dates";
import { formatCurrency, formatPercent } from "@/lib/format";
import { getLaborForDate } from "@/lib/laborCost";
import {
  cashVariance,
  getCashCountForDate,
  getEODForDate,
  laborPercentOfSales,
  netSales,
} from "@/lib/eodStats";
import { rosterStats } from "@/lib/roster";
import { StatCard } from "./StatCard";
import { ResponsiveGrid } from "./ResponsiveGrid";
import { ArrowRight, CheckCircle2, Clock3 } from "lucide-react";

export function DashboardSection() {
  const { state, selectedDate, setSection, currentRoster } = useManagerApp();
  const today = todayKey();
  const labor = getLaborForDate(state, selectedDate);
  const eod = getEODForDate(state, selectedDate);
  const cash = getCashCountForDate(state, selectedDate);
  const variance = cashVariance(eod, cash);
  const sales = eod ? netSales(eod) : 0;
  const laborPct = laborPercentOfSales(labor.totalCost, sales);
  const week = rosterStats(currentRoster, state.employees);

  const quickLinks = [
    { section: "labor" as const, label: "Log today’s shifts", desc: "Track hours & labour cost" },
    { section: "roster" as const, label: "Publish roster", desc: currentRoster.published ? "Roster is live" : "Draft — not published yet" },
    { section: "eod" as const, label: "Close out sales", desc: eod ? "EOD report saved" : "No EOD report yet" },
    { section: "cash" as const, label: "Run cash count", desc: cash ? "Cash count recorded" : "Cash count pending" },
  ];

  return (
    <div className="space-y-6">
      <ResponsiveGrid cols={4}>
        <StatCard
          label={`Labour cost · ${formatDateKey(selectedDate)}`}
          value={formatCurrency(labor.totalCost)}
          hint={`${labor.totalHours.toFixed(1)} hours across ${labor.lines.length} staff`}
        />
        <StatCard
          label="Net sales"
          value={eod ? formatCurrency(sales) : "—"}
          hint={eod ? `${eod.transactionCount} transactions` : "Enter EOD report"}
          tone={eod ? "good" : "warn"}
        />
        <StatCard
          label="Labour % of sales"
          value={laborPct != null ? formatPercent(laborPct) : "—"}
          hint="Target under 30%"
          tone={laborPct == null ? "neutral" : laborPct <= 30 ? "good" : laborPct <= 35 ? "warn" : "bad"}
        />
        <StatCard
          label="Cash variance"
          value={cash ? formatCurrency(variance.variance) : "—"}
          hint={cash ? `Expected ${formatCurrency(variance.expected)}` : "Complete cash count"}
          tone={!cash ? "neutral" : Math.abs(variance.variance) <= 5 ? "good" : "bad"}
        />
      </ResponsiveGrid>

      <ResponsiveGrid cols={2}>
        <div className="rounded-2xl border border-[#f0d4dc] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#3d2a32]">Today at a glance</h2>
            <span className="text-xs text-[#8b5a6b]">{formatDateKey(today, "long")}</span>
          </div>
          <ul className="space-y-3">
            {quickLinks.map((link) => (
              <li key={link.section}>
                <button
                  type="button"
                  onClick={() => setSection(link.section)}
                  className="flex w-full items-center justify-between rounded-xl bg-[#fff8f3] px-4 py-3 text-left transition hover:bg-[#fff0f5]"
                >
                  <div>
                    <p className="font-medium text-[#3d2a32]">{link.label}</p>
                    <p className="text-sm text-[#8b5a6b]">{link.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#e85d8a]" />
                </button>
              </li>
            ))}
          </ul>
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
