import { useEffect, useState } from "react";
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
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import Waveform from "./Waveform";
import { getNotifications } from "../services/api";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/dashboard/calls/new", label: "New Call", icon: PhoneOutgoing },
  { to: "/dashboard/contacts", label: "Contacts", icon: Users },
  { to: "/dashboard/calls", label: "Call Logs", icon: History, notificationTypes: ["call_completed", "call_failed"] },
  { to: "/dashboard/templates", label: "Templates", icon: FileText },
  { to: "/dashboard/pathways", label: "Pathways", icon: RouteIcon },
  { to: "/dashboard/knowledge", label: "Knowledge Base", icon: BookOpen },
  { to: "/dashboard/scheduled-calls", label: "Appointments", icon: CalendarClock, notificationTypes: ["call_scheduled"] },
  { to: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone },
];

const FOOTER_ITEMS = [{ to: "/dashboard/help", label: "Help & Support", icon: LifeBuoy }];

function NavItem({ to, label, icon: Icon, count, collapsed }) {
  return (
    <NavLink
      to={to}
      end={to === "/dashboard"}
      title={collapsed ? label : undefined}
      className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-[var(--color-accent-dim)] text-[var(--color-accent-ink)]" : "text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-sunk)]"}`}
    >
      <Icon size={18} strokeWidth={2} className="shrink-0" />
      {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
      {!collapsed && count > 0 && <span className="rounded-full bg-[var(--color-accent-dim)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-accent-ink)]">{count}</span>}
    </NavLink>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    getNotifications().then((data) => setNotifications(Array.isArray(data) ? data : [])).catch(() => setNotifications([]));
  }, []);

  const unreadCountFor = (types) => notifications.filter((notification) => !notification.read && types?.includes(notification.type)).length;

  return (
    <aside className={`hidden shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-6 transition-[width] md:flex ${collapsed ? "w-[76px]" : "w-64"}`}>
      <div className={`flex items-center pb-8 ${collapsed ? "justify-center" : "justify-between px-2"}`}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent)]"><Waveform size="sm" color="white" /></span>
          {!collapsed && <span className="font-[family-name:var(--font-display)] text-[17px] font-semibold text-[var(--color-ink)]">AI Call Agent</span>}
        </div>
        {!collapsed && <button type="button" onClick={() => setCollapsed(true)} className="rounded-lg p-1.5 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunk)] hover:text-[var(--color-ink)]" aria-label="Collapse sidebar"><PanelLeftClose size={16} /></button>}
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => <NavItem key={item.to} {...item} count={unreadCountFor(item.notificationTypes)} collapsed={collapsed} />)}
      </nav>

      <div className="flex flex-col gap-1 border-t border-[var(--color-border-soft)] pt-3">
        {collapsed && <button type="button" onClick={() => setCollapsed(false)} className="mb-1 flex items-center justify-center rounded-xl p-2.5 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunk)] hover:text-[var(--color-ink)]" aria-label="Expand sidebar"><PanelLeftOpen size={18} /></button>}
        {FOOTER_ITEMS.map((item) => <NavItem key={item.to} {...item} collapsed={collapsed} />)}
      </div>
    </aside>
  );
}
