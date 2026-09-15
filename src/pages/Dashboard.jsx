import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PhoneCall, CheckCircle2, Clock, TrendingUp, PhoneOutgoing, UserPlus, FileText, History } from "lucide-react";
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

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs shadow-[var(--shadow-card)]">
      <p className="mb-1 font-medium text-[var(--color-ink)]">{label}</p>
      <p className="text-[var(--color-accent)]">Calls: {payload[0]?.value}</p>
      <p className="text-[var(--color-signal-ink)]">Completed: {payload[1]?.value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [overview, setOverview] = useState([]);
  const [recentCalls, setRecentCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [dash, callList] = await Promise.all([getDashboardStats(), getCalls()]);
      setStats(dash.stats);
      setOverview(dash.overview);
      setRecentCalls(callList.slice(0, 5));
      setLoading(false);
    })();
  }, []);

  return (
    <DashboardShell title="Dashboard" subtitle="Here's what's happening with your calls today.">
      {loading ? (
        <div className="flex h-64 items-center justify-center text-sm text-[var(--color-ink-muted)]">
          Loading dashboard…
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Calls" value={stats.totalCalls.toLocaleString()} delta={stats.totalCallsDelta} icon={PhoneCall} accent="accent" />
            <StatCard label="Completed Calls" value={stats.completedCalls.toLocaleString()} delta={stats.completedCallsDelta} icon={CheckCircle2} accent="signal" />
            <StatCard label="Total Duration" value={stats.totalDuration} delta={stats.totalDurationDelta} icon={Clock} accent="gold" />
            <StatCard label="Success Rate" value={stats.successRate} delta={stats.successRateDelta} icon={TrendingUp} accent="accent" />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            {/* Calls overview chart */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] xl:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-ink)]">
                    Calls Overview
                  </h2>
                  <p className="text-xs text-[var(--color-ink-muted)]">Last 7 days</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overview} margin={{ left: -20, right: 10, top: 10 }}>
                    <defs>
                      <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-signal)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="var(--color-signal)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "var(--color-ink-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "var(--color-ink-muted)" }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="calls" stroke="var(--color-accent)" strokeWidth={2} fill="url(#callsGradient)" />
                    <Area type="monotone" dataKey="completed" stroke="var(--color-signal)" strokeWidth={2} fill="url(#completedGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick actions */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-ink)]">
                Quick Actions
              </h2>
              <div className="flex flex-col gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <Link
                    key={action.label}
                    to={action.to}
                    className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-dim)] hover:text-[var(--color-accent-ink)]"
                  >
                    <action.icon size={17} />
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Recent calls */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-ink)]">
                Recent Calls
              </h2>
              <Link to="/dashboard/calls" className="text-xs font-medium text-[var(--color-accent)] hover:underline">
                View all
              </Link>
            </div>
            <div className="flex flex-col divide-y divide-[var(--color-border-soft)]">
              {recentCalls.map((call) => (
                <CallCard key={call.id} call={call} />
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
