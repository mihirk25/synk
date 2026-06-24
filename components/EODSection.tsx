"use client";

import { useEffect, useMemo, useState } from "react";
import { useManagerApp } from "@/context/ManagerAppContext";
import {
  cashDifference,
  closingTotal,
  DENOMINATIONS,
  denomTotal,
  EMPTY_DENOM_COUNTS,
  type DenomCounts,
} from "@/lib/eodClosing";
import { formatDateKey, todayKey } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { getEODForDate } from "@/lib/eodStats";
import { ApiError } from "@/lib/api/client";

const LEFT_DENOMS = DENOMINATIONS.slice(0, 5);
const RIGHT_DENOMS = DENOMINATIONS.slice(5);

function FieldRow({
  label,
  value,
  onChange,
  readOnly,
  highlight,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#e8d4dc] py-2.5">
      <span className="text-sm font-medium text-[#3d2a32]">{label}</span>
      {readOnly ? (
        <span
          className={`min-w-[5.5rem] text-right text-sm font-semibold ${
            highlight ? "text-[#c43d5a]" : "text-[#3d2a32]"
          }`}
        >
          {value}
        </span>
      ) : (
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-28 rounded-lg border border-[#f0d4dc] px-2 py-1.5 text-right text-sm"
        />
      )}
    </div>
  );
}

export function EODSection() {
  const { state, selectedDate, setSelectedDate, saveEOD, userName } = useManagerApp();
  const existing = getEODForDate(state, selectedDate);
  const dateLabel = formatDateKey(selectedDate, "calendar");

  const [tillCash, setTillCash] = useState("");
  const [reportCash, setReportCash] = useState("");
  const [eftpos, setEftpos] = useState("");
  const [expensesAmount, setExpensesAmount] = useState("0");
  const [floatTarget, setFloatTarget] = useState("1100");
  const [denomCounts, setDenomCounts] = useState<DenomCounts>({ ...EMPTY_DENOM_COUNTS });
  const [expenseNotes, setExpenseNotes] = useState("");
  const [urgentStock, setUrgentStock] = useState("");
  const [staffSignature, setStaffSignature] = useState("");
  const [saved, setSaved] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setTillCash(String(existing.tillCash));
      setReportCash(String(existing.cashSales));
      setEftpos(String(existing.cardSales));
      setExpensesAmount(String(existing.expensesAmount));
      setFloatTarget(String(existing.floatTarget));
      setDenomCounts({ ...EMPTY_DENOM_COUNTS, ...existing.denomCounts });
      setExpenseNotes(existing.expenseNotes ?? "");
      setUrgentStock(existing.urgentStock ?? "");
      setStaffSignature(existing.staffSignature ?? "");
    } else {
      setTillCash("");
      setReportCash("");
      setEftpos("");
      setExpensesAmount("0");
      setFloatTarget("1100");
      setDenomCounts({ ...EMPTY_DENOM_COUNTS });
      setExpenseNotes("");
      setUrgentStock("");
      setStaffSignature(userName ?? "");
    }
  }, [existing, selectedDate, userName]);

  const till = parseFloat(tillCash) || 0;
  const report = parseFloat(reportCash) || 0;
  const card = parseFloat(eftpos) || 0;
  const expenses = parseFloat(expensesAmount) || 0;
  const difference = cashDifference(till, report);
  const total = closingTotal(report, card);
  const floatCounted = denomTotal(denomCounts);
  const floatTargetNum = parseFloat(floatTarget) || 0;

  const canSubmit = till > 0 && report >= 0 && card >= 0 && staffSignature.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitError(null);
    try {
      await saveEOD({
        id: existing?.id,
        date: selectedDate,
        tillCash: till,
        cashSales: report,
        cardSales: card,
        expensesAmount: expenses,
        floatTarget: floatTargetNum,
        denomCounts,
        expenseNotes: expenseNotes.trim() || undefined,
        urgentStock: urgentStock.trim() || undefined,
        staffSignature: staffSignature.trim(),
        grossSales: total,
        refunds: 0,
        transactionCount: 0,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : "Could not save closing form. Please try again.",
      );
    }
  }

  function setDenom(key: keyof DenomCounts, count: string) {
    const n = Math.max(0, parseInt(count, 10) || 0);
    setDenomCounts((prev) => ({ ...prev, [key]: n }));
  }

  const recent = useMemo(
    () => [...state.eodReports].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [state.eodReports],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#3d2a32]">Closing form</h2>
          <p className="text-sm text-[#8b5a6b]">End-of-day report for staff — matches your paper form</p>
        </div>
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

      <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border-2 border-[#3d2a32] bg-white shadow-sm">
        <div className="border-b-2 border-[#3d2a32] bg-[#fff8f3] px-5 py-4 text-center">
          <h3 className="text-lg font-bold tracking-wide text-[#3d2a32]">Cups n Cones Closing Form</h3>
          <p className="mt-2 text-sm text-[#6b4f5a]">
            <strong>Date:</strong> {dateLabel}
          </p>
        </div>

        <div className="grid gap-0 lg:grid-cols-2">
          <div className="border-b border-[#e8d4dc] p-5 lg:border-b-0 lg:border-r">
            <FieldRow label="Till/Cash" value={tillCash} onChange={setTillCash} />
            <FieldRow label="Report/Cash" value={reportCash} onChange={setReportCash} />
            <FieldRow
              label="Difference"
              value={formatCurrency(difference)}
              readOnly
              highlight={Math.abs(difference) > 5}
            />
            <FieldRow label="Eftpos" value={eftpos} onChange={setEftpos} />
            <FieldRow label="Expenses" value={expensesAmount} onChange={setExpensesAmount} />
            <FieldRow label="Total" value={formatCurrency(total)} readOnly />
          </div>

          <div className="p-5">
            <div className="mb-3 flex items-center justify-between border-b border-[#e8d4dc] pb-2">
              <span className="text-sm font-medium text-[#3d2a32]">Float</span>
              <input
                type="number"
                min="0"
                step="1"
                value={floatTarget}
                onChange={(e) => setFloatTarget(e.target.value)}
                className="w-24 rounded-lg border border-[#f0d4dc] px-2 py-1 text-right text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-x-6">
              <div className="space-y-2">
                {LEFT_DENOMS.map((d) => (
                  <div key={d.key} className="flex items-center justify-between gap-2">
                    <span className="w-8 text-sm text-[#6b4f5a]">{d.label}</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={denomCounts[d.key] || ""}
                      onChange={(e) => setDenom(d.key, e.target.value)}
                      className="w-16 rounded border border-[#f0d4dc] px-2 py-1 text-right text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {RIGHT_DENOMS.map((d) => (
                  <div key={d.key} className="flex items-center justify-between gap-2">
                    <span className="w-10 text-sm text-[#6b4f5a]">{d.label}</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={denomCounts[d.key] || ""}
                      onChange={(e) => setDenom(d.key, e.target.value)}
                      className="w-16 rounded border border-[#f0d4dc] px-2 py-1 text-right text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[#e8d4dc] pt-3">
              <span className="text-sm font-semibold text-[#3d2a32]">Total</span>
              <span className="text-sm font-semibold text-[#3d2a32]">{formatCurrency(floatCounted)}</span>
            </div>
            {floatTargetNum > 0 && Math.abs(floatCounted - floatTargetNum) > 1 ? (
              <p className="mt-2 text-xs text-[#c43d5a]">
                Float count ({formatCurrency(floatCounted)}) differs from target (
                {formatCurrency(floatTargetNum)})
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 border-t border-[#e8d4dc] p-5 lg:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[#3d2a32]">Expenses</span>
            <textarea
              value={expenseNotes}
              onChange={(e) => setExpenseNotes(e.target.value)}
              rows={4}
              placeholder="List any cash expenses paid from the till…"
              className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[#3d2a32]">Urgent Stock</span>
            <textarea
              value={urgentStock}
              onChange={(e) => setUrgentStock(e.target.value)}
              rows={4}
              placeholder="Items to order urgently…"
              className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4 border-t border-[#e8d4dc] bg-[#fff8f3] px-5 py-4">
          <label className="block min-w-[12rem] flex-1">
            <span className="mb-1 block text-sm font-semibold text-[#3d2a32]">Staff signature</span>
            <input
              type="text"
              required
              value={staffSignature}
              onChange={(e) => setStaffSignature(e.target.value)}
              placeholder="Your name"
              className="w-full max-w-xs rounded-xl border border-[#f0d4dc] bg-white px-3 py-2 text-sm"
            />
          </label>
          <div className="flex flex-col items-end gap-2">
            {submitError ? (
              <p className="text-xs text-[#c43d5a]">{submitError}</p>
            ) : null}
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-full bg-[#e85d8a] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#d44d7a] disabled:opacity-50"
            >
              {saved ? "Saved!" : existing ? "Update closing form" : "Submit closing form"}
            </button>
          </div>
        </div>
      </form>

      {recent.length > 0 ? (
        <div className="rounded-2xl border border-[#f0d4dc] bg-white p-5">
          <h4 className="mb-3 text-sm font-semibold text-[#3d2a32]">Recent closing forms</h4>
          <ul className="divide-y divide-[#faf0f3]">
            {recent.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setSelectedDate(r.date)}
                  className="flex w-full items-center justify-between py-2.5 text-left hover:bg-[#fff8f3]"
                >
                  <span className="text-sm font-medium text-[#3d2a32]">
                    {formatDateKey(r.date, "long")}
                    {r.staffSignature ? ` · ${r.staffSignature}` : ""}
                  </span>
                  <span className="text-sm text-[#8b5a6b]">{formatCurrency(r.grossSales)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
