export default function StatCard({ label, value, delta, icon: Icon, accent = "accent" }) {
  const accentBg = {
    accent: "bg-accent-dim text-accent",
    signal: "bg-signal-dim text-signal-ink",
    gold: "bg-gold-dim text-gold-ink",
  }[accent];

  const isPositive = delta?.startsWith("+") || delta?.startsWith("↑");
  const hasValue = value !== null && value !== undefined && value !== "";

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-[var(--color-ink-muted)]">{label}</span>
        {Icon && (
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accentBg}`}>
            <Icon size={17} strokeWidth={2} />
          </span>
        )}
      </div>
      {hasValue ? (
        <>
          <div className="mt-3 flex items-end justify-between">
            <span className="font-[family-name:var(--font-display)] text-[28px] font-semibold tracking-tight text-[var(--color-ink)]">{value}</span>
          </div>
          <p className={`mt-2 font-mono text-xs font-medium ${delta ? (isPositive ? "text-[var(--color-signal-ink)]" : "text-[var(--color-warn-ink)]") : "text-[var(--color-ink-muted)]"}`}>
            {delta || "—"}
          </p>
        </>
      ) : (
        <div className="mt-4 flex items-center gap-2.5 text-sm text-[var(--color-ink-muted)]">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-surface-sunk)]"><span className="h-2 w-2 rounded-full bg-[var(--color-border)]" /></span>
          <span>No calls yet.</span>
        </div>
      )}
    </div>
  );
}
