import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  History,
  FileText,
  BookOpen,
  LifeBuoy,
  PhoneOutgoing,
  CalendarClock,
  Megaphone,
  Route as RouteIcon,
} from "lucide-react";
import Waveform from "./Waveform";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/dashboard/calls/new", label: "New Call", icon: PhoneOutgoing },
  { to: "/dashboard/contacts", label: "Contacts", icon: Users },
  { to: "/dashboard/calls", label: "Call Logs", icon: History },
  { to: "/dashboard/templates", label: "Templates", icon: FileText },
  { to: "/dashboard/pathways", label: "Pathways", icon: RouteIcon },
  { to: "/dashboard/knowledge", label: "Knowledge Base", icon: BookOpen },
  { to: "/dashboard/scheduled-calls", label: "Appointments", icon: CalendarClock },
  { to: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone },
];

const FOOTER_ITEMS = [
  { to: "/dashboard/help", label: "Help & Support", icon: LifeBuoy },
];

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      end={to === "/dashboard"}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-[var(--color-accent-dim)] text-[var(--color-accent-ink)]"
            : "text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-sunk)]"
        }`
      }
    >
      <Icon size={18} strokeWidth={2} />
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6 md:flex">
      <div className="flex items-center gap-2.5 px-2 pb-8">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent)]">
          <Waveform size="sm" color="white" />
        </span>
        <span className="font-[family-name:var(--font-display)] text-[17px] font-semibold text-[var(--color-ink)]">
          AI Call Agent
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <div className="flex flex-col gap-1 border-t border-[var(--color-border-soft)] pt-3">
        {FOOTER_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </div>
    </aside>
  );
}
