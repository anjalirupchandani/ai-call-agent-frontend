import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, PlayCircle, Sparkles, ArrowRightCircle } from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import StatusBadge from "../components/StatusBadge";
import TranscriptPanel from "../components/TranscriptPanel";
import { getCallById } from "../services/api";

export default function CallDetails() {
  const { callId } = useParams();
  const [call, setCall] = useState(null);

  useEffect(() => {
    getCallById(callId).then(setCall);
  }, [callId]);

  if (!call) {
    return (
      <DashboardShell title="Call Details">
        <div className="flex h-40 items-center justify-center text-sm text-[var(--color-ink-muted)]">
          Loading call…
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Call Details" subtitle={`Call ID: ${call.id}`}>
      <Link
        to="/dashboard/calls"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft size={15} /> Back to call history
      </Link>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left: contact + meta */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-ink)]">
                {call.contact.name}
              </h2>
              <StatusBadge status={call.status} />
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-muted)]">Phone</dt>
                <dd className="font-[family-name:var(--font-mono)] text-[var(--color-ink)]">{call.contact.phone}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-muted)]">Email</dt>
                <dd className="text-[var(--color-ink)]">{call.contact.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-muted)]">Date</dt>
                <dd className="text-[var(--color-ink)]">{call.date}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-muted)]">Time</dt>
                <dd className="text-[var(--color-ink)]">{call.time}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-muted)]">Duration</dt>
                <dd className="font-[family-name:var(--font-mono)] text-[var(--color-ink)]">{call.duration}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-muted)]">Agent</dt>
                <dd className="text-[var(--color-ink)]">{call.agent}</dd>
              </div>
            </dl>
          </div>

          {/* Recording placeholder */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-ink)]">Recording</h3>
            <div className="flex items-center gap-3 rounded-xl bg-[var(--color-surface-sunk)] p-4">
              <PlayCircle size={28} className="shrink-0 text-[var(--color-ink-muted)]" />
              <div className="flex-1">
                <div className="h-1.5 w-full rounded-full bg-[var(--color-border)]">
                  <div className="h-1.5 w-1/3 rounded-full bg-[var(--color-accent)]" />
                </div>
                <p className="mt-1.5 text-xs text-[var(--color-ink-muted)]">Audio will appear once voice storage is connected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: summary, insights, transcript */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
              <Sparkles size={15} className="text-[var(--color-accent)]" /> Call Summary
            </h3>
            <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">{call.summary}</p>

            <div className="my-5 h-px bg-[var(--color-border-soft)]" />

            <h3 className="mb-3 text-sm font-semibold text-[var(--color-ink)]">AI-Generated Insights</h3>
            <ul className="space-y-2">
              {call.insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-ink-soft)]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                  {insight}
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-[var(--color-accent-dim)] p-4">
              <ArrowRightCircle size={17} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent-ink)]">
                  Follow-up recommendation
                </p>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{call.followUp}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
            <h3 className="mb-4 text-sm font-semibold text-[var(--color-ink)]">Full Transcript</h3>
            <TranscriptPanel messages={call.transcript} />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
