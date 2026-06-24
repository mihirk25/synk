import type { Section } from "@/lib/types";
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { ScrollRow } from "./ScrollRow";

const allTabs: { id: Section; label: string; icon: typeof LayoutDashboard; staff?: boolean }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "labor", label: "Labour Cost", icon: Users },
  { id: "roster", label: "Roster", icon: CalendarDays },
  { id: "eod", label: "Closing Form", icon: ClipboardList, staff: true },
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
  const tabs =
    userRole === "VIEWER" ? allTabs.filter((t) => t.staff) : allTabs;

  return (
    <ScrollRow>
      <nav className="flex w-max min-w-full gap-2 md:w-auto">
        {tabs.map(({ id, label, icon: Icon }) => {
          const selected = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${
                selected
                  ? "bg-[#e85d8a] text-white shadow-sm"
                  : "bg-white text-[#6b4f5a] ring-1 ring-[#f0d4dc] hover:bg-[#fff5f8]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </nav>
    </ScrollRow>
  );
}
