import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PhoneCall, Loader2, Plus, X, Users, User, CheckCircle, XCircle, Upload, Download } from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import { startEdesyCall, startBulkCalls, getPathways } from "../services/api";

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

const EMPTY_RECIPIENT = { phone: "", name: "", purpose: "" };
const MAX_BULK = 50;

// Reads a CSV with phone + name (+ optional purpose) columns.
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { rows: [], error: "CSV must have a header row and at least one data row." };
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z_]/g, ""));
  const find = (...aliases) => {
    for (const a of aliases) {
      const i = headers.indexOf(a);
      if (i !== -1) return i;
    }
    return -1;
  };
  const phoneCol = find("phone", "phone_number", "number", "mobile", "phonenumber");
  const nameCol = find("name", "customer_name", "customername", "customer", "contact");
  const purposeCol = find("purpose", "reason", "notes", "note", "description");
  if (phoneCol === -1) return { rows: [], error: "CSV must have a 'phone' column." };
  if (nameCol === -1) return { rows: [], error: "CSV must have a 'name' column." };
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
    const phone = cols[phoneCol] || "";
    const name = cols[nameCol] || "";
    const purpose = purposeCol !== -1 ? cols[purposeCol] || "" : "";
    if (!phone && !name) continue;
    rows.push({ phone, name, purpose });
  }
  if (!rows.length) return { rows: [], error: "No valid rows found in CSV." };
  if (rows.length > MAX_BULK) return { rows: [], error: `A CSV can have at most ${MAX_BULK} recipients (found ${rows.length}).` };
  return { rows, error: null };
}

function downloadTemplate() {
  const csv =
    "phone,name,purpose\n+919876543210,Rahul Sharma,Product demo\n+919876543211,Priya Patel,Follow up\n+919876543212,Amit Shah,Appointment confirmation";
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: "call_list_template.csv" });
  a.click();
  URL.revokeObjectURL(url);
}

export default function StartCall() {
  const [form, setForm]             = useState(initialForm);
  const [vars, setVars]             = useState([]); // optional extra variables: [{ key, value }]
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [pathways, setPathways]     = useState([]); // deployed pathways only
  const navigate                    = useNavigate();

  // Multiple calls
  const [mode, setMode]                   = useState("single"); // "single" | "multiple"
  const [recipients, setRecipients]       = useState([{ ...EMPTY_RECIPIENT }, { ...EMPTY_RECIPIENT }]);
  const [bulkPathwayId, setBulkPathwayId] = useState("");
  const [bulkResults, setBulkResults]     = useState(null);
  const [csvError, setCsvError]           = useState("");
  const csvInputRef                       = useRef(null);

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

  // ── Multiple calls ───────────────────────────────────────────────────────
  const updateRecipient = (i, field) => (e) =>
    setRecipients((list) => list.map((r, idx) => (idx === i ? { ...r, [field]: e.target.value } : r)));
  const addRecipient = () => setRecipients((list) => [...list, { ...EMPTY_RECIPIENT }]);
  const removeRecipient = (i) => setRecipients((list) => list.filter((_, idx) => idx !== i));

  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { rows, error: csvProblem } = parseCSV(String(ev.target.result || ""));
      if (csvProblem) setCsvError(csvProblem);
      else setRecipients(rows);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (submitLock.current) return;
    setError("");
    setBulkResults(null);

    const valid = recipients.filter((r) => r.phone.trim() || r.name.trim());
    if (!valid.length) {
      setError("Add at least one recipient.");
      return;
    }
    if (valid.length > MAX_BULK) {
      setError(`You can call at most ${MAX_BULK} people at once.`);
      return;
    }
    for (const r of valid) {
      const problem = checkPhone(r.phone);
      if (problem) {
        setError(`${r.name || r.phone || "A recipient"}: ${problem}`);
        return;
      }
      if (!r.name.trim()) {
        setError(`Enter a name for ${r.phone}.`);
        return;
      }
    }

    submitLock.current = true;
    setSubmitting(true);
    try {
      const res = await startBulkCalls(
        valid.map((r) => ({
          phoneNumber: r.phone.trim(),
          customerName: r.name.trim(),
          purpose: r.purpose.trim(),
          pathwayId: bulkPathwayId || undefined,
        }))
      );
      setBulkResults(res);
    } catch (err) {
      setError(err.message || "Failed to start calls. Check server logs.");
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  };

  const resetBulk = () => {
    setBulkResults(null);
    setRecipients([{ ...EMPTY_RECIPIENT }, { ...EMPTY_RECIPIENT }]);
    setError("");
    setCsvError("");
  };

  const filledCount = recipients.filter((r) => r.phone.trim()).length;

  return (
    <DashboardShell
      title="Start a Call"
      subtitle="Start a single call or call multiple people at once."
    >
      <div className="mx-auto max-w-2xl">
        {/* Mode toggle */}
        <div className="mb-5 flex rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
          {[
            ["single", User, "Single Call"],
            ["multiple", Users, "Multiple Calls"],
          ].map(([val, Icon, label]) => (
            <button
              key={val}
              type="button"
              disabled={submitting}
              onClick={() => {
                setMode(val);
                setError("");
                setBulkResults(null);
                setCsvError("");
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all disabled:opacity-60 ${
                mode === val
                  ? "bg-[var(--color-accent)] text-white shadow"
                  : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {mode === "single" && (
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
        )}

        {/* ── MULTIPLE CALLS ── */}
        {mode === "multiple" && !bulkResults && (
          <form
            onSubmit={handleBulkSubmit}
            className="flex flex-col gap-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-start gap-3 rounded-xl border border-[var(--color-accent-dim)] bg-[var(--color-accent-dim)] px-4 py-3">
              <Users size={16} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
              <p className="text-xs text-[var(--color-ink-soft)]">
                Each number gets its own AI call, placed together in small groups. Every call is
                real and uses your Edesy calling credits. Up to {MAX_BULK} recipients at a time.
              </p>
            </div>

            {/* CSV upload row */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-ink)]">Recipients ({filledCount})</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-sunk)]"
                >
                  <Download size={13} /> Sample CSV
                </button>
                <button
                  type="button"
                  onClick={() => csvInputRef.current?.click()}
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-lg bg-[var(--color-accent-dim)] px-3 py-1.5 text-xs font-medium text-[var(--color-accent)] hover:opacity-80 disabled:opacity-60"
                >
                  <Upload size={13} /> Upload CSV
                </button>
                <input ref={csvInputRef} type="file" accept=".csv,text/csv" onChange={handleCSVUpload} className="hidden" />
              </div>
            </div>

            {csvError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-600">
                {csvError} — CSV must have columns: <strong>phone, name</strong> (purpose is optional).
              </div>
            )}

            <p className="text-xs text-[var(--color-ink-muted)]">
              Upload a CSV with <code className="rounded bg-[var(--color-surface-sunk)] px-1">phone, name, purpose</code>{" "}
              columns — or fill the rows manually below.
            </p>

            {/* Table header */}
            <div className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 px-1">
              <span className="text-xs font-semibold text-[var(--color-ink-muted)]">Phone number</span>
              <span className="text-xs font-semibold text-[var(--color-ink-muted)]">Customer name</span>
              <span className="text-xs font-semibold text-[var(--color-ink-muted)]">Purpose (optional)</span>
              <span />
            </div>

            {/* Recipient rows */}
            {recipients.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_32px] items-center gap-2">
                <input
                  type="tel"
                  placeholder="+919876543210"
                  value={r.phone}
                  onChange={updateRecipient(i, "phone")}
                  disabled={submitting}
                  className={`${inputClasses} font-[family-name:var(--font-mono)] text-xs`}
                />
                <input
                  placeholder="Rahul Sharma"
                  value={r.name}
                  onChange={updateRecipient(i, "name")}
                  disabled={submitting}
                  className={`${inputClasses} text-xs`}
                />
                <input
                  placeholder="Product demo"
                  value={r.purpose}
                  onChange={updateRecipient(i, "purpose")}
                  disabled={submitting}
                  className={`${inputClasses} text-xs`}
                />
                <button
                  type="button"
                  onClick={() => removeRecipient(i)}
                  disabled={submitting || recipients.length <= 1}
                  aria-label="Remove recipient"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunk)] disabled:opacity-30"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addRecipient}
              disabled={submitting || recipients.length >= MAX_BULK}
              className="flex items-center gap-1.5 self-start rounded-lg px-3 py-2 text-xs font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent-dim)] disabled:opacity-50"
            >
              <Plus size={13} /> Add another recipient
            </button>

            <Field
              label="Pathway for all calls (optional)"
              hint={
                pathways.length === 0
                  ? "No deployed pathways yet. Build one in Pathways and click Deploy."
                  : "The same pathway is applied to every call in this batch."
              }
            >
              <select
                value={bulkPathwayId}
                onChange={(e) => setBulkPathwayId(e.target.value)}
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

            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

            <div className="mt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting || filledCount === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {bulkPathwayId ? "Preparing AI agent…" : `Starting ${filledCount} calls…`}
                  </>
                ) : (
                  <>
                    <PhoneCall size={16} />
                    Start {filledCount} Call{filledCount !== 1 ? "s" : ""}
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setRecipients([{ ...EMPTY_RECIPIENT }, { ...EMPTY_RECIPIENT }]);
                  setBulkPathwayId("");
                  setError("");
                  setCsvError("");
                }}
                className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-medium text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface-sunk)] disabled:opacity-60"
              >
                Reset
              </button>
            </div>
          </form>
        )}

        {/* ── BULK RESULTS ── */}
        {mode === "multiple" && bulkResults && (
          <div className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-[var(--color-ink)]">Calls started</h3>
                <p className="text-sm text-[var(--color-ink-muted)]">
                  {bulkResults.summary?.succeeded ?? 0} succeeded · {bulkResults.summary?.failed ?? 0} failed
                </p>
              </div>
              <button
                type="button"
                onClick={resetBulk}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-sunk)]"
              >
                Start more calls
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {(bulkResults.results || []).map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                    r.success ? "border border-green-100 bg-green-50" : "border border-red-100 bg-red-50"
                  }`}
                >
                  {r.success ? (
                    <CheckCircle size={16} className="shrink-0 text-green-500" />
                  ) : (
                    <XCircle size={16} className="shrink-0 text-red-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--color-ink)]">{r.phoneNumber}</p>
                    {r.success ? (
                      <p className="text-xs text-green-600">Call ID: {r.conversationId}</p>
                    ) : (
                      <p className="text-xs text-red-600">{r.error}</p>
                    )}
                  </div>
                  {r.success && (
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/calls/${r.conversationId}`)}
                      className="shrink-0 text-xs font-medium text-[var(--color-accent)] hover:underline"
                    >
                      View
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}