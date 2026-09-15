import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PhoneCall, CheckCircle2, Clock, TrendingUp, PhoneOutgoing, UserPlus, FileText, History, BarChart3, ArrowRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import DashboardShell from "../components/DashboardShell";
import StatCard from "../components/StatCard";
import CallCard from "../components/CallCard";
import { getDashboardStats, getCalls } from "../services/api";

const QUICK_ACTIONS = [
  { to: "/dashboard/calls/new", label: "Start New Call", icon: PhoneOutgoing },
  { to: "/dashboard/contacts", label: "Add Contact", icon: UserPlus },
  { to: "/dashboard/templates", label: "Create Template", icon: FileText },
  { to: "/dashboard/calls", label: "View Call Logs", icon: History },
];

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
];

const SERIES = [
  { key: "completed", label: "Completed", color: "var(--color-signal)", gradient: "completedGradient" },
  { key: "missed", label: "Missed", color: "var(--color-gold)", gradient: "missedGradient" },
  { key: "failed", label: "Failed", color: "var(--color-warn)", gradient: "failedGradient" },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs shadow-[var(--shadow-card)]">
      <p className="mb-1 font-medium text-[var(--color-ink)]">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>{entry.name}: {entry.value}</p>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-label="Loading dashboard" role="status">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-sunk)]" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="h-96 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-sunk)] xl:col-span-2" />
        <div className="h-96 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-sunk)]" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [overview, setOverview] = useState([]);
  const [recentCalls, setRecentCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");
  const periodLabel = useMemo(() => PERIODS.find((option) => option.value === period)?.label || "7 Days", [period]);
  const hasCallData = overview.some((day) => (day.completed || 0) + (day.missed || 0) + (day.failed || 0) > 0);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const [dash, callList] = await Promise.all([getDashboardStats(period), getCalls()]);
      setStats(dash.stats);
      setOverview(dash.overview);
      setRecentCalls(callList.slice(0, 5));
      setLoading(false);
    })();
  }, [period]);

  return (
    <DashboardShell title="Dashboard" subtitle="Here's what's happening with your calls today.">
      {loading ? <DashboardSkeleton /> : (
        <div className="flex flex-col gap-6">
          <section aria-label="Call statistics">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-muted)]">Performance</p>
                <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Your call activity for the selected period.</p>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-[var(--color-ink-muted)]">
                <span className="sr-only">Stats period</span>
                <select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]">
                  {PERIODS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total Calls" value={stats.totalCalls ? stats.totalCalls.toLocaleString() : null} delta={stats.totalCallsDelta} icon={PhoneCall} accent="accent" />
              <StatCard label="Completed Calls" value={stats.completedCalls ? stats.completedCalls.toLocaleString() : null} delta={stats.completedCallsDelta} icon={CheckCircle2} accent="signal" />
              <StatCard label="Total Duration" value={stats.totalCalls ? stats.totalDuration : null} delta={stats.totalDurationDelta} icon={Clock} accent="gold" />
              <StatCard label="Success Rate" value={stats.totalCalls ? stats.successRate : null} delta={stats.successRateDelta} icon={TrendingUp} accent="accent" />
            </div>
          </section>

          <div className="h-px bg-[var(--color-border-soft)]" />

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] xl:col-span-2">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-ink)]">Calls Overview</h2>
                  <p className="text-xs text-[var(--color-ink-muted)]">{periodLabel} · Completed, missed, and failed calls</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {SERIES.map((series) => (
                    <span key={series.key} className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-ink-muted)]"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: series.color }} />{series.label}</span>
                  ))}
                </div>
              </div>
              {hasCallData ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={overview} margin={{ left: 0, right: 10, top: 10 }}>
                      <defs>
                        {SERIES.map((series) => (
                          <linearGradient key={series.gradient} id={series.gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={series.color} stopOpacity={0.22} /><stop offset="100%" stopColor={series.color} stopOpacity={0} /></linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: "var(--color-ink-muted)" }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--color-ink-muted)" }} axisLine={false} tickLine={false} width={30} />
                      <Tooltip content={<CustomTooltip />} />
                      {SERIES.map((series) => <Area key={series.key} type="monotone" dataKey={series.key} name={series.label} stroke={series.color} strokeWidth={2} fill={`url(#${series.gradient})`} />)}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center rounded-xl bg-[var(--color-surface-sunk)] px-6 text-center">
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent-dim)] text-[var(--color-accent)]"><BarChart3 size={19} /></span>
                  <p className="max-w-xs text-sm font-medium text-[var(--color-ink)]">No call data yet — start your first call to see trends here.</p>
                  <Link to="/dashboard/calls/new" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]">Start New Call <ArrowRight size={13} /></Link>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-ink)]">Quick Actions</h2>
              <div className="flex flex-col gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <Link key={action.label} to={action.to} className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-dim)] hover:text-[var(--color-accent-ink)]">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${action.label === "Start New Call" || action.label === "View Call Logs" ? "bg-[var(--color-accent-dim)] text-[var(--color-accent)]" : "bg-[var(--color-signal-dim)] text-[var(--color-signal-ink)]"}`}><action.icon size={17} /></span>
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-ink)]">Recent Calls</h2>
              <Link to="/dashboard/calls" className="text-xs font-medium text-[var(--color-accent)] hover:underline">View all</Link>
            </div>
            <div className="flex flex-col divide-y divide-[var(--color-border-soft)]">
              {recentCalls.length ? recentCalls.map((call) => <CallCard key={call.id} call={call} />) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface-sunk)] text-[var(--color-ink-muted)]"><PhoneCall size={18} /></span>
                  <p className="text-sm font-medium text-[var(--color-ink)]">No recent calls</p>
                  <p className="mt-1 text-xs text-[var(--color-ink-muted)]">Your completed activity will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
