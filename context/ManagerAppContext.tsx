"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type {
  AppState,
  CashCount,
  DayKey,
  EODReport,
  Employee,
  RosterWeek,
  Section,
} from "@/lib/types";
import { createSeedState } from "@/lib/seedData";
import { ensureRosterWeek, getRosterForWeek } from "@/lib/roster";
import { getMondayOfWeek, todayKey } from "@/lib/dates";
import { apiFetch, ApiError } from "@/lib/api/client";

type ManagerContextValue = {
  state: AppState;
  shopName: string;
  userEmail: string;
  section: Section;
  setSection: (s: Section) => void;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  weekStart: string;
  setWeekStart: (w: string) => void;
  currentRoster: RosterWeek;
  loading: boolean;
  error: string | null;
  addShiftLog: (employeeId: string, hours: number, notes?: string) => Promise<void>;
  removeShiftLog: (id: string) => Promise<void>;
  saveEOD: (report: Omit<EODReport, "id"> & { id?: string }) => Promise<void>;
  saveCashCount: (count: Omit<CashCount, "id"> & { id?: string }) => Promise<void>;
  saveRosterSlot: (
    day: DayKey,
    slotIndex: number,
    data: { employeeId: string | null; start: string; end: string },
  ) => Promise<void>;
  publishRoster: () => Promise<void>;
  unpublishRoster: () => Promise<void>;
  logout: () => Promise<void>;
  getEmployee: (id: string) => Employee | undefined;
};

const ManagerAppContext = createContext<ManagerContextValue | null>(null);

function upsertRosterWeek(weeks: RosterWeek[], week: RosterWeek): RosterWeek[] {
  const idx = weeks.findIndex((w) => w.weekStart === week.weekStart);
  if (idx === -1) return [...weeks, week];
  const next = [...weeks];
  next[idx] = week;
  return next;
}

export function ManagerAppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AppState>(createSeedState);
  const [shopName, setShopName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<Section>("dashboard");
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [weekStart, setWeekStart] = useState(getMondayOfWeek());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [me, app] = await Promise.all([
          apiFetch<{ user: { email: string } }>("/api/auth/me"),
          apiFetch<{ state: AppState; shopName: string }>("/api/app-state"),
        ]);
        if (cancelled) return;
        setState(app.state);
        setShopName(app.shopName);
        setUserEmail(me.user.email);
        setSelectedDate(todayKey());
        setWeekStart(getMondayOfWeek());
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentRoster = useMemo(() => {
    return ensureRosterWeek(state, weekStart);
  }, [state, weekStart]);

  const applyRoster = useCallback((roster: RosterWeek) => {
    setState((prev) => ({
      ...prev,
      rosterWeeks: upsertRosterWeek(prev.rosterWeeks, roster),
    }));
  }, []);

  const addShiftLog = useCallback(
    async (employeeId: string, hours: number, notes?: string) => {
      const { log } = await apiFetch<{ log: AppState["shiftLogs"][0] }>("/api/shift-logs", {
        method: "POST",
        body: JSON.stringify({ date: selectedDate, employeeId, hours, notes }),
      });
      setState((prev) => ({ ...prev, shiftLogs: [...prev.shiftLogs, log] }));
    },
    [selectedDate],
  );

  const removeShiftLog = useCallback(async (id: string) => {
    await apiFetch(`/api/shift-logs/${id}`, { method: "DELETE" });
    setState((prev) => ({
      ...prev,
      shiftLogs: prev.shiftLogs.filter((l) => l.id !== id),
    }));
  }, []);

  const saveEOD = useCallback(async (report: Omit<EODReport, "id"> & { id?: string }) => {
    const { report: saved } = await apiFetch<{ report: EODReport }>("/api/eod-reports", {
      method: "POST",
      body: JSON.stringify({
        date: report.date,
        grossSales: report.grossSales,
        cardSales: report.cardSales,
        cashSales: report.cashSales,
        refunds: report.refunds,
        transactionCount: report.transactionCount,
        notes: report.notes,
      }),
    });
    setState((prev) => {
      const filtered = prev.eodReports.filter((r) => r.date !== saved.date);
      return { ...prev, eodReports: [...filtered, saved] };
    });
  }, []);

  const saveCashCount = useCallback(async (count: Omit<CashCount, "id"> & { id?: string }) => {
    const { count: saved } = await apiFetch<{ count: CashCount }>("/api/cash-counts", {
      method: "POST",
      body: JSON.stringify({
        date: count.date,
        openingFloat: count.openingFloat,
        countedCash: count.countedCash,
        notes: count.notes,
      }),
    });
    setState((prev) => {
      const filtered = prev.cashCounts.filter((c) => c.date !== saved.date);
      return { ...prev, cashCounts: [...filtered, saved] };
    });
  }, []);

  const saveRosterSlot = useCallback(
    async (
      day: DayKey,
      slotIndex: number,
      data: { employeeId: string | null; start: string; end: string },
    ) => {
      const { roster } = await apiFetch<{ roster: RosterWeek }>(
        `/api/roster/${weekStart}/slot`,
        {
          method: "PATCH",
          body: JSON.stringify({ day, slotIndex, ...data }),
        },
      );
      applyRoster(roster);
    },
    [weekStart, applyRoster],
  );

  const publishRoster = useCallback(async () => {
    const { roster } = await apiFetch<{ roster: RosterWeek }>(
      `/api/roster/${weekStart}/publish`,
      { method: "POST" },
    );
    applyRoster(roster);
  }, [weekStart, applyRoster]);

  const unpublishRoster = useCallback(async () => {
    const { roster } = await apiFetch<{ roster: RosterWeek }>(
      `/api/roster/${weekStart}/publish`,
      { method: "DELETE" },
    );
    applyRoster(roster);
  }, [weekStart, applyRoster]);

  const logout = useCallback(async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }, [router]);

  const getEmployee = useCallback(
    (id: string) => state.employees.find((e) => e.id === id),
    [state.employees],
  );

  const value = useMemo(
    () => ({
      state,
      shopName,
      userEmail,
      section,
      setSection,
      selectedDate,
      setSelectedDate,
      weekStart,
      setWeekStart,
      currentRoster: getRosterForWeek(state, weekStart) ?? currentRoster,
      loading,
      error,
      addShiftLog,
      removeShiftLog,
      saveEOD,
      saveCashCount,
      saveRosterSlot,
      publishRoster,
      unpublishRoster,
      logout,
      getEmployee,
    }),
    [
      state,
      shopName,
      userEmail,
      section,
      selectedDate,
      weekStart,
      currentRoster,
      loading,
      error,
      addShiftLog,
      removeShiftLog,
      saveEOD,
      saveCashCount,
      saveRosterSlot,
      publishRoster,
      unpublishRoster,
      logout,
      getEmployee,
    ],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff8f3]">
        <p className="text-sm text-[#8b5a6b]">Loading Synk…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff8f3] px-4">
        <div className="max-w-md rounded-2xl border border-[#f5b8c8] bg-white p-6 text-center">
          <p className="font-medium text-[#3d2a32]">Could not load dashboard</p>
          <p className="mt-2 text-sm text-[#8b5a6b]">{error}</p>
          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="mt-4 rounded-full bg-[#e85d8a] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#d44d7a]"
          >
            Sign in again
          </button>
        </div>
      </div>
    );
  }

  return <ManagerAppContext.Provider value={value}>{children}</ManagerAppContext.Provider>;
}

export function useManagerApp() {
  const ctx = useContext(ManagerAppContext);
  if (!ctx) throw new Error("useManagerApp must be used within ManagerAppProvider");
  return ctx;
}
