import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowDownLeft, ChevronRight } from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import StatusBadge from "../components/StatusBadge";
import { getCalls } from "../services/api";

const FILTERS = ["All", "Completed", "In Progress", "Missed", "Failed"];

export default function Calls() {
  const [calls, setCalls] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCalls().then((data) => {
      setCalls(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(
    () => (filter === "All" ? calls : calls.filter((c) => c.status === filter)),
    [calls, filter]
  );

  return (
    <DashboardShell title="Call History" subtitle="Every call your AI agent has made or received.">
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-[var(--color-ink)] text-white"
                : "border border-[var(--color-border)] text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-sunk)]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-sm text-[var(--color-ink-muted)]">
            Loading call history…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs text-[var(--color-ink-muted)]">
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Duration</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-soft)]">
                {filtered.map((call) => (
                  <tr key={call.id} className="transition-colors hover:bg-[var(--color-surface-sunk)]">
                    <td className="px-5 py-3.5 font-medium text-[var(--color-ink)]">{call.contact}</td>
                    <td className="px-5 py-3.5 font-[family-name:var(--font-mono)] text-[var(--color-ink-muted)]">
                      {call.phone}
                    </td>
                    <td className="px-5 py-3.5 text-[var(--color-ink-muted)]">
                      {call.date} · {call.time}
                    </td>
                    <td className="px-5 py-3.5 font-[family-name:var(--font-mono)] text-[var(--color-ink-soft)]">
                      {call.duration}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-[var(--color-ink-muted)]">
                        {call.type === "Outbound" ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                        {call.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={call.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/dashboard/calls/${call.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:underline"
                      >
                        View details
                        <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-[var(--color-ink-muted)]">
                No calls with status "{filter}".
              </p>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
