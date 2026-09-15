import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Megaphone, Pause, Play, RefreshCw, Users, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import DashboardShell from "../components/DashboardShell";
import {
  getCampaignById,
  pauseCampaign,
  retryFailedCampaignCalls,
  startCampaign,
} from "../services/api";

const STATUS_META = {
  draft: { label: "Draft", classes: "bg-[var(--color-surface-sunk)] text-[var(--color-ink-muted)]" },
  running: { label: "Running", classes: "bg-[var(--color-accent-dim)] text-[var(--color-accent-ink)]" },
  paused: { label: "Paused", classes: "bg-[var(--color-gold-dim)] text-[var(--color-gold-ink)]" },
  completed: { label: "Completed", classes: "bg-[var(--color-signal-dim)] text-[var(--color-signal-ink)]" },
  cancelled: { label: "Cancelled", classes: "bg-[var(--color-warn-dim)] text-[var(--color-warn-ink)]" },
};

function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.draft;
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${meta.classes}`}>{meta.label}</span>;
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function callStatusClasses(status) {
  switch (status) {
    case "completed": return "bg-[var(--color-signal-dim)] text-[var(--color-signal-ink)]";
    case "calling": return "bg-[var(--color-accent-dim)] text-[var(--color-accent-ink)]";
    case "failed": return "bg-[var(--color-warn-dim)] text-[var(--color-warn-ink)]";
    case "skipped": return "bg-[var(--color-surface-sunk)] text-[var(--color-ink-muted)]";
    default: return "bg-[var(--color-gold-dim)] text-[var(--color-gold-ink)]";
  }
}

export default function CampaignDetails() {
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadCampaign();
  }, [campaignId]);

  async function loadCampaign() {
    setLoading(true);
    setError(null);
    try {
      setCampaign(await getCampaignById(campaignId));
    } catch (loadError) {
      setError(loadError.message || "Failed to load campaign");
    } finally {
      setLoading(false);
    }
  }

  const progress = campaign?.progress || {};
  const calls = campaign?.calls || [];
  const failedCalls = useMemo(() => calls.filter((call) => call.status === "failed"), [calls]);
  const canStart = campaign && ["draft", "paused"].includes(campaign.status);
  const canPause = campaign?.status === "running";

  async function runAction(name, callback, message) {
    setAction(name);
    setError(null);
    try {
      setCampaign(await callback(campaignId));
      setSuccess(message);
      setTimeout(() => setSuccess(null), 3000);
    } catch (actionError) {
      setError(actionError.message || `Failed to ${name} campaign`);
    } finally {
      setAction("");
    }
  }

  if (loading) {
    return <DashboardShell title="Campaign Details"><div className="flex h-40 items-center justify-center text-sm text-[var(--color-ink-muted)]">Loading campaign…</div></DashboardShell>;
  }

  if (!campaign) {
    return <DashboardShell title="Campaign Details"><div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error || "Campaign not found"}</div></DashboardShell>;
  }

  return (
    <DashboardShell title={campaign.name} subtitle={`${campaign.templateName || "Campaign"} · ${campaign.totalCalls || 0} calls`}>
      <Link to="/dashboard/campaigns" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"><ArrowLeft size={15} /> Back to campaigns</Link>

      {error && <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><span className="flex-1">{error}</span><button type="button" onClick={() => setError(null)} aria-label="Dismiss error"><X size={16} /></button></div>}
      {success && <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle2 size={17} /><span>{success}</span></div>}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
            <div className="mb-5 flex items-start justify-between gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-accent-dim)] text-[var(--color-accent-ink)]"><Megaphone size={20} /></span>
              <StatusPill status={campaign.status} />
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-[var(--color-ink-muted)]">Template</dt><dd className="text-right text-[var(--color-ink)]">{campaign.templateName || "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[var(--color-ink-muted)]">AI agent</dt><dd className="text-right text-[var(--color-ink)]">{campaign.agentId || "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[var(--color-ink-muted)]">Audience</dt><dd className="text-right text-[var(--color-ink)]">{campaign.totalCalls || 0} contacts</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[var(--color-ink-muted)]">Concurrency</dt><dd className="text-right text-[var(--color-ink)]">{campaign.concurrency}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[var(--color-ink-muted)]">Pacing</dt><dd className="text-right text-[var(--color-ink)]">{campaign.pacingSeconds}s</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[var(--color-ink-muted)]">Created</dt><dd className="text-right text-[var(--color-ink)]">{formatDate(campaign.createdAt)}</dd></div>
            </dl>
            {(canStart || canPause) && (
              <div className="mt-5 flex gap-2 border-t border-[var(--color-border-soft)] pt-5">
                {canStart && <button type="button" disabled={!!action} onClick={() => runAction("start", startCampaign, "Campaign started.")} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--color-accent)] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50">{action === "start" ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />} Start</button>}
                {canPause && <button type="button" disabled={!!action} onClick={() => runAction("pause", pauseCampaign, "Campaign paused.")} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm font-semibold text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-sunk)] disabled:opacity-50">{action === "pause" ? <Loader2 size={15} className="animate-spin" /> : <Pause size={15} />} Pause</button>}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-ink)]">Campaign progress</h2><p className="mt-1 text-sm text-[var(--color-ink-muted)]">Track every contact in this outbound run.</p></div>
              <span className="text-2xl font-semibold text-[var(--color-ink)]">{progress.percent || 0}%</span>
            </div>
            <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]" role="progressbar" aria-label="Campaign progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress.percent || 0}><div className="h-full rounded-full bg-[var(--color-accent)] transition-all" style={{ width: `${progress.percent || 0}%` }} /></div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[{ label: "Completed", value: progress.completed || 0, color: "text-[var(--color-signal-ink)]" }, { label: "Calling", value: progress.calling || 0, color: "text-[var(--color-accent-ink)]" }, { label: "Pending", value: progress.pending || 0, color: "text-[var(--color-gold-ink)]" }, { label: "Failed", value: progress.failed || 0, color: "text-[var(--color-warn-ink)]" }].map((item) => <div key={item.label} className="rounded-xl bg-[var(--color-surface-sunk)] px-3 py-3"><p className={`text-xl font-semibold ${item.color}`}>{item.value}</p><p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">{item.label}</p></div>)}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-3 border-b border-[var(--color-border-soft)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-ink)]">Campaign calls</h2><p className="mt-1 text-sm text-[var(--color-ink-muted)]">{calls.length} recipients in this campaign</p></div>{failedCalls.length > 0 && <button type="button" disabled={!!action} onClick={() => runAction("retry", retryFailedCampaignCalls, "Failed calls queued for retry.")} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] px-3.5 py-2 text-sm font-semibold text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-sunk)] disabled:opacity-50">{action === "retry" ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Retry failed calls</button>}</div>
            <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr className="border-b border-[var(--color-border-soft)] text-xs text-[var(--color-ink-muted)]"><th className="px-6 py-3 font-medium">Contact</th><th className="px-6 py-3 font-medium">Phone number</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Attempted</th><th className="px-6 py-3 font-medium">Details</th></tr></thead><tbody>{calls.map((call) => <tr key={call.id} className="border-b border-[var(--color-border-soft)] last:border-0"><td className="px-6 py-4"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent-dim)] text-[var(--color-accent-ink)]"><Users size={15} /></span><span className="font-medium text-[var(--color-ink)]">{call.name || "Unknown contact"}</span></div></td><td className="px-6 py-4 font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-soft)]">{call.phoneNumber}</td><td className="px-6 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${callStatusClasses(call.status)}`}>{call.status}</span></td><td className="px-6 py-4 text-xs text-[var(--color-ink-muted)]">{formatDate(call.attemptedAt)}</td><td className="max-w-xs px-6 py-4 text-xs text-[var(--color-warn-ink)]">{call.error || call.executionId || "—"}</td></tr>)}</tbody></table></div>
            {calls.length === 0 && <div className="px-6 py-12 text-center text-sm text-[var(--color-ink-muted)]">No calls are attached to this campaign.</div>}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
