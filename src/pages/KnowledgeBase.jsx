import { useEffect, useMemo, useState, useRef } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  X,
  Loader2,
  HelpCircle,
  Package,
  Shield,
  DollarSign,
  Headphones,
  UploadCloud,
  FileText,
  Globe,
  Link,
} from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import {
  getKnowledgeArticles,
  uploadKnowledgeDocument,
  createWebsiteKnowledgeSource,
  deleteKnowledgeArticle,
} from "../services/api";

const CATEGORIES = [
  { id: "faq", label: "FAQ", icon: HelpCircle },
  { id: "product", label: "Product", icon: Package },
  { id: "policy", label: "Policy", icon: Shield },
  { id: "pricing", label: "Pricing", icon: DollarSign },
  { id: "support", label: "Support", icon: Headphones },
];

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
];
const ACCEPTED_EXTENSIONS = ".pdf,.doc,.docx,.txt,.csv";
const MAX_FILE_SIZE_MB = 20;

function categoryMeta(category) {
  return CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];
}

function withId(item) {
  return { ...item, id: item.id || item._id };
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function KnowledgeCard({ article, onDelete }) {
  const meta = categoryMeta(article.category);
  const isWebsite = article.sourceType === "website";
  const Icon = isWebsite ? Globe : meta.icon;

  return (
    <div className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-shadow hover:shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="flex-shrink-0 rounded-lg bg-[var(--color-accent-dim)] p-2 text-[var(--color-accent-ink)]">
            <Icon size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium text-[var(--color-ink)]">
              {article.title}
            </h3>
            <p className="text-xs text-[var(--color-ink-muted)]">
              {isWebsite ? "Website" : meta.label}
              {article.fileName ? ` · ${article.fileName}` : ""}
            </p>
          </div>
        </div>
        <div className="ml-2 flex flex-shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onDelete(article.id)}
            className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {isWebsite ? (
        <a
          href={article.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex items-center gap-1 truncate text-sm text-[var(--color-accent-ink)] hover:underline"
        >
          <Link size={14} className="flex-shrink-0" />
          {article.sourceUrl}
        </a>
      ) : (
        <p className="mt-2 line-clamp-3 text-sm text-[var(--color-ink-muted)]">
          {article.content}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-1">
        {article.isActive !== false && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">
            Active
          </span>
        )}
      </div>
    </div>
  );
}

function UploadModal({ onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("faq");
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const validateAndSetFile = (candidate) => {
    if (!candidate) return;
    if (
      ACCEPTED_TYPES.length &&
      candidate.type &&
      !ACCEPTED_TYPES.includes(candidate.type)
    ) {
      setError("Unsupported file type. Use PDF, DOC, DOCX, TXT, or CSV.");
      return;
    }
    if (candidate.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File is too large. Max size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    setError(null);
    setFile(candidate);
    if (!title) {
      // Prefill title from filename (without extension)
      const base = candidate.name.replace(/\.[^/.]+$/, "");
      setTitle(base);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    validateAndSetFile(dropped);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!title.trim()) throw new Error("Title is required");
      if (!file) throw new Error("Please select a document to upload");

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("category", category);
      formData.append("file", file);

      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to upload document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">
            Upload document
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
              Title *
            </label>
            <input
              required
              placeholder="e.g. Refund policy, Onboarding guide"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-dim)]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-dim)]"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
              Document *
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                dragActive
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-dim)]"
                  : "border-[var(--color-border)] bg-[var(--color-canvas)]"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                className="hidden"
                onChange={(e) => validateAndSetFile(e.target.files?.[0])}
              />
              {file ? (
                <>
                  <FileText size={28} className="text-[var(--color-accent-ink)]" />
                  <p className="text-sm font-medium text-[var(--color-ink)]">
                    {file.name}
                  </p>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    {formatFileSize(file.size)}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                    className="mt-1 text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </>
              ) : (
                <>
                  <UploadCloud size={28} className="text-[var(--color-ink-muted)]" />
                  <p className="text-sm text-[var(--color-ink)]">
                    Drag & drop a file, or click to browse
                  </p>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    PDF, DOC, DOCX, TXT, or CSV · up to {MAX_FILE_SIZE_MB}MB
                  </p>
                </>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload document"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function WebsiteModal({ onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    let parsedUrl;
    try {
      parsedUrl = new URL(url.trim());
    } catch {
      setError("Enter a valid website URL, including https://");
      return;
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      setError("Website URL must use HTTP or HTTPS.");
      return;
    }

    setLoading(true);
    try {
      await onSave({ title: title.trim(), url: parsedUrl.href });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add website");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">Add website</h2>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Give the agent a website it can consult while answering questions.</p>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">Website URL *</label>
            <input
              required
              type="url"
              placeholder="https://example.com/help"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-dim)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">Name</label>
            <input
              placeholder="e.g. Help center"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-dim)]"
            />
          </div>
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <><Globe size={18} /> Save website</>}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function KnowledgeBase() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getKnowledgeArticles();
      setArticles((data || []).map(withId));
    } catch (err) {
      setError(err.message || "Failed to load knowledge base");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return articles.filter((a) => {
      const matchesCategory = category === "all" || a.category === category;
      const matchesSearch =
        !q ||
        a.title?.toLowerCase().includes(q) ||
        a.content?.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [articles, search, category]);

  const flash = (setter, message) => {
    setter(message);
    setTimeout(() => setter(null), 3000);
  };

  const handleUpload = async (formData) => {
    const created = withId(await uploadKnowledgeDocument(formData));
    setArticles((prev) => [created, ...prev]);
    flash(setSuccess, "Document uploaded.");
  };

  const handleWebsiteSave = async (source) => {
    const created = withId(await createWebsiteKnowledgeSource(source));
    setArticles((prev) => [created, ...prev]);
    flash(setSuccess, "Website saved. The agent can use it on calls.");
  };

  const handleDelete = async (id) => {
    if (!id || !confirm("Delete this knowledge article?")) return;
    try {
      await deleteKnowledgeArticle(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      flash(setSuccess, "Article deleted.");
    } catch (err) {
      flash(setError, err.message || "Failed to delete article");
    }
  };

  return (
    <DashboardShell
      title="Knowledge Base"
      subtitle="Facts and answers the AI agent can use on calls"
    >
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <span className="flex-1">{success}</span>
          <button type="button" onClick={() => setSuccess(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 sm:max-w-xs">
            <Search size={16} className="flex-shrink-0 text-[var(--color-ink-muted)]" />
            <input
              placeholder="Search knowledge..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-ink-muted)]">
            {filtered.length} {filtered.length === 1 ? "article" : "articles"}
          </span>
          <button
            type="button"
            onClick={() => setShowWebsiteModal(true)}
            className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-canvas)]"
          >
            <Globe size={16} />
            Add website
          </button>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)]"
          >
            <Plus size={16} />
            Upload document
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--color-accent)]" />
            <p className="mt-4 text-sm text-[var(--color-ink-muted)]">
              Loading knowledge base...
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((article) => (
            <KnowledgeCard key={article.id} article={article} onDelete={handleDelete} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-[var(--color-ink-muted)] opacity-50" />
              <h3 className="mt-4 text-lg font-semibold text-[var(--color-ink)]">
                {search || category !== "all" ? "No documents found" : "No documents yet"}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                {search || category !== "all"
                  ? "Try a different search or category"
                  : "Upload FAQs, product docs, and policies for the agent to use on calls"}
              </p>
              {!search && category === "all" && (
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)]"
                >
                  <Plus size={16} />
                  Upload document
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <UploadModal onClose={() => setShowModal(false)} onSave={handleUpload} />
      )}
      {showWebsiteModal && (
        <WebsiteModal onClose={() => setShowWebsiteModal(false)} onSave={handleWebsiteSave} />
      )}
    </DashboardShell>
  );
}
