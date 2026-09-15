import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Moon, Sun } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/api";
import Waveform from "./Waveform";

const LINKS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

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

export default function Navbar() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
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

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [notificationsOpen]);

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
                  <div>
                    <p className="text-sm font-semibold text-ink">Notifications</p>
                    {user && (
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {unreadNotifications ? `${unreadNotifications} unread` : "All caught up"}
                      </p>
                    )}
                  </div>
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
                  {!user && !authLoading && (
                    <div className="px-3 py-6 text-center">
                      <p className="text-sm font-medium text-ink">Sign in to view notifications</p>
                      <Link
                        to="/login"
                        onClick={() => setNotificationsOpen(false)}
                        className="mt-2 inline-flex text-xs font-medium text-accent hover:text-accent-hover"
                      >
                        Sign in
                      </Link>
                    </div>
                  )}
                  {user && notificationsLoading && (
                    <p className="px-3 py-6 text-center text-sm text-ink-muted">Loading notifications…</p>
                  )}
                  {user && !notificationsLoading && notificationsError && (
                    <p role="alert" className="px-3 py-6 text-center text-sm text-warn-ink">{notificationsError}</p>
                  )}
                  {user && !notificationsLoading && !notificationsError && !notifications.length && (
                    <p className="px-3 py-6 text-center text-sm text-ink-muted">No notifications yet.</p>
                  )}
                  {user && !notificationsLoading && !notificationsError && notifications.map((notification) => (
                    <button
                      key={notification._id}
                      type="button"
                      onClick={() => openNotification(notification)}
                      className="flex w-full gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-surface-sunk"
                    >
                      <span className={`mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-accent ${notification.read ? "opacity-0" : "opacity-100"}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-ink">{notification.title}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">{notification.message}</span>
                        <span className="mt-1 block text-[10px] font-medium uppercase tracking-wide text-accent">
                          {TYPE_LABELS[notification.type] || TYPE_LABELS.system}
                        </span>
                      </span>
                      <span className="shrink-0 pt-0.5 text-xs text-ink-muted">{formatNotificationTime(notification.createdAt)}</span>
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
