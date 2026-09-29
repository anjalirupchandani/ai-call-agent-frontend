import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PhoneCall, Loader2, Plus, X } from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import { startEdesyCall, getPathways } from "../services/api";

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

// Quick client-side check so obvious typos never reach the server. The backend
// re-validates everything — this is only for fast feedback.
function checkPhone(raw) {
  let s = raw.trim().replace(/[\s\-().]/g, "");
  if (!s) return "Enter the recipient's phone number.";
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  if (!s.startsWith("+")) {
    if (/^[6-9]\d{9}$/.test(s) || /^0[6-9]\d{9}$/.test(s) || /^91[6-9]\d{9}$/.test(s)) return "";
    return "Include the country code, e.g. +919876543210 for India.";
  }
  if (!/^\+[1-9]\d{7,14}$/.test(s)) {
    return "That doesn't look like a valid phone number. Use international format, e.g. +919876543210.";
  }
  if (s.startsWith("+91") && !/^\+91\d{10}$/.test(s)) return "Indian numbers need exactly 10 digits after +91.";
  return "";
}

export default function StartCall() {
  const [form, setForm]             = useState(initialForm);
  const [vars, setVars]             = useState([]); // optional extra variables: [{ key, value }]
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [pathways, setPathways]     = useState([]); // deployed pathways only
  const navigate                    = useNavigate();

  // Only deployed pathways can be used on a call.
  useEffect(() => {
    let cancelled = false;
    getPathways()
      .then((list) => {
        if (!cancelled) {
          setPathways((Array.isArray(list) ? list : []).filter((p) => p.status === "deployed"));
        }
      })
      .catch(() => {
        if (!cancelled) setPathways([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // A ref (not state) so a fast double-click can never slip a second request
  // through before React re-renders the disabled button. Every call costs credits.
  const submitLock = useRef(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const updateVar = (i, field) => (e) =>
    setVars((list) => list.map((v, idx) => (idx === i ? { ...v, [field]: e.target.value } : v)));
  const addVar = () => setVars((list) => [...list, { key: "", value: "" }]);
  const removeVar = (i) => setVars((list) => list.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitLock.current) return;
    setError("");

    const phoneProblem = checkPhone(form.phone);
    if (phoneProblem) {
      setError(phoneProblem);
      return;
    }
    if (!form.contactName.trim()) {
      setError("Enter the customer's name.");
      return;
    }

    const variables = {};
    for (const { key, value } of vars) {
      const k = key.trim();
      const v = value.trim();
      if (!k && !v) continue; // ignore blank rows
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(k)) {
        setError(`Variable name "${k || "(empty)"}" is invalid. Use letters, numbers and underscores only, starting with a letter.`);
        return;
      }
      if (k in variables) {
        setError(`Variable "${k}" is listed twice.`);
        return;
      }
      if (v) variables[k] = v;
    }

    submitLock.current = true;
    setSubmitting(true);
    try {
      const result = await startEdesyCall({
        phoneNumber: form.phone,
        customerName: form.contactName.trim(),
        purpose: form.purpose.trim(),
        variables,
        pathwayId: form.pathwayId || undefined,
      });
      const callId = result.conversationId || result.callId;
      // Lock stays on: we are leaving this page, so no second click can get through.
      navigate(`/dashboard/calls/live/${callId}`, {
        state: { setup: form, callId },
      });
    } catch (err) {
      setError(err.message || "Failed to start call. Check server logs.");
      submitLock.current = false;
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
              Your Edesy voice agent will call this number. Each click of Start Call places one
              real call and uses your Edesy calling credits.
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
            <Field label="Customer name" hint="Sent to the agent as the customer_name variable.">
              <input
                required
                placeholder="Rahul"
                value={form.contactName}
                onChange={update("contactName")}
                className={inputClasses}
              />
            </Field>

            <Field label="Call purpose (optional)" hint="A short label to find this call later.">
              <input
                placeholder="Appointment confirmation"
                value={form.purpose}
                onChange={update("purpose")}
                className={inputClasses}
              />
            </Field>
          </div>

          {/* Pathway: the flowchart the agent will follow */}
          <Field
            label="Pathway (optional)"
            hint={
              pathways.length === 0
                ? "No deployed pathways yet. Build one in Pathways and click Deploy."
                : "The agent follows this flowchart on the call. Leave empty to use the agent's own prompt in Edesy."
            }
          >
            <select
              value={form.pathwayId}
              onChange={update("pathwayId")}
              disabled={submitting}
              className={inputClasses}
            >
              <option value="">No pathway (agent's own prompt)</option>
              {pathways.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>

          {/* Optional variables */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-ink)]">
                Customer variables (optional)
              </span>
              <button
                type="button"
                onClick={addVar}
                disabled={submitting || vars.length >= 25}
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:underline disabled:opacity-50"
              >
                <Plus size={13} /> Add variable
              </button>
            </div>
            {vars.length === 0 ? (
              <p className="text-xs text-[var(--color-ink-muted)]">
                Extra details for the agent's prompt, e.g. order_id = ORD-12345. Reference them in
                your Edesy agent's prompt by name.
              </p>
            ) : (
              vars.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    placeholder="order_id"
                    value={v.key}
                    onChange={updateVar(i, "key")}
                    className={`${inputClasses} w-2/5 font-[family-name:var(--font-mono)]`}
                  />
                  <input
                    placeholder="ORD-12345"
                    value={v.value}
                    onChange={updateVar(i, "value")}
                    className={`${inputClasses} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => removeVar(i)}
                    disabled={submitting}
                    aria-label="Remove variable"
                    className="rounded-lg p-2 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunk)]"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))
            )}
          </div>

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
              {submitting ? (form.pathwayId ? "Preparing AI agent…" : "Starting call…") : "Start Call"}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => { setForm(initialForm); setVars([]); setError(""); }}
              className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-medium text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface-sunk)] disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}