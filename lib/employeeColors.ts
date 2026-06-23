const SLOT_STYLES = [
  { box: "border-[#e85d8a] bg-[#fff0f5]", name: "text-[#8b2340]", time: "text-[#a85573]", dot: "bg-[#e85d8a]" },
  { box: "border-[#6366f1] bg-[#eef2ff]", name: "text-[#3730a3]", time: "text-[#4f46e5]", dot: "bg-[#6366f1]" },
  { box: "border-[#0d9488] bg-[#f0fdfa]", name: "text-[#115e59]", time: "text-[#0f766e]", dot: "bg-[#0d9488]" },
  { box: "border-[#d97706] bg-[#fffbeb]", name: "text-[#92400e]", time: "text-[#b45309]", dot: "bg-[#d97706]" },
  { box: "border-[#7c3aed] bg-[#f5f3ff]", name: "text-[#5b21b6]", time: "text-[#6d28d9]", dot: "bg-[#7c3aed]" },
  { box: "border-[#0284c7] bg-[#f0f9ff]", name: "text-[#075985]", time: "text-[#0369a1]", dot: "bg-[#0284c7]" },
  { box: "border-[#be185d] bg-[#fdf2f8]", name: "text-[#9d174d]", time: "text-[#be185d]", dot: "bg-[#be185d]" },
  { box: "border-[#4d7c0f] bg-[#f7fee7]", name: "text-[#365314]", time: "text-[#4d7c0f]", dot: "bg-[#4d7c0f]" },
] as const;

export type EmployeeSlotStyle = (typeof SLOT_STYLES)[number];

export function employeeSlotStyle(
  employeeId: string,
  employees: { id: string }[],
): EmployeeSlotStyle {
  const index = employees.findIndex((e) => e.id === employeeId);
  const i = index >= 0 ? index : 0;
  return SLOT_STYLES[i % SLOT_STYLES.length]!;
}
