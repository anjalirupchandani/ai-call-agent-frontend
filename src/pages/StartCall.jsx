import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PhoneCall, Loader2 } from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import { startCall, getPathways } from "../services/api";

const initialForm = {
  phone: "",
  contactName: "",
  purpose: "",
  pathwayId: "",
};

function Field({ label, children, hint }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
      {children}
      {hint && <span className="text-xs text-[var(--color-ink-muted)]">{hint}</span>}
    </label>
  );
}

const inputClasses =
  "rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-dim)]";

export default function StartCall() {
  const [form, setForm]             = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [pathways, setPathways]     = useState([]);
  const [loadingPathways, setLoadingPathways] = useState(true);
  const navigate                    = useNavigate();

  useEffect(() => {
    let cancelled = false;
    getPathways()
      .then((list) => {
        if (cancelled) return;
        setPathways(list || []);
        const deployed = list?.find((p) => p.cognidomAgentId) || list?.[0];
        if (deployed) setForm((f) => ({ ...f, pathwayId: deployed._id }));
      })
      .catch((err) => setError(err.message || "Failed to load pathways."))
      .finally(() => !cancelled && setLoadingPathways(false));
    return () => { cancelled = true; };
  }, []);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const selectedPathway = pathways.find((p) => p._id === form.pathwayId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.pathwayId) {
      setError("Select a pathway first.");
      return;
    }
    if (selectedPathway && !selectedPathway.cognidomAgentId) {
      setError(`"${selectedPathway.name}" has no Cognidom Agent ID linked yet — open it in the Pathways editor.`);
      return;
    }
    setSubmitting(true);
    try {
      const result = await startCall(form);
      // Navigate to the live call screen for the configured voice provider
      navigate(`/dashboard/calls/live/${result.callId}`, {
        state: { setup: form, callId: result.callId },
      });
    } catch (err) {
      setError(err.message || "Failed to start call. Check server logs.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell
      title="Start a Call"
      subtitle="Set up your AI agent, then launch the outbound call."
    >
      <div className="mx-auto max-w-2xl">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]"
        >
          {/* Info banner */}
          <div className="flex items-start gap-3 rounded-xl border border-[var(--color-accent-dim)] bg-[var(--color-accent-dim)] px-4 py-3">
            <PhoneCall size={16} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
            <p className="text-xs text-[var(--color-ink-soft)]">
              Your configured voice provider will call the recipient's phone number directly,
              using its connected outbound number.
            </p>
          </div>

          {/* Recipient phone number */}
          <Field
            label="Recipient phone number"
            hint="Include country code — e.g. +919876543210 for India, +14155552671 for US"
          >
            <input
              required
              type="tel"
              placeholder="+919876543210"
              value={form.phone}
              onChange={update("phone")}
              className={`${inputClasses} font-[family-name:var(--font-mono)]`}
            />
          </Field>

          {/* Contact name + purpose */}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Contact name">
              <input
                required
                placeholder="Marcus Bell"
                value={form.contactName}
                onChange={update("contactName")}
                className={inputClasses}
              />
            </Field>

            <Field label="Call purpose" hint="A short label to find this call later.">
              <input
                required
                placeholder="Appointment confirmation"
                value={form.purpose}
                onChange={update("purpose")}
                className={inputClasses}
              />
            </Field>
          </div>

          <Field
            label="Pathway"
            hint={
              loadingPathways
                ? "Loading your saved pathways…"
                : selectedPathway && !selectedPathway.cognidomAgentId
                ? "⚠ This pathway has no Cognidom Agent ID set — open it in the Pathways editor first."
                : "The agent will follow the flow you built in the Pathways editor."
            }
          >
            <select
              required
              value={form.pathwayId}
              onChange={update("pathwayId")}
              className={inputClasses}
              disabled={loadingPathways}
            >
              {pathways.length === 0 && <option value="">No pathways saved yet</option>}
              {pathways.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}{p.cognidomAgentId ? "" : " (no agent linked)"}
                </option>
              ))}
            </select>
          </Field>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          <div className="mt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
            >
              {submitting
                ? <Loader2 size={16} className="animate-spin" />
                : <PhoneCall size={16} />}
              {submitting ? "Starting…" : "Start AI Call"}
            </button>
            <button
              type="button"
              onClick={() => { setForm(initialForm); setError(""); }}
              className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-medium text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface-sunk)]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}