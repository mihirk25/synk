"use client";

import { SectionTabs } from "@/components/SectionTabs";
import { DashboardSection } from "@/components/DashboardSection";
import { LaborSection } from "@/components/LaborSection";
import { RosterSection } from "@/components/RosterSection";
import { EODSection } from "@/components/EODSection";
import { CashCountSection } from "@/components/CashCountSection";
import { useManagerApp } from "@/context/ManagerAppContext";
import { PRODUCT_NAME } from "@/lib/constants";
import { formatDateKey, todayKey } from "@/lib/dates";
import { RefreshCw } from "lucide-react";

function ActiveSection() {
  const { section } = useManagerApp();
  switch (section) {
    case "dashboard":
      return <DashboardSection />;
    case "labor":
      return <LaborSection />;
    case "roster":
      return <RosterSection />;
    case "eod":
      return <EODSection />;
    case "cash":
      return <CashCountSection />;
  }
}

export default function Home() {
  const { section, setSection, shopName, userEmail, logout } = useManagerApp();

  return (
    <div className="min-h-screen bg-[#fff8f3]">
      <header className="border-b border-[#f0d4dc] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#6366f1]">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-[#3d2a32]">
                {PRODUCT_NAME}
              </h1>
              <p className="text-sm text-[#8b5a6b]">
                {shopName} · {formatDateKey(todayKey(), "long")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-xs text-[#8b5a6b] sm:inline">{userEmail}</span>
            <button
              type="button"
              onClick={() => logout()}
              className="min-h-0 min-w-0 py-1 text-xs font-medium text-[#8b5a6b] underline-offset-2 hover:text-[#e85d8a] hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <SectionTabs active={section} onChange={setSection} />
        </div>
        <ActiveSection />
      </main>
    </div>
  );
}
