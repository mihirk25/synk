import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const tones = {
    neutral: "border-[#f0d4dc] bg-white text-[#3d2a32]",
    good: "border-[#b8e6c8] bg-[#f3fff7] text-[#1f5a34]",
    warn: "border-[#f5d9a8] bg-[#fffaf0] text-[#7a5a1f]",
    bad: "border-[#f5b8c8] bg-[#fff5f8] text-[#8b2340]",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tones[tone]}`}>
      <p className="text-sm font-medium opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-2 text-xs opacity-70">{hint}</p> : null}
    </div>
  );
}

export function Card({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#f0d4dc] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#3d2a32]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
