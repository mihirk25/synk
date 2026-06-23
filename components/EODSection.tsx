"use client";

import { useEffect, useState } from "react";
import { useManagerApp } from "@/context/ManagerAppContext";
import { formatDateKey } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { getLaborForDate } from "@/lib/laborCost";
import { getEODForDate, laborPercentOfSales, netSales } from "@/lib/eodStats";
import { Card } from "./StatCard";
import { ResponsiveGrid } from "./ResponsiveGrid";

export function EODSection() {
  const { state, selectedDate, setSelectedDate, saveEOD } = useManagerApp();
  const existing = getEODForDate(state, selectedDate);
  const labor = getLaborForDate(state, selectedDate);

  const [grossSales, setGrossSales] = useState("");
  const [cardSales, setCardSales] = useState("");
  const [cashSales, setCashSales] = useState("");
  const [refunds, setRefunds] = useState("0");
  const [transactionCount, setTransactionCount] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (existing) {
      setGrossSales(String(existing.grossSales));
      setCardSales(String(existing.cardSales));
      setCashSales(String(existing.cashSales));
      setRefunds(String(existing.refunds));
      setTransactionCount(String(existing.transactionCount));
      setNotes(existing.notes ?? "");
    } else {
      setGrossSales("");
      setCardSales("");
      setCashSales("");
      setRefunds("0");
      setTransactionCount("");
      setNotes("");
    }
  }, [existing, selectedDate]);

  const gross = parseFloat(grossSales) || 0;
  const card = parseFloat(cardSales) || 0;
  const cash = parseFloat(cashSales) || 0;
  const refund = parseFloat(refunds) || 0;
  const paymentTotal = card + cash;
  const paymentMismatch = gross > 0 && Math.abs(paymentTotal - gross) > 0.01;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gross || !transactionCount) return;
    await saveEOD({
      id: existing?.id,
      date: selectedDate,
      grossSales: gross,
      cardSales: card,
      cashSales: cash,
      refunds: refund,
      transactionCount: parseInt(transactionCount, 10) || 0,
      notes: notes.trim() || undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const recent = [...state.eodReports]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  const net = existing ? netSales(existing) : gross - refund;
  const laborPct = laborPercentOfSales(labor.totalCost, net);

  return (
    <div className="space-y-6">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">EOD date</span>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-xl border border-[#f0d4dc] bg-white px-3 py-2 text-sm"
        />
      </label>

      <ResponsiveGrid cols={3}>
        <div className="rounded-2xl border border-[#f0d4dc] bg-[#fff8f3] p-5">
          <p className="text-sm text-[#8b5a6b]">Net sales</p>
          <p className="mt-1 text-3xl font-semibold">{formatCurrency(net)}</p>
        </div>
        <div className="rounded-2xl border border-[#f0d4dc] bg-[#fff8f3] p-5">
          <p className="text-sm text-[#8b5a6b]">Labour cost</p>
          <p className="mt-1 text-3xl font-semibold">{formatCurrency(labor.totalCost)}</p>
        </div>
        <div className="rounded-2xl border border-[#f0d4dc] bg-[#fff8f3] p-5">
          <p className="text-sm text-[#8b5a6b]">Labour %</p>
          <p className="mt-1 text-3xl font-semibold">
            {laborPct != null ? `${laborPct.toFixed(1)}%` : "—"}
          </p>
        </div>
      </ResponsiveGrid>

      <ResponsiveGrid cols={2}>
        <Card title={`End of day report · ${formatDateKey(selectedDate)}`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">Gross sales</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={grossSales}
                  onChange={(e) => setGrossSales(e.target.value)}
                  className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2 text-sm"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">Transactions</span>
                <input
                  type="number"
                  min="0"
                  value={transactionCount}
                  onChange={(e) => setTransactionCount(e.target.value)}
                  className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2 text-sm"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">Card sales</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cardSales}
                  onChange={(e) => setCardSales(e.target.value)}
                  className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">Cash sales</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashSales}
                  onChange={(e) => setCashSales(e.target.value)}
                  className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2 text-sm"
                />
              </label>
              <label className="block col-span-2">
                <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">Refunds</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={refunds}
                  onChange={(e) => setRefunds(e.target.value)}
                  className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2 text-sm"
                />
              </label>
            </div>

            {paymentMismatch ? (
              <p className="rounded-xl bg-[#fffaf0] px-3 py-2 text-sm text-[#7a5a1f]">
                Card + cash ({formatCurrency(paymentTotal)}) doesn&apos;t match gross sales (
                {formatCurrency(gross)}).
              </p>
            ) : null}

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">Notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2 text-sm"
                placeholder="Weather, events, issues…"
              />
            </label>

            <button
              type="submit"
              className="rounded-full bg-[#e85d8a] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#d44d7a]"
            >
              {saved ? "Saved!" : existing ? "Update EOD report" : "Save EOD report"}
            </button>
          </form>
        </Card>

        <Card title="Recent EOD reports">
          {recent.length === 0 ? (
            <p className="text-sm text-[#8b5a6b]">No reports yet.</p>
          ) : (
            <ul className="divide-y divide-[#faf0f3]">
              {recent.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(r.date)}
                    className="flex w-full items-center justify-between py-3 text-left hover:bg-[#fff8f3]"
                  >
                    <div>
                      <p className="font-medium text-[#3d2a32]">{formatDateKey(r.date, "long")}</p>
                      <p className="text-xs text-[#8b5a6b]">
                        {r.transactionCount} txns · {formatCurrency(netSales(r))} net
                      </p>
                    </div>
                    <span className="text-sm font-medium text-[#e85d8a]">
                      {formatCurrency(r.grossSales)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </ResponsiveGrid>
    </div>
  );
}
