"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { PRODUCT_NAME } from "@/lib/constants";
import { apiFetch } from "@/lib/api/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("manager@synk.app");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff8f3] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#f0d4dc] bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#6366f1]">
            <RefreshCw className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold text-[#3d2a32]">{PRODUCT_NAME}</h1>
          <p className="mt-2 text-sm text-[#8b5a6b]">Manager sign in</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              required
              autoComplete="current-password"
            />
          </label>

          {error ? (
            <p className="rounded-xl bg-[#fff5f8] px-3 py-2 text-sm text-[#c43d5a]">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#e85d8a] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#d44d7a] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#8b5a6b]">
          <a href="/" className="underline-offset-2 hover:text-[#e85d8a] hover:underline">
            Back to home
          </a>
        </p>
      </div>
    </div>
  );
}
