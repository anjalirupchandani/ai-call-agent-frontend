import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  Megaphone,
  Pause,
  Play,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import { aiAgents } from "../data/mockData";
import {
  createCampaign,
  deleteCampaign,
  getCampaigns,
  getContacts,
  getKnowledgeArticles,
  getTemplates,
  pauseCampaign,
  startCampaign,
} from "../services/api";

const STATUS_META = {
  draft: { label: "Draft", color: "bg-[var(--color-surface-sunk)] text-[var(--color-ink-muted)]", icon: FileText },
  running: { label: "Running", color: "bg-[var(--color-accent-dim)] text-[var(--color-accent-ink)]", icon: Play },
  paused: { label: "Paused", color: "bg-[var(--color-gold-dim)] text-[var(--color-gold-ink)]", icon: Pause },
  completed: { label: "Completed", color: "bg-[var(--color-signal-dim)] text-[var(--color-signal-ink)]", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-[var(--color-warn-dim)] text-[var(--color-warn-ink)]", icon: AlertCircle },
};

const INPUT_CLASSES =
  "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-dim)]";

function withId(item) {
  return { ...item, id: item.id || item._id };
}

function statusMeta(status) {
  return STATUS_META[status] || STATUS_META.draft;
}

function StatusPill({ status }) {
  const meta = statusMeta(status);
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.color}`}>
      <Icon size={12} className={status === "running" ? "animate-pulse" : ""} />
      {meta.label}
    </span>
  );
}

function parseCsvRow(row) {
  const values = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < row.length; index += 1) {
    const character = row[index];
    if (character === '"' && row[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      values.push(value.trim());
      value = "";
    } else {
      value += character;
    }
  }
  values.push(value.trim());
  return values;
}

function parseCsv(text) {
  const rows = text
    .split(/\r?\n/)
    .map((row) => parseCsvRow(row))
    .filter((row) => row.some(Boolean));
  if (!rows.length) return [];

  const first = rows[0].map((value) => value.toLowerCase());
  const phoneIndex = first.findIndex((value) => ["phone", "phone number", "phonenumber"].includes(value));
  const nameIndex = first.findIndex((value) => ["name", "full name", "contact name"].includes(value));
  const hasHeader = phoneIndex >= 0 || nameIndex >= 0;
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const resolvedPhoneIndex = hasHeader ? Math.max(phoneIndex, 0) : 1;
  const resolvedNameIndex = hasHeader ? nameIndex : 0;

  return dataRows
    .map((row) => ({
      phoneNumber: row[resolvedPhoneIndex] || "",
      name: row[resolvedNameIndex] || "",
    }))
    .filter((contact) => contact.phoneNumber);
}

function CampaignCard({ campaign, busyId, onStart, onPause, onDelete }) {
  const progress = campaign.progress || {};
  const total = progress.total ?? campaign.totalCalls ?? 0;
  const completed = progress.completed ?? campaign.completedCalls ?? 0;
  const percent = progress.percent ?? (total ? Math.round((completed / total) * 100) : 0);
  const isBusy = busyId === campaign.id;

  return (
    <div className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-shadow hover:shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-dim)] text-[var(--color-accent-ink)]">
            <Megaphone size={18} />
          </span>
          <div className="min-w-0">
            <Link
              to={`/dashboard/campaigns/${campaign.id}`}
              className="block truncate font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-ink)] hover:text-[var(--color-accent)]"
            >
              {campaign.name}
            </Link>
            <p className="mt-0.5 truncate text-xs text-[var(--color-ink-muted)]">
              {campaign.templateName || campaign.template?.name || "Unknown template"}
            </p>
          </div>
        </div>
        <StatusPill status={campaign.status} />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs text-[var(--color-ink-muted)]">
          <span>Call progress</span>
          <span>{percent}%</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]"
          role="progressbar"
          aria-label={`${campaign.name} call progress`}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={percent}
        >
          <div className="h-full rounded-full bg-[var(--color-accent)] transition-all" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-[var(--color-ink-muted)]">
          <span>{completed} completed</span>
          <span>{total} total calls</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border-soft)] pt-4">
        <span className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
          <Users size={14} /> {campaign.agentId || "Default agent"}
        </span>
        <div className="flex items-center gap-1">
          {(campaign.status === "draft" || campaign.status === "paused") && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onStart(campaign.id)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--color-accent-ink)] transition-colors hover:bg-[var(--color-accent-dim)] disabled:opacity-50"
            >
              {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
              Start
            </button>
          )}
          {campaign.status === "running" && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onPause(campaign.id)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--color-gold-ink)] transition-colors hover:bg-[var(--color-gold-dim)] disabled:opacity-50"
            >
              {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Pause size={13} />}
              Pause
            </button>
          )}
          <button
            type="button"
            disabled={isBusy}
            onClick={() => onDelete(campaign.id)}
            className="rounded-lg p-1.5 text-[var(--color-warn-ink)] transition-colors hover:bg-[var(--color-warn-dim)] disabled:opacity-50"
            title="Delete campaign"
            aria-label={`Delete ${campaign.name}`}
          >
            <Trash2 size={14} />
          </button>
          <Link
            to={`/dashboard/campaigns/${campaign.id}`}
            className="rounded-lg p-1.5 text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-surface-sunk)] hover:text-[var(--color-ink)]"
            title="View campaign"
            aria-label={`View ${campaign.name}`}
          >
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
      {children}
      {hint && <span className="text-xs text-[var(--color-ink-muted)]">{hint}</span>}
    </label>
  );
}

function CampaignModal({ onClose, onSave, contacts, templates, knowledgeArticles }) {
  const [form, setForm] = useState({
    name: "",
    templateId: templates.find((template) => template.type === "call")?.id || "",
    agentId: aiAgents[0]?.id || "agt_1",
    selectedContactIds: [],
    selectedKnowledgeArticleIds: [],
    concurrency: 3,
    pacingSeconds: 5,
    autoStart: false,
  });
  const [csvContacts, setCsvContacts] = useState([]);
  const [csvName, setCsvName] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const selectedContacts = contacts
    .filter((contact) => form.selectedContactIds.includes(contact.id || contact._id))
    .map((contact) => ({
      contactId: contact.id || contact._id,
      phoneNumber: contact.phone || contact.phoneNumber,
      name: contact.name,
    }));

  const update = (key) => (event) =>
    setForm((current) => ({
      ...current,
      [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value,
    }));

  const toggleContact = (contactId) => {
    setForm((current) => ({
      ...current,
      selectedContactIds: current.selectedContactIds.includes(contactId)
        ? current.selectedContactIds.filter((id) => id !== contactId)
        : [...current.selectedContactIds, contactId],
    }));
  };

  const toggleKnowledgeArticle = (articleId) => {
    setForm((current) => ({
      ...current,
      selectedKnowledgeArticleIds: current.selectedKnowledgeArticleIds.includes(articleId)
        ? current.selectedKnowledgeArticleIds.filter((id) => id !== articleId)
        : [...current.selectedKnowledgeArticleIds, articleId],
    }));
  };

  const handleCsv = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsvContacts(parseCsv(String(reader.result || "")));
      setCsvName(file.name);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const campaignContacts = [...selectedContacts, ...csvContacts];
      if (!form.name.trim()) throw new Error("Campaign name is required");
      if (!form.templateId) throw new Error("Select a call template");
      if (!campaignContacts.length) throw new Error("Select contacts or upload a CSV file");

      await onSave({
        name: form.name.trim(),
        templateId: form.templateId,
        agentId: form.agentId,
        knowledgeArticleIds: form.selectedKnowledgeArticleIds,
        contacts: campaignContacts,
        concurrency: Number(form.concurrency),
        pacingSeconds: Number(form.pacingSeconds),
        autoStart: form.autoStart,
      });
      onClose();
    } catch (submissionError) {
      setError(submissionError.message || "Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/30 px-4 py-6" onClick={onClose}>
      <div
        className="my-auto w-full max-w-2xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">Create Campaign</h2>
            <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">Set up one AI script for a list of contacts.</p>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Campaign name *">
            <input required placeholder="e.g., August appointment confirmations" value={form.name} onChange={update("name")} className={INPUT_CLASSES} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Call template *" hint="Only call templates can be used for campaigns.">
              <select required value={form.templateId} onChange={update("templateId")} className={INPUT_CLASSES}>
                <option value="">Select a template</option>
                {templates.filter((template) => template.type === "call").map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </Field>
            <Field label="AI agent">
              <select value={form.agentId} onChange={update("agentId")} className={INPUT_CLASSES}>
                {aiAgents.map((agent) => (
                  <option key={agent.id} value={agent.id}>{agent.name} — {agent.personality}</option>
                ))}
              </select>
            </Field>
          </div>

          {knowledgeArticles.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--color-ink)]">Knowledge Base</span>
                <span className="text-xs text-[var(--color-ink-muted)]">Optional context</span>
              </div>
              <div className="max-h-28 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] p-2">
                {knowledgeArticles.map((article) => {
                  const articleId = article.id || article._id;
                  return (
                    <label key={articleId} className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm hover:bg-[var(--color-surface-sunk)]">
                      <input type="checkbox" checked={form.selectedKnowledgeArticleIds.includes(articleId)} onChange={() => toggleKnowledgeArticle(articleId)} className="h-4 w-4 accent-[var(--color-accent)]" />
                      <span className="min-w-0 flex-1 truncate text-[var(--color-ink)]">{article.title}</span>
                      <span className="text-xs text-[var(--color-ink-muted)]">{article.category}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-ink)]">Contacts *</span>
              <span className="text-xs text-[var(--color-ink-muted)]">{selectedContacts.length + csvContacts.length} selected</span>
            </div>
            {contacts.length > 0 ? (
              <div className="max-h-36 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] p-2">
                {contacts.map((contact) => {
                  const contactId = contact.id || contact._id;
                  const checked = form.selectedContactIds.includes(contactId);
                  return (
                    <label key={contactId} className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm hover:bg-[var(--color-surface-sunk)]">
                      <input type="checkbox" checked={checked} onChange={() => toggleContact(contactId)} className="h-4 w-4 accent-[var(--color-accent)]" />
                      <span className="min-w-0 flex-1 truncate text-[var(--color-ink)]">{contact.name}</span>
                      <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-muted)]">{contact.phone || contact.phoneNumber}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-[var(--color-border)] px-3.5 py-3 text-sm text-[var(--color-ink-muted)]">No saved contacts yet. Upload a CSV to add recipients.</p>
            )}
          </div>

          <div>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-accent)] bg-[var(--color-accent-dim)] px-4 py-3 text-sm font-medium text-[var(--color-accent-ink)] transition-colors hover:bg-[var(--color-accent-dim)]">
              <Upload size={16} />
              {csvName ? `${csvName} · ${csvContacts.length} contacts` : "Upload contacts CSV"}
              <input type="file" accept=".csv,text/csv" onChange={handleCsv} className="sr-only" />
            </label>
            <p className="mt-1.5 text-xs text-[var(--color-ink-muted)]">CSV columns: name, phone. Include a country code in each phone number.</p>
          </div>

          <div className="rounded-xl border border-[var(--color-border)]">
            <button type="button" onClick={() => setAdvancedOpen((current) => !current)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-[var(--color-ink)]">
              Advanced settings
              <ChevronRight size={16} className={`text-[var(--color-ink-muted)] transition-transform ${advancedOpen ? "rotate-90" : ""}`} />
            </button>
            {advancedOpen && (
              <div className="grid gap-4 border-t border-[var(--color-border-soft)] px-4 py-4 sm:grid-cols-2">
                <Field label="Concurrent calls" hint="Maximum active calls at once.">
                  <input type="number" min="1" max="50" value={form.concurrency} onChange={update("concurrency")} className={INPUT_CLASSES} />
                </Field>
                <Field label="Pacing seconds" hint="Wait time between new calls.">
                  <input type="number" min="0" max="3600" value={form.pacingSeconds} onChange={update("pacingSeconds")} className={INPUT_CLASSES} />
                </Field>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-[var(--color-ink-soft)]">
            <input type="checkbox" checked={form.autoStart} onChange={update("autoStart")} className="h-4 w-4 accent-[var(--color-accent)]" />
            Start campaign after creation
          </label>

          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? <><Loader2 size={17} className="animate-spin" /> Creating...</> : <><Megaphone size={17} /> Create campaign</>}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [knowledgeArticles, setKnowledgeArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    setLoading(true);
    setError(null);
    try {
      const [campaignList, templateList, contactList, knowledgeList] = await Promise.all([
        getCampaigns(),
        getTemplates(),
        getContacts().catch(() => []),
        getKnowledgeArticles().catch(() => []),
      ]);
      setCampaigns((campaignList || []).map(withId));
      setTemplates((templateList || []).map(withId));
      setContacts((contactList || []).map(withId));
      setKnowledgeArticles((knowledgeList || []).map(withId));
    } catch (loadError) {
      setError(loadError.message || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      const matchesStatus = status === "all" || campaign.status === status;
      const matchesSearch = !query || campaign.name?.toLowerCase().includes(query) || campaign.templateName?.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [campaigns, search, status]);

  function flash(setter, message) {
    setter(message);
    setTimeout(() => setter(null), 3000);
  }

  async function handleCreate(data) {
    const created = withId(await createCampaign(data));
    setCampaigns((current) => [created, ...current]);
    flash(setSuccess, "Campaign created.");
  }

  async function handleStart(id) {
    setBusyId(id);
    try {
      const updated = withId(await startCampaign(id));
      setCampaigns((current) => current.map((campaign) => campaign.id === id ? updated : campaign));
      flash(setSuccess, "Campaign started.");
    } catch (actionError) {
      flash(setError, actionError.message || "Failed to start campaign");
    } finally {
      setBusyId(null);
    }
  }

  async function handlePause(id) {
    setBusyId(id);
    try {
      const updated = withId(await pauseCampaign(id));
      setCampaigns((current) => current.map((campaign) => campaign.id === id ? updated : campaign));
      flash(setSuccess, "Campaign paused.");
    } catch (actionError) {
      flash(setError, actionError.message || "Failed to pause campaign");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this campaign and all of its call records?")) return;
    setBusyId(id);
    try {
      await deleteCampaign(id);
      setCampaigns((current) => current.filter((campaign) => campaign.id !== id));
      flash(setSuccess, "Campaign deleted.");
    } catch (actionError) {
      flash(setError, actionError.message || "Failed to delete campaign");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <DashboardShell title="Campaigns" subtitle="Run coordinated outbound calls with one AI script">
      {error && <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle size={17} /><span className="flex-1">{error}</span><button type="button" onClick={() => setError(null)} aria-label="Dismiss error"><X size={16} /></button></div>}
      {success && <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle2 size={17} /><span className="flex-1">{success}</span><button type="button" onClick={() => setSuccess(null)} aria-label="Dismiss success"><X size={16} /></button></div>}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 sm:max-w-xs">
            <Search size={16} className="shrink-0 text-[var(--color-ink-muted)]" />
            <input placeholder="Search campaigns..." value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none" />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none">
            <option value="all">All statuses</option>
            {Object.entries(STATUS_META).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-ink-muted)]">{filtered.length} {filtered.length === 1 ? "campaign" : "campaigns"}</span>
          <button type="button" onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"><Plus size={16} /> New Campaign</button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center"><div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--color-accent)]" /><p className="mt-4 text-sm text-[var(--color-ink-muted)]">Loading campaigns...</p></div></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} busyId={busyId} onStart={handleStart} onPause={handlePause} onDelete={handleDelete} />)}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <Megaphone className="mx-auto h-12 w-12 text-[var(--color-ink-muted)] opacity-50" />
              <h3 className="mt-4 text-lg font-semibold text-[var(--color-ink)]">{search || status !== "all" ? "No campaigns found" : "No campaigns yet"}</h3>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{search || status !== "all" ? "Try a different search or status" : "Create a campaign to start calling multiple contacts at once"}</p>
              {!search && status === "all" && <button type="button" onClick={() => setShowModal(true)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)]"><Plus size={16} /> Create Campaign</button>}
            </div>
          )}
        </div>
      )}

      {showModal && <CampaignModal onClose={() => setShowModal(false)} onSave={handleCreate} contacts={contacts} templates={templates} knowledgeArticles={knowledgeArticles} />}
    </DashboardShell>
  );
}
