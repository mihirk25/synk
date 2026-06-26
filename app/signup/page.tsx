"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { PRODUCT_NAME } from "@/lib/constants";
import { apiFetch } from "@/lib/api/client";

export default function SignupPage() {
  const router = useRouter();
  const [shopName, setShopName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ shopName, name, email, password }),
      });
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff8f3] px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-[#f0d4dc] bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#6366f1]">
            <RefreshCw className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold text-[#3d2a32]">Create your shop</h1>
          <p className="mt-2 text-sm text-[#8b5a6b]">
            First time? Create your shop account on {PRODUCT_NAME}.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">Shop name</span>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2.5 text-sm"
              placeholder="e.g. Scoops on Main"
              required
              autoComplete="organization"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">Your name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2.5 text-sm"
              placeholder="e.g. Alex"
              required
              autoComplete="name"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2.5 text-sm"
              required
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#6b4f5a]">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[#f0d4dc] px-3 py-2.5 text-sm"
              minLength={6}
              required
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-[#8b5a6b]">At least 6 characters</p>
          </label>

          {error ? (
            <p className="rounded-xl bg-[#fff5f8] px-3 py-2 text-sm text-[#c43d5a]">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#6366f1] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5558e3] disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#8b5a6b]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#e85d8a] hover:underline">
            Sign in
          </Link>
        </p>

        <p className="mt-3 text-center text-xs text-[#8b5a6b]">
          <Link href="/" className="underline-offset-2 hover:text-[#e85d8a] hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
