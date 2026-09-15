import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function CallCard({ call }) {
  const isOutbound = call.type === "Outbound";

  return (
    <Link
      to={`/dashboard/calls/${call.id}`}
      className="flex items-center justify-between gap-4 rounded-xl border border-transparent px-3 py-3 transition-colors hover:border-[var(--color-border)] hover:bg-[var(--color-surface-sunk)]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            isOutbound ? "bg-[var(--color-accent-dim)] text-[var(--color-accent)]" : "bg-[var(--color-surface-sunk)] text-[var(--color-ink-muted)]"
          }`}
        >
          {isOutbound ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--color-ink)]">{call.contact}</p>
          <p className="truncate font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-muted)]">
            {call.phone}
          </p>
        </div>
      </div>

      <div className="hidden text-right sm:block">
        <p className="text-xs text-[var(--color-ink-muted)]">{call.date}</p>
        <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-soft)]">{call.duration}</p>
      </div>

      <StatusBadge status={call.status} />
    </Link>
  );
}
