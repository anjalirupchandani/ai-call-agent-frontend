// components/TopBar.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Search, LogOut, Moon, Sun, UserCog } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/api";

const THEME_STORAGE_KEY = "theme";

const TYPE_LABELS = {
  call_completed: "Call completed",
  call_failed: "Call failed",
  call_scheduled: "Call scheduled",
  call_cancelled: "Call cancelled",
  contact_added: "Contact added",
  template_created: "Template created",
  knowledge_uploaded: "Knowledge uploaded",
  system: "System update",
};

function formatNotificationTime(createdAt) {
  if (!createdAt) return "";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absoluteSeconds = Math.abs(seconds);
  if (absoluteSeconds < 60) return "Now";
  if (absoluteSeconds < 3600) return `${Math.round(absoluteSeconds / 60)}m`;
  if (absoluteSeconds < 86400) return `${Math.round(absoluteSeconds / 3600)}h`;
  return `${Math.round(absoluteSeconds / 86400)}d`;
}

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
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const notificationsRef = useRef(null);
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const unreadNotifications = notifications.filter((notification) => !notification.read).length;
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [isDark, theme]);

  useEffect(() => {
    if (authLoading || !user) {
      setNotifications([]);
      setNotificationsError("");
      setNotificationsLoading(false);
      return;
    }

    let active = true;
    setNotificationsLoading(true);
    setNotificationsError("");

    getNotifications()
      .then((data) => {
        if (active) setNotifications(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setNotificationsError("Unable to load notifications.");
      })
      .finally(() => {
        if (active) setNotificationsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  useEffect(() => {
    if (!notificationsOpen) return undefined;

    function closeOnEscape(event) {
      if (event.key === "Escape") setNotificationsOpen(false);
    }

    function closeOnOutsideClick(event) {
      if (!notificationsRef.current?.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, [notificationsOpen]);

  function handleSignOut() {
    logout();
    navigate("/login", { replace: true });
  }

  function handleSettings() {
    setOpen(false);
    navigate("/settings");
  }

  async function markAllNotificationsRead() {
    if (!unreadNotifications) return;
    try {
      await markAllNotificationsAsRead();
      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    } catch {
      setNotificationsError("Unable to update notifications.");
    }
  }

  async function openNotification(notification) {
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification._id);
        setNotifications((current) =>
          current.map((item) =>
            item._id === notification._id ? { ...item, read: true } : item,
          ),
        );
      } catch {
        setNotificationsError("Unable to update notification status.");
      }
    }

    setNotificationsOpen(false);
    if (notification.link) navigate(notification.link);
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
            aria-label="Search calls and contacts"
            placeholder="Search calls, contacts…"
            className="w-44 bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none"
          />
          <kbd className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[var(--color-ink-muted)]">⌘K</kbd>
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

        <div ref={notificationsRef} className="relative">
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
                <div>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">Notifications</p>
                  <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                    {unreadNotifications ? `${unreadNotifications} unread` : "All caught up"}
                  </p>
                </div>
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
                {notificationsLoading && (
                  <p className="px-3 py-6 text-center text-sm text-[var(--color-ink-muted)]">Loading notifications…</p>
                )}
                {!notificationsLoading && notificationsError && (
                  <p role="alert" className="px-3 py-6 text-center text-sm text-[var(--color-warn-ink)]">{notificationsError}</p>
                )}
                {!notificationsLoading && !notificationsError && !notifications.length && (
                  <p className="px-3 py-6 text-center text-sm text-[var(--color-ink-muted)]">No notifications yet.</p>
                )}
                {!notificationsLoading && !notificationsError && notifications.map((notification) => (
                  <button
                    key={notification._id}
                    type="button"
                    onClick={() => openNotification(notification)}
                    className="flex w-full gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-[var(--color-surface-sunk)]"
                  >
                    <span
                      className={`mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)] ${notification.read ? "opacity-0" : "opacity-100"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-[var(--color-ink)]">{notification.title}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-[var(--color-ink-muted)]">{notification.message}</span>
                      <span className="mt-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--color-accent)]">
                        {TYPE_LABELS[notification.type] || TYPE_LABELS.system}
                      </span>
                    </span>
                    <span className="shrink-0 pt-0.5 text-xs text-[var(--color-ink-muted)]">{formatNotificationTime(notification.createdAt)}</span>
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
            <span className="hidden text-left sm:inline">
              <span className="block text-sm font-medium leading-tight text-[var(--color-ink)]">{user?.name || "Account"}</span>
            </span>
            <ChevronDown size={14} className="text-[var(--color-ink-muted)]" />
          </button>

          {open && (
            <div className="absolute right-0 top-12 z-20 w-52 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-[var(--shadow-card)]">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-[var(--color-ink)]">{user?.name}</p>
                <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{user?.email}</p>
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
