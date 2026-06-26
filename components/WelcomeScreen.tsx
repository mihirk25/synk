"use client";

import Link from "next/link";
import { RefreshCw, UserCog, Users } from "lucide-react";
import { PRODUCT_NAME } from "@/lib/constants";

export function WelcomeScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff8f3] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#6366f1]">
            <RefreshCw className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-semibold text-[#3d2a32]">{PRODUCT_NAME}</h1>
          <p className="mt-2 text-sm text-[#8b5a6b]">Ice cream shop manager</p>
        </div>

        <div className="space-y-3">
          <Link
            href="/staff"
            className="flex w-full items-center gap-4 rounded-2xl border border-[#f0d4dc] bg-white p-5 shadow-sm transition hover:border-[#e85d8a] hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#fff0f5] text-[#e85d8a]">
              <Users className="h-6 w-6" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-[#3d2a32]">Staff</p>
              <p className="text-sm text-[#8b5a6b]">Sign in with your name and PIN to fill the closing form</p>
            </div>
          </Link>

          <Link
            href="/login"
            className="flex w-full items-center gap-4 rounded-2xl border border-[#f0d4dc] bg-white p-5 shadow-sm transition hover:border-[#6366f1] hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eef2ff] text-[#6366f1]">
              <UserCog className="h-6 w-6" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-[#3d2a32]">Manager</p>
              <p className="text-sm text-[#8b5a6b]">
                Sign in, or create a shop account if it&apos;s your first time
              </p>
            </div>
          </Link>
        </div>

        <p className="mt-4 text-center text-sm text-[#8b5a6b]">
          New manager?{" "}
          <Link href="/signup" className="font-medium text-[#6366f1] hover:underline">
            Create your shop account
          </Link>
        </p>
      </div>
    </div>
  );
}
