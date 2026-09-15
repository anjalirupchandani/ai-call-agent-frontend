import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  X,
  Loader2,
  Ban,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import {
  getScheduledCalls,
  createScheduledCall,
  cancelScheduledCall,
  deleteScheduledCall,
  getContacts,
} from "../services/api";

const STATUS_META = {
  pending: { label: "Pending", color: "text-amber-600 bg-amber-50", icon: Clock },
  completed: { label: "Completed", color: "text-emerald-600 bg-emerald-50", icon: CheckCircle2 },
  failed: { label: "Failed", color: "text-red-600 bg-red-50", icon: XCircle },
  cancelled: { label: "Cancelled", color: "text-gray-500 bg-gray-100", icon: Ban },
};

function withId(item) {
  return { ...item, id: item.id || item._id };
}


const CALENDAR_VIEWS = ["week", "month", "year"];
const WEEK_START_HOUR = 8;
const WEEK_END_HOUR = 20;
const HOUR_HEIGHT = 64;
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_FORMATTER = new Intl.DateTimeFormat(undefined, { month: "long" });

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date) {
  const day = startOfDay(date);
  day.setDate(day.getDate() - day.getDay());
  return day;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function dateKey(date) {
  const value = date instanceof Date ? date : new Date(date);
  return `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`;
}

function callsOnDay(items, date) {
  const key = dateKey(date);
  return items.filter((item) => dateKey(item.scheduledAt) === key);
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function periodLabel(view, cursor) {
  if (view === "year") return String(cursor.getFullYear());
  if (view === "month") {
    return cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }

  const start = startOfWeek(cursor);
  const end = addDays(start, 6);
  const startLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return `${startLabel} – ${endLabel}`;
}

function eventTone(status) {
  if (status === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "failed") return "border-red-200 bg-red-50 text-red-800";
  if (status === "cancelled") return "border-gray-200 bg-gray-100 text-gray-600";
  return "border-[var(--color-accent)]/20 bg-[var(--color-accent-dim)] text-[var(--color-accent-ink)]";
}

function CalendarEvent({ item, compact = false, onCancel, onDelete }) {
  const pending = item.status === "pending" || !item.status;
  return (
    <div
      className={`group relative rounded-lg border px-2 py-1.5 ${eventTone(item.status)} ${compact ? "text-[11px]" : "text-xs"}`}
      title={`${item.name || item.phoneNumber} · ${formatTime(item.scheduledAt)}`}
    >
      <p className="truncate font-semibold">{item.name || item.phoneNumber}</p>
      <p className="truncate opacity-70">{formatTime(item.scheduledAt)}</p>
      <div className="absolute right-1 top-1 hidden items-center gap-0.5 rounded-md bg-white/90 p-0.5 shadow-sm group-hover:flex">
        {pending && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onCancel(item.id);
            }}
            className="rounded p-1 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunk)] hover:text-[var(--color-ink)]"
            title="Cancel call"
            aria-label={`Cancel call with ${item.name || item.phoneNumber}`}
          >
            <Ban size={12} />
          </button>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(item.id);
          }}
          className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
          title="Delete call"
          aria-label={`Delete call with ${item.name || item.phoneNumber}`}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

function WeekView({ cursor, items, onCancel, onDelete }) {
  const weekStart = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const hours = Array.from({ length: WEEK_END_HOUR - WEEK_START_HOUR }, (_, index) => WEEK_START_HOUR + index);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[860px]">
        <div className="grid grid-cols-[64px_repeat(7,minmax(112px,1fr))] border-b border-[var(--color-border)]">
          <div />
          {days.map((day) => {
            const today = dateKey(day) === dateKey(new Date());
            return (
              <div key={dateKey(day)} className="px-2 pb-3 text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">{DAY_NAMES[day.getDay()]}</p>
                <span className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${today ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-ink)]"}`}>
                  {day.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        <div className="relative h-[768px]">
          <div className="absolute inset-0 grid grid-cols-[64px_repeat(7,minmax(112px,1fr))]">
            <div>
              {hours.map((hour) => (
                <div key={hour} className="h-16 border-b border-[var(--color-border-soft)] pr-2 pt-1 text-right text-[10px] text-[var(--color-ink-muted)]">
                  {new Date(2000, 0, 1, hour).toLocaleTimeString(undefined, { hour: "numeric" })}
                </div>
              ))}
            </div>
            {days.map((day) => (
              <div key={dateKey(day)} className="relative border-l border-[var(--color-border-soft)]">
                {hours.map((hour) => <div key={hour} className="h-16 border-b border-[var(--color-border-soft)]" />)}
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute bottom-0 left-16 right-0 top-0 grid grid-cols-7">
            {days.map((day) => (
              <div key={dateKey(day)} className="relative px-1">
                {callsOnDay(items, day).map((item) => {
                  const scheduled = new Date(item.scheduledAt);
                  const minutes = (scheduled.getHours() - WEEK_START_HOUR) * 60 + scheduled.getMinutes();
                  const top = Math.max(4, Math.min(704, (minutes / 60) * HOUR_HEIGHT));
                  return (
                    <div key={item.id} className="pointer-events-auto absolute left-1 right-1" style={{ top }}>
                      <CalendarEvent item={item} onCancel={onCancel} onDelete={onDelete} />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MonthView({ cursor, items, onCancel, onDelete }) {
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = startOfWeek(monthStart);
  const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
          {DAY_NAMES.map((day) => <p key={day} className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">{day}</p>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const inMonth = day.getMonth() === cursor.getMonth();
            const calls = callsOnDay(items, day);
            const today = dateKey(day) === dateKey(new Date());
            return (
              <div key={dateKey(day)} className={`min-h-[118px] border-b border-r border-[var(--color-border-soft)] p-2 ${inMonth ? "bg-[var(--color-surface)]" : "bg-[var(--color-canvas)]/60"}`}>
                <span className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${today ? "bg-[var(--color-accent)] text-white" : inMonth ? "text-[var(--color-ink)]" : "text-[var(--color-ink-muted)]"}`}>
                  {day.getDate()}
                </span>
                <div className="space-y-1">
                  {calls.slice(0, 3).map((item) => <CalendarEvent key={item.id} item={item} compact onCancel={onCancel} onDelete={onDelete} />)}
                  {calls.length > 3 && <p className="px-1 text-[10px] font-medium text-[var(--color-accent)]">+{calls.length - 3} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function YearView({ cursor, items, onSelectMonth }) {
  const year = cursor.getFullYear();
  const months = Array.from({ length: 12 }, (_, index) => new Date(year, index, 1));

  return (
    <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
      {months.map((month) => {
        const monthItems = items.filter((item) => {
          const date = new Date(item.scheduledAt);
          return date.getFullYear() === year && date.getMonth() === month.getMonth();
        });
        const firstDay = month.getDay();
        const daysInMonth = new Date(year, month.getMonth() + 1, 0).getDate();
        return (
          <button
            key={month.getMonth()}
            type="button"
            onClick={() => onSelectMonth(month.getMonth())}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-dim)]"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-ink)]">{MONTH_FORMATTER.format(month)}</h3>
              {monthItems.length > 0 && <span className="rounded-full bg-[var(--color-accent-dim)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-accent-ink)]">{monthItems.length} {monthItems.length === 1 ? "call" : "calls"}</span>}
            </div>
            <div className="mt-3 grid grid-cols-7 gap-y-1 text-center text-[10px]">
              {DAY_NAMES.map((day) => <span key={day} className="font-medium text-[var(--color-ink-muted)]">{day.slice(0, 1)}</span>)}
              {Array.from({ length: firstDay }, (_, index) => <span key={`empty-${index}`} />)}
              {Array.from({ length: daysInMonth }, (_, index) => {
                const day = new Date(year, month.getMonth(), index + 1);
                const hasCalls = callsOnDay(items, day).length > 0;
                return <span key={index} className={`mx-auto flex h-5 w-5 items-center justify-center rounded-full ${hasCalls ? "bg-[var(--color-accent)] font-semibold text-white" : "text-[var(--color-ink-soft)]"}`}>{index + 1}</span>;
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function CalendarView({ view, cursor, items, onCancel, onDelete, onSelectMonth }) {
  if (view === "month") return <MonthView cursor={cursor} items={items} onCancel={onCancel} onDelete={onDelete} />;
  if (view === "year") return <YearView cursor={cursor} items={items} onSelectMonth={onSelectMonth} />;
  return <WeekView cursor={cursor} items={items} onCancel={onCancel} onDelete={onDelete} />;
}


function ScheduleModal({ onClose, onSave, contacts }) {
  const [form, setForm] = useState({
    contactId: "",
    phoneNumber: "",
    name: "",
    date: "",
    time: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleContactSelect = (contactId) => {
    const contact = contacts.find((c) => c.id === contactId || c._id === contactId);
    setForm((prev) => ({
      ...prev,
      contactId,
      phoneNumber: contact?.phone || contact?.phoneNumber || prev.phoneNumber,
      name: contact?.name || prev.name,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!form.phoneNumber.trim()) throw new Error("Phone number is required");
      if (!form.date || !form.time) throw new Error("Pick a date and time");

      const scheduledAt = new Date(`${form.date}T${form.time}`);
      if (Number.isNaN(scheduledAt.getTime())) throw new Error("Invalid date/time");
      if (scheduledAt.getTime() <= Date.now()) {
        throw new Error("Scheduled time must be in the future");
      }

      await onSave({
        contactId: form.contactId || undefined,
        phoneNumber: form.phoneNumber.trim(),
        name: form.name.trim(),
        scheduledAt: scheduledAt.toISOString(),
        notes: form.notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to schedule call");
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">Schedule a call</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {contacts?.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
                Contact (optional)
              </label>
              <select
                value={form.contactId}
                onChange={(e) => handleContactSelect(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-dim)]"
              >
                <option value="">Enter manually</option>
                {contacts.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.name} — {c.phone || c.phoneNumber}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
              Phone number *
            </label>
            <input
              required
              placeholder="+1 555 123 4567"
              value={form.phoneNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-dim)]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
              Name
            </label>
            <input
              placeholder="Contact name (optional)"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-dim)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
                Date *
              </label>
              <input
                required
                type="date"
                min={todayStr}
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-dim)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
                Time *
              </label>
              <input
                required
                type="time"
                value={form.time}
                onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-dim)]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
              Notes
            </label>
            <textarea
              rows={3}
              placeholder="Anything the agent should know for this call..."
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-dim)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Scheduling...
              </>
            ) : (
              "Schedule call"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Callsceduling() {
  const [items, setItems] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [view, setView] = useState("week");
  const [cursor, setCursor] = useState(new Date());

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [scheduled, contactList] = await Promise.all([
        getScheduledCalls(),
        getContacts().catch(() => []),
      ]);
      setItems((scheduled || []).map(withId));
      setContacts((contactList || []).map(withId));
    } catch (err) {
      setError(err.message || "Failed to load scheduled calls");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items
      .filter((i) => {
        const matchesStatus = status === "all" || (i.status || "pending") === status;
        const matchesSearch =
          !q ||
          i.name?.toLowerCase().includes(q) ||
          i.phoneNumber?.toLowerCase().includes(q) ||
          i.notes?.toLowerCase().includes(q);
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  }, [items, search, status]);

  const flash = (setter, message) => {
    setter(message);
    setTimeout(() => setter(null), 3000);
  };

  const handleCreate = async (data) => {
    const created = withId(await createScheduledCall(data));
    setItems((prev) => [created, ...prev]);
    flash(setSuccess, "Call scheduled.");
  };

  const handleCancel = async (id) => {
    if (!confirm("Cancel this scheduled call?")) return;
    try {
      const updated = withId(await cancelScheduledCall(id));
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      flash(setSuccess, "Call cancelled.");
    } catch (err) {
      flash(setError, err.message || "Failed to cancel call");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this scheduled call?")) return;
    try {
      await deleteScheduledCall(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      flash(setSuccess, "Deleted.");
    } catch (err) {
      flash(setError, err.message || "Failed to delete");
    }
  };

  const movePeriod = (direction) => {
    setCursor((current) => {
      if (view === "year") return new Date(current.getFullYear() + direction, current.getMonth(), 1);
      if (view === "month") return addMonths(current, direction);
      return addDays(current, direction * 7);
    });
  };

  const selectMonth = (month) => {
    setCursor(new Date(cursor.getFullYear(), month, 1));
    setView("month");
  };

  return (
    <DashboardShell title="Appointments" subtitle="Plan and manage calls your AI agent will place automatically.">
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss error"><X size={16} /></button>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <span className="flex-1">{success}</span>
          <button type="button" onClick={() => setSuccess(null)} aria-label="Dismiss success"><X size={16} /></button>
        </div>
      )}

      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCursor(new Date())}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-sm font-semibold text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface-sunk)]"
          >
            Today
          </button>
          <button type="button" onClick={() => movePeriod(-1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunk)]" aria-label="Previous period">
            <ChevronLeft size={17} />
          </button>
          <button type="button" onClick={() => movePeriod(1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunk)]" aria-label="Next period">
            <ChevronRight size={17} />
          </button>
          <h2 className="ml-2 min-w-[180px] font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">{periodLabel(view, cursor)}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
            {CALENDAR_VIEWS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setView(option)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${view === option ? "bg-[var(--color-ink)] text-white" : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunk)] hover:text-[var(--color-ink)]"}`}
                aria-pressed={view === option}
              >
                {option}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-pop)] hover:bg-[var(--color-accent-hover)]"
          >
            <Plus size={16} />
            New appointment
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 sm:max-w-xs">
            <Search size={16} className="shrink-0 text-[var(--color-ink-muted)]" />
            <input
              placeholder="Search appointments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none"
          >
            <option value="all">All statuses</option>
            {Object.entries(STATUS_META).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
          </select>
        </div>
        <span className="text-sm text-[var(--color-ink-muted)]">{filtered.length} {filtered.length === 1 ? "appointment" : "appointments"}</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        {loading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--color-accent)]" /><p className="mt-4 text-sm text-[var(--color-ink-muted)]">Loading appointments...</p></div>
          </div>
        ) : (
          <CalendarView view={view} cursor={cursor} items={filtered} onCancel={handleCancel} onDelete={handleDelete} onSelectMonth={selectMonth} />
        )}
        {!loading && filtered.length === 0 && (
          <div className="border-t border-[var(--color-border-soft)] px-5 py-8 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-[var(--color-ink-muted)] opacity-60" />
            <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{search || status !== "all" ? "No appointments match your filters" : "No appointments scheduled yet"}</p>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{search || status !== "all" ? "Try a different search or status." : "Create an appointment to see it on your calendar."}</p>
          </div>
        )}
      </div>

      {showModal && <ScheduleModal onClose={() => setShowModal(false)} onSave={handleCreate} contacts={contacts} />}
    </DashboardShell>
  );
}
