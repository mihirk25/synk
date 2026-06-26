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
import type { AvailabilityKey } from "@/lib/availability";
import { createSeedState } from "@/lib/seedData";
import { ensureRosterWeek, getRosterForWeek } from "@/lib/roster";
import { getMondayOfWeek, parseDateKey, todayKey, toDateKey } from "@/lib/dates";
import { apiFetch, ApiError } from "@/lib/api/client";

type UserRole = "OWNER" | "MANAGER" | "VIEWER";

type ManagerContextValue = {
  state: AppState;
  shopName: string;
  userEmail: string;
  userName: string;
  userRole: UserRole;
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
  addEmployee: (data: {
    name: string;
    hourlyRate: number;
    saturdayRate: number;
    sundayRate: number;
    publicHolidayRate: number;
    availability: AvailabilityKey[];
  }) => Promise<void>;
  staffPinConfigured: boolean;
  setStaffPin: (pin: string) => Promise<void>;
  addRosterSlotRow: () => Promise<void>;
  copyRosterFromPreviousWeek: () => Promise<{ copied: boolean; message: string }>;
  saveRosterSlot: (
    day: DayKey,
    slotIndex: number,
    data: { employeeId: string | null; start: string; end: string },
  ) => Promise<void>;
  publishRoster: () => Promise<void>;
  unpublishRoster: () => Promise<void>;
  logout: () => void;
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

export function ManagerAppProvider({
  children,
  authRedirect = "/login",
  logoutRedirect = "/",
  staffSession = false,
  managerSession = false,
}: {
  children: ReactNode;
  authRedirect?: string;
  logoutRedirect?: string;
  staffSession?: boolean;
  managerSession?: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<AppState>(createSeedState);
  const [shopName, setShopName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<UserRole>("MANAGER");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<Section>("dashboard");
  const [selectedDate, setSelectedDateState] = useState(todayKey());
  const [weekStart, setWeekStartState] = useState(getMondayOfWeek());
  const [staffPinConfigured, setStaffPinConfigured] = useState(false);

  const setSelectedDate = useCallback((date: string) => {
    setSelectedDateState(date);
    setWeekStartState(getMondayOfWeek(parseDateKey(date)));
  }, []);

  const setWeekStart = useCallback((start: string) => {
    setWeekStartState(start);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [me, app] = await Promise.all([
          apiFetch<{
            user: {
              email: string | null;
              name: string | null;
              role: UserRole;
              isStaffPin?: boolean;
            };
          }>("/api/auth/me"),
          apiFetch<{ state: AppState; shopName: string; staffPinConfigured?: boolean }>(
            "/api/app-state",
          ),
        ]);
        if (cancelled) return;

        if (managerSession && me.user.isStaffPin) {
          router.replace("/close");
          return;
        }
        if (staffSession && !me.user.isStaffPin) {
          router.replace("/dashboard");
          return;
        }

        setState(app.state);
        setShopName(app.shopName);
        setStaffPinConfigured(Boolean(app.staffPinConfigured));
        setUserEmail(me.user.email ?? "");
        setUserName(me.user.name ?? "");
        setUserRole(me.user.role);
        setSection(me.user.role === "VIEWER" || me.user.isStaffPin ? "eod" : "dashboard");
        setSelectedDate(todayKey());
        setWeekStartState(getMondayOfWeek());
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
          router.replace(authRedirect);
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
  }, [authRedirect, managerSession, router, staffSession]);

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

  const handleAuthError = useCallback(
    async (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        router.replace(authRedirect);
        return true;
      }
      return false;
    },
    [authRedirect, router],
  );

  const saveEOD = useCallback(
    async (report: Omit<EODReport, "id"> & { id?: string }) => {
      try {
        const { report: saved } = await apiFetch<{ report: EODReport }>("/api/eod-reports", {
          method: "POST",
          body: JSON.stringify({
            date: report.date,
            tillCash: report.tillCash,
            reportCash: report.cashSales,
            eftpos: report.cardSales,
            expensesAmount: report.expensesAmount,
            expenseNotes: report.expenseNotes,
            urgentStock: report.urgentStock,
            staffSignature: report.staffSignature ?? "",
            floatTarget: report.floatTarget,
            denomCounts: report.denomCounts,
          }),
        });
        setState((prev) => {
          const filtered = prev.eodReports.filter((r) => r.date !== saved.date);
          return { ...prev, eodReports: [...filtered, saved] };
        });
      } catch (err) {
        if (await handleAuthError(err)) return;
        throw err;
      }
    },
    [handleAuthError],
  );

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

  const addEmployee = useCallback(
    async (data: {
      name: string;
      hourlyRate: number;
      saturdayRate: number;
      sundayRate: number;
      publicHolidayRate: number;
      availability: AvailabilityKey[];
    }) => {
      const { employee } = await apiFetch<{ employee: Employee }>("/api/employees", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setState((prev) => ({
        ...prev,
        employees: [...prev.employees, employee].sort((a, b) => a.name.localeCompare(b.name)),
      }));
    },
    [],
  );

  const setStaffPin = useCallback(async (pin: string) => {
    await apiFetch("/api/shop/staff-pin", {
      method: "PATCH",
      body: JSON.stringify({ pin }),
    });
    setStaffPinConfigured(true);
  }, []);

  const addRosterSlotRow = useCallback(async () => {
    const { roster } = await apiFetch<{ roster: RosterWeek }>(
      `/api/roster/${weekStart}/add-slot`,
      { method: "POST" },
    );
    applyRoster(roster);
  }, [weekStart, applyRoster]);

  const copyRosterFromPreviousWeek = useCallback(async () => {
    const prevMonday = parseDateKey(weekStart);
    prevMonday.setDate(prevMonday.getDate() - 7);
    const sourceWeekStart = toDateKey(prevMonday);
    const localSource = getRosterForWeek(state, sourceWeekStart);

    const { roster, copied, message } = await apiFetch<{
      roster: RosterWeek;
      copied: boolean;
      message: string;
    }>(`/api/roster/${weekStart}/copy-from-previous`, {
      method: "POST",
      body: JSON.stringify(
        localSource
          ? { localSource: { slotsPerDay: localSource.slotsPerDay, slots: localSource.slots } }
          : {},
      ),
    });
    applyRoster(roster);
    return { copied, message };
  }, [weekStart, state, applyRoster]);

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

  const logout = useCallback(() => {
    void fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    router.replace(logoutRedirect);
  }, [logoutRedirect, router]);

  const getEmployee = useCallback(
    (id: string) => state.employees.find((e) => e.id === id),
    [state.employees],
  );

  const value = useMemo(
    () => ({
      state,
      shopName,
      userEmail,
      userName,
      userRole,
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
      addEmployee,
      staffPinConfigured,
      setStaffPin,
      addRosterSlotRow,
      copyRosterFromPreviousWeek,
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
      userName,
      userRole,
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
      addEmployee,
      staffPinConfigured,
      setStaffPin,
      addRosterSlotRow,
      copyRosterFromPreviousWeek,
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
            onClick={() => router.replace(authRedirect)}
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
