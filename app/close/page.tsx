"use client";

import { EODSection } from "@/components/EODSection";
import { useManagerApp } from "@/context/ManagerAppContext";
import { PRODUCT_NAME } from "@/lib/constants";
import { formatDateKey, todayKey } from "@/lib/dates";
import { RefreshCw } from "lucide-react";

export default function StaffClosePage() {
  const { shopName, userName, logout } = useManagerApp();

  return (
    <div className="min-h-screen bg-[#fff8f3]">
      <header className="border-b border-[#f0d4dc] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0f5] text-[#e85d8a]">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#3d2a32]">{PRODUCT_NAME}</h1>
              <p className="text-xs text-[#8b5a6b]">
                {shopName}
                {userName ? (
                  <>
                    <span className="text-[#c9a0ad]"> · </span>
                    {userName}
                  </>
                ) : null}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="text-xs font-medium text-[#8b5a6b] underline-offset-2 hover:text-[#e85d8a] hover:underline"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <p className="mb-4 text-sm text-[#8b5a6b]">
          Closing form · {formatDateKey(todayKey(), "long")}
        </p>
        <EODSection />
      </main>
    </div>
  );
}
