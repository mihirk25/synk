"use client";

import { useEffect, useState } from "react";
import { useManagerApp } from "@/context/ManagerAppContext";
import { formatDateKey } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import {
  cashVariance,
  expectedCashInTill,
  getCashCountForDate,
  getEODForDate,
} from "@/lib/eodStats";
import { Card } from "./StatCard";
import { ResponsiveGrid } from "./ResponsiveGrid";

export function CashCountSection() {
  const { state, selectedDate, setSelectedDate, saveCashCount } = useManagerApp();
  const eod = getEODForDate(state, selectedDate);
  const existing = getCashCountForDate(state, selectedDate);

  const [openingFloat, setOpeningFloat] = useState("200");
  const [countedCash, setCountedCash] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (existing) {
      setOpeningFloat(String(existing.openingFloat));
      setCountedCash(String(existing.countedCash));
      setNotes(existing.notes ?? "");
    } else {
      setOpeningFloat("200");
      setCountedCash("");
      setNotes("");
    }
  }, [existing, selectedDate]);

  const opening = parseFloat(openingFloat) || 0;
  const counted = parseFloat(countedCash) || 0;
  const draftEod = eod ?? {
    cashSales: 0,
    grossSales: 0,
    cardSales: 0,
    refunds: 0,
    transactionCount: 0,
    date: selectedDate,
    id: "",
  };
  const draftCash = existing ?? {
    openingFloat: opening,
    countedCash: counted,
    date: selectedDate,
    id: "",
  };
  const expected = expectedCashInTill(eod, { ...draftCash, openingFloat: opening });
  const variance = counted - expected;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await saveCashCount({
      id: existing?.id,
      date: selectedDate,
      openingFloat: opening,
      countedCash: counted,
      notes: notes.trim() || undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const recent = [...state.cashCounts]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  return (
    <div className="space-y-6">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">Count date</span>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-xl border border-[#f0d4dc] bg-white px-3 py-2 text-sm"
        />
      </label>

      <ResponsiveGrid cols={4}>
        <div className="rounded-2xl border border-[#f0d4dc] bg-[#fff8f3] p-5">
          <p className="text-sm text-[#8b5a6b]">Opening float</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(opening)}</p>
        </div>
        <div className="rounded-2xl border border-[#f0d4dc] bg-[#fff8f3] p-5">
          <p className="text-sm text-[#8b5a6b]">Cash sales (EOD)</p>
          <p className="mt-1 text-2xl font-semibold">
            {eod ? formatCurrency(eod.cashSales) : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-[#f0d4dc] bg-[#fff8f3] p-5">
          <p className="text-sm text-[#8b5a6b]">Expected in till</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(expected)}</p>
        </div>
        <div
          className={`rounded-2xl border p-5 ${
            !countedCash
              ? "border-[#f0d4dc] bg-[#fff8f3]"
              : Math.abs(variance) <= 5
                ? "border-[#b8e6c8] bg-[#f3fff7]"
                : "border-[#f5b8c8] bg-[#fff5f8]"
          }`}
        >
          <p className="text-sm text-[#8b5a6b]">Variance</p>
          <p className="mt-1 text-2xl font-semibold">
            {countedCash ? formatCurrency(variance) : "—"}
          </p>
        </div>
      </ResponsiveGrid>

      {!eod ? (
        <p className="rounded-xl bg-[#fffaf0] px-4 py-3 text-sm text-[#7a5a1f]">
          No EOD sales report for this date yet. Enter sales first for an accurate expected cash total.
        </p>
      ) : null}

      <ResponsiveGrid cols={2}>
        <Card title={`Cash count · ${formatDateKey(selectedDate)}`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">
                Opening float ($)
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(e.target.value)}
                className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">
                Cash counted in till ($)
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={countedCash}
                onChange={(e) => setCountedCash(e.target.value)}
                className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2 text-sm"
                required
              />
            </label>
            <div className="rounded-xl bg-[#fff8f3] px-4 py-3 text-sm text-[#6b4f5a]">
              <p>Expected = opening float + cash sales</p>
              <p className="mt-1 font-medium text-[#3d2a32]">
                {formatCurrency(opening)} + {formatCurrency(draftEod.cashSales)} ={" "}
                {formatCurrency(expected)}
              </p>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">Notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2 text-sm"
                placeholder="Over/short explanation, deposit made…"
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-[#e85d8a] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#d44d7a]"
            >
              {saved ? "Saved!" : existing ? "Update cash count" : "Save cash count"}
            </button>
          </form>
        </Card>

        <Card title="Recent cash counts">
          {recent.length === 0 ? (
            <p className="text-sm text-[#8b5a6b]">No cash counts yet.</p>
          ) : (
            <ul className="divide-y divide-[#faf0f3]">
              {recent.map((c) => {
                const eodForDay = getEODForDate(state, c.date);
                const v = cashVariance(eodForDay, c);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedDate(c.date)}
                      className="flex w-full items-center justify-between py-3 text-left hover:bg-[#fff8f3]"
                    >
                      <div>
                        <p className="font-medium text-[#3d2a32]">
                          {formatDateKey(c.date, "long")}
                        </p>
                        <p className="text-xs text-[#8b5a6b]">
                          Counted {formatCurrency(c.countedCash)} · Expected{" "}
                          {formatCurrency(v.expected)}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          Math.abs(v.variance) <= 5 ? "text-[#1f5a34]" : "text-[#c43d5a]"
                        }`}
                      >
                        {formatCurrency(v.variance)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </ResponsiveGrid>
    </div>
  );
}
