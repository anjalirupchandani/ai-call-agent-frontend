export default function StatCard({ label, value, delta, icon: Icon, accent = "accent" }) {
  const accentBg = {
    accent: "bg-accent-dim text-accent",
    signal: "bg-signal-dim text-signal-ink",
    gold: "bg-gold-dim text-gold-ink",
  }[accent];

  const isPositive = delta?.startsWith("+");

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-(--shadow-card)">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-ink-muted">{label}</span>
        {Icon && (
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accentBg}`}>
            <Icon size={17} strokeWidth={2} />
          </span>
        )}
      </div>
      <div className="mt-3 flex items-end justify-between">
        <span className="font-display text-[28px] font-semibold tracking-tight text-ink">
          {value}
        </span>
        {delta && (
          <span
            className={`mb-1 font-mono text-xs font-medium ${
              isPositive ? "text-signal-ink" : "text-warn-ink"
            }`}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}