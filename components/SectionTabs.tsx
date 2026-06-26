import type { Section } from "@/lib/types";
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Users,
} from "lucide-react";

const allTabs: {
  id: Section;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
  staff?: boolean;
}[] = [
  { id: "dashboard", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard },
  { id: "labor", label: "Labour Cost", shortLabel: "Labour", icon: Users },
  { id: "roster", label: "Roster", shortLabel: "Roster", icon: CalendarDays },
  { id: "eod", label: "Closing Form", shortLabel: "Closing", icon: ClipboardList, staff: true },
];

export function SectionTabs({
  active,
  onChange,
  userRole = "MANAGER",
}: {
  active: Section;
  onChange: (s: Section) => void;
  userRole?: "OWNER" | "MANAGER" | "VIEWER";
}) {
  const tabs = userRole === "VIEWER" ? allTabs.filter((t) => t.staff) : allTabs;

  return (
    <nav
      className={
        tabs.length === 1
          ? "flex"
          : "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2"
      }
    >
      {tabs.map(({ id, label, shortLabel, icon: Icon }) => {
        const selected = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-medium transition sm:justify-start sm:px-4 ${
              selected
                ? "bg-[#e85d8a] text-white shadow-sm"
                : "bg-white text-[#6b4f5a] ring-1 ring-[#f0d4dc] hover:bg-[#fff5f8]"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="sm:hidden">{shortLabel}</span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
