"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { PRODUCT_NAME } from "@/lib/constants";
import { apiFetch } from "@/lib/api/client";

export default function StaffLoginPage() {
  const router = useRouter();
  const [shopName, setShopName] = useState("");
  const [pinConfigured, setPinConfigured] = useState(true);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<{ shopName: string; pinConfigured: boolean }>("/api/staff/employees")
      .then((data) => {
        setShopName(data.shopName);
        setPinConfigured(data.pinConfigured);
      })
      .catch(() => setPinConfigured(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiFetch("/api/auth/staff-login", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), pin }),
      });
      router.replace("/close");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff8f3] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#f0d4dc] bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0f5] text-[#e85d8a]">
            <RefreshCw className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold text-[#3d2a32]">{PRODUCT_NAME}</h1>
          <p className="mt-2 text-sm text-[#8b5a6b]">
            Staff sign in{shopName ? ` · ${shopName}` : ""}
          </p>
        </div>

        {!pinConfigured ? (
          <p className="mb-4 rounded-xl bg-[#fff5f8] px-3 py-2 text-sm text-[#c43d5a]">
            Staff PIN is not set up yet. Ask your manager to set it in the roster.
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">Your name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2.5 text-sm"
              placeholder="e.g. Priya"
              required
              autoComplete="name"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">Staff PIN</span>
            <input
              type="password"
              inputMode="numeric"
              pattern="\d{4,6}"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2.5 text-sm tracking-widest"
              placeholder="From your manager"
              required
              autoComplete="off"
            />
          </label>

          {error ? (
            <p className="rounded-xl bg-[#fff5f8] px-3 py-2 text-sm text-[#c43d5a]">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading || !pinConfigured || !name.trim()}
            className="w-full rounded-full bg-[#e85d8a] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#d44d7a] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Continue to closing form"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#8b5a6b]">
          <Link href="/" className="underline-offset-2 hover:text-[#e85d8a] hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
