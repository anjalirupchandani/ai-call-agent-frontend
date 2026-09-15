const STYLES = {
  Completed: "bg-[var(--color-signal-dim)] text-[var(--color-signal-ink)]",
  "In Progress": "bg-[var(--color-gold-dim)] text-[var(--color-gold-ink)]",
  Failed: "bg-[var(--color-warn-dim)] text-[var(--color-warn-ink)]",
  Missed: "bg-[var(--color-warn-dim)] text-[var(--color-warn-ink)]",
};

const DOT_STYLES = {
  Completed: "bg-[var(--color-signal)]",
  "In Progress": "bg-[var(--color-gold)] animate-pulse",
  Failed: "bg-[var(--color-warn)]",
  Missed: "bg-[var(--color-warn)]",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        STYLES[status] || "bg-[var(--color-surface-sunk)] text-[var(--color-ink-muted)]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_STYLES[status] || "bg-[var(--color-ink-muted)]"}`} />
      {status}
    </span>
  );
}
