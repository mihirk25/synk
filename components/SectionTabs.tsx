import type { Section } from "@/lib/types";
import {
  Banknote,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { ScrollRow } from "./ScrollRow";

const tabs: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "labor", label: "Labour Cost", icon: Users },
  { id: "roster", label: "Roster", icon: CalendarDays },
  { id: "eod", label: "EOD Sales", icon: ClipboardList },
  { id: "cash", label: "Cash Count", icon: Banknote },
];

export function SectionTabs({
  active,
  onChange,
}: {
  active: Section;
  onChange: (s: Section) => void;
}) {
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
