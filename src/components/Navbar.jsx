import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Moon, Sun } from "lucide-react";
import Waveform from "./Waveform";

const LINKS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

const THEME_STORAGE_KEY = "theme";

const INITIAL_NOTIFICATIONS = [
  { id: "welcome", title: "Your AI call agent is ready", detail: "Sign in to start building your first workflow.", time: "Now", unread: true },
  { id: "signal", title: "New voice models available", detail: "Explore the latest voices in your workspace.", time: "5m ago", unread: true },
  { id: "tip", title: "Quick tip", detail: "Try a test call before launching your campaign.", time: "1h ago", unread: true },
];

export default function Navbar() {
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const unreadNotifications = notifications.filter((n) => n.unread).length;
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [isDark, theme]);

  function markAllNotificationsRead() {
    setNotifications((cur) => cur.map((n) => ({ ...n, unread: false })));
  }

  function markNotificationRead(id) {
    setNotifications((cur) => cur.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border-soft bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
            <Waveform size="sm" color="white" />
          </span>
          <span className="font-display text-[17px] font-semibold text-ink">
            AI Call Agent
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-ink-soft transition-all hover:border-accent hover:bg-accent-dim hover:text-accent"
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            aria-pressed={isDark}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((c) => !c)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-ink-soft transition-all hover:border-accent hover:bg-accent-dim hover:text-accent"
              aria-label={`Notifications${unreadNotifications ? ` (${unreadNotifications} unread)` : ""}`}
              aria-expanded={notificationsOpen}
              aria-haspopup="dialog"
            >
              <Bell size={17} />
              {unreadNotifications > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-warn px-1 text-[9px] font-bold text-white shadow-sm">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div
                role="dialog"
                aria-label="Notifications"
                className="absolute right-0 top-12 z-40 w-80 overflow-hidden rounded-2xl border border-border bg-surface shadow-(--shadow-card)"
              >
                <div className="flex items-center justify-between border-b border-border-soft px-4 py-3">
                  <p className="text-sm font-semibold text-ink">Notifications</p>
                  {unreadNotifications > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="text-xs font-medium text-accent hover:text-accent-hover"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto p-1.5">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => markNotificationRead(n.id)}
                      className="flex w-full gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-surface-sunk"
                    >
                      <span className={`mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-accent ${n.unread ? "opacity-100" : "opacity-0"}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-ink">{n.title}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">{n.detail}</span>
                      </span>
                      <span className="shrink-0 pt-0.5 text-xs text-ink-muted">{n.time}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link to="/login" className="hidden text-sm font-medium text-ink-soft hover:text-ink sm:block">
            Sign in
          </Link>
          <Link
            to="/signup"
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-(--shadow-pop) transition-colors hover:bg-accent-hover"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}