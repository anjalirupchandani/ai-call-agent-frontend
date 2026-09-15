// components/TopBar.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Search, LogOut, Moon, Sun, UserCog } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const THEME_STORAGE_KEY = "theme";

const INITIAL_NOTIFICATIONS = [
  {
    id: "call-failed",
    title: "Call to Tom Whitcombe failed",
    detail: "The call ended before connecting.",
    time: "2m ago",
    callId: "call_1005",
    unread: true,
  },
  {
    id: "call-live",
    title: "Marcus Bell is on a call",
    detail: "Riley has been connected for 2 minutes.",
    time: "12m ago",
    callId: "call_1007",
    unread: true,
  },
  {
    id: "call-complete",
    title: "Call with Priya Nandakumar completed",
    detail: "The call lasted 1 minute and 58 seconds.",
    time: "1h ago",
    callId: "call_1002",
    unread: true,
  },
];

function initialsFor(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

export default function TopBar({ title, subtitle }) {
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const unreadNotifications = notifications.filter((notification) => notification.unread).length;
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [isDark, theme]);

  function handleSignOut() {
    logout();
    navigate("/login", { replace: true });
  }

  function handleSettings() {
    setOpen(false);
    navigate("/settings");
  }

  function markAllNotificationsRead() {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, unread: false })),
    );
  }

  function openNotification(notification) {
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, unread: false } : item,
      ),
    );
    setNotificationsOpen(false);
    navigate(`/dashboard/calls/${notification.callId}`);
  }

  return (
    <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 px-6 py-4 backdrop-blur md:px-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-[var(--color-ink-muted)]">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2 lg:flex">
          <Search size={16} className="text-[var(--color-ink-muted)]" />
          <input
            placeholder="Search calls, contacts…"
            className="w-48 bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface-sunk)]"
          aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
          aria-pressed={isDark}
          title={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen((current) => !current);
              setOpen(false);
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface-sunk)]"
            aria-label={`Notifications${unreadNotifications ? ` (${unreadNotifications} unread)` : ""}`}
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
          >
            <Bell size={18} />
            {unreadNotifications > 0 && (
              <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[var(--color-warn)]" />
            )}
          </button>

          {notificationsOpen && (
            <div
              role="dialog"
              aria-label="Notifications"
              className="absolute right-0 top-12 z-20 w-80 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border-soft)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Notifications</p>
                {unreadNotifications > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto p-1.5">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => openNotification(notification)}
                    className="flex w-full gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-[var(--color-surface-sunk)]"
                  >
                    <span
                      className={`mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)] ${notification.unread ? "opacity-100" : "opacity-0"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-[var(--color-ink)]">{notification.title}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-[var(--color-ink-muted)]">{notification.detail}</span>
                    </span>
                    <span className="shrink-0 pt-0.5 text-xs text-[var(--color-ink-muted)]">{notification.time}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setOpen((current) => !current);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] py-1.5 pl-1.5 pr-3 transition-colors hover:bg-[var(--color-surface-sunk)]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-accent)] text-xs font-semibold text-white">
              {initialsFor(user?.name)}
            </span>
            <span className="hidden text-sm font-medium text-[var(--color-ink)] sm:inline">
              {user?.name || "Account"}
            </span>
            <ChevronDown size={14} className="text-[var(--color-ink-muted)]" />
          </button>

          {open && (
            <div className="absolute right-0 top-12 z-20 w-52 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-[var(--shadow-card)]">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-[var(--color-ink)]">
                  {user?.name}
                </p>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  {user?.email}
                </p>
              </div>
              <div className="my-1 h-px bg-[var(--color-border-soft)]" />

              {/* ✅ FIX: Use div instead of button to avoid nesting */}
              <div
                onClick={handleSettings}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface-sunk)] cursor-pointer"
              >
                <UserCog size={15} /> Settings
              </div>

              <div
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--color-warn-ink)] transition-colors hover:bg-[var(--color-warn-dim)] cursor-pointer"
              >
                <LogOut size={15} /> Sign out
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
