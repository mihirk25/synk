const PALETTE = [
  { bg: "#fff0f5", border: "#e85d8a", text: "#8b2340", bar: "#e85d8a" },
  { bg: "#eef2ff", border: "#6366f1", text: "#312e81", bar: "#6366f1" },
  { bg: "#ecfdf5", border: "#10b981", text: "#065f46", bar: "#10b981" },
  { bg: "#fff7ed", border: "#f97316", text: "#9a3412", bar: "#f97316" },
  { bg: "#f0fdfa", border: "#14b8a6", text: "#115e59", bar: "#14b8a6" },
  { bg: "#fdf4ff", border: "#d946ef", text: "#86198f", bar: "#d946ef" },
  { bg: "#fefce8", border: "#eab308", text: "#854d0e", bar: "#eab308" },
  { bg: "#f0f9ff", border: "#0ea5e9", text: "#075985", bar: "#0ea5e9" },
  { bg: "#faf5ff", border: "#a855f7", text: "#6b21a8", bar: "#a855f7" },
  { bg: "#fff1f2", border: "#f43f5e", text: "#9f1239", bar: "#f43f5e" },
  { bg: "#f7fee7", border: "#84cc16", text: "#3f6212", bar: "#84cc16" },
  { bg: "#fffbeb", border: "#f59e0b", text: "#92400e", bar: "#f59e0b" },
  { bg: "#ecfeff", border: "#06b6d4", text: "#155e75", bar: "#06b6d4" },
  { bg: "#fef2f2", border: "#ef4444", text: "#991b1b", bar: "#ef4444" },
  { bg: "#f5f3ff", border: "#8b5cf6", text: "#5b21b6", bar: "#8b5cf6" },
  { bg: "#fff7ed", border: "#ea580c", text: "#7c2d12", bar: "#ea580c" },
  { bg: "#f0fdf4", border: "#22c55e", text: "#14532d", bar: "#22c55e" },
  { bg: "#eff6ff", border: "#3b82f6", text: "#1e3a8a", bar: "#3b82f6" },
  { bg: "#fdf2f8", border: "#ec4899", text: "#9d174d", bar: "#ec4899" },
  { bg: "#f8fafc", border: "#64748b", text: "#1e293b", bar: "#64748b" },
  { bg: "#fefce8", border: "#ca8a04", text: "#713f12", bar: "#ca8a04" },
  { bg: "#ecfccb", border: "#65a30d", text: "#365314", bar: "#65a30d" },
  { bg: "#e0e7ff", border: "#4f46e5", text: "#312e81", bar: "#4f46e5" },
  { bg: "#ffe4e6", border: "#fb7185", text: "#9f1239", bar: "#fb7185" },
  { bg: "#ccfbf1", border: "#2dd4bf", text: "#134e4a", bar: "#2dd4bf" },
  { bg: "#fce7f3", border: "#f472b6", text: "#831843", bar: "#f472b6" },
  { bg: "#dbeafe", border: "#2563eb", text: "#1e40af", bar: "#2563eb" },
  { bg: "#ffedd5", border: "#fb923c", text: "#7c2d12", bar: "#fb923c" },
  { bg: "#d1fae5", border: "#059669", text: "#064e3b", bar: "#059669" },
  { bg: "#ede9fe", border: "#7c3aed", text: "#4c1d95", bar: "#7c3aed" },
] as const;

export type EmployeeColor = (typeof PALETTE)[number];

/** Assign a stable unique color per staff member based on list order. */
export function employeeColor(
  employeeId: string,
  employees: ReadonlyArray<{ id: string }>,
): EmployeeColor {
  const index = employees.findIndex((e) => e.id === employeeId);
  if (index >= 0) return PALETTE[index % PALETTE.length]!;
  let h = 0;
  for (let i = 0; i < employeeId.length; i++) h = (h * 31 + employeeId.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length]!;
}
