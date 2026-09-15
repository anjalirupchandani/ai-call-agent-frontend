// pages/Templates.jsx
import { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Phone,
  Mail,
  MessageSquare,
  X,
  Loader2,
} from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
} from "../services/api";

// Template Card Component
function TemplateCard({ template, onEdit, onDelete, onDuplicate }) {
  const getIcon = (type) => {
    switch (type) {
      case "call":
        return <Phone size={16} />;
      case "email":
        return <Mail size={16} />;
      case "sms":
        return <MessageSquare size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "call":
        return "Call Script";
      case "email":
        return "Email Template";
      case "sms":
        return "SMS Template";
      default:
        return type;
    }
  };

  return (
    <div className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:shadow-[var(--shadow-card)] transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="rounded-lg bg-[var(--color-accent-dim)] p-2 text-[var(--color-accent-ink)] flex-shrink-0">
            {getIcon(template.type)}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-[var(--color-ink)] truncate">
              {template.name}
            </h3>
            <p className="text-xs text-[var(--color-ink-muted)] capitalize">
              {getTypeLabel(template.type)}
            </p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
          <button
            onClick={() => onDuplicate(template)}
            className="rounded-lg p-1.5 hover:bg-[var(--color-surface-sunk)] text-[var(--color-ink-soft)] transition-colors"
            title="Duplicate"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={() => onEdit(template)}
            className="rounded-lg p-1.5 hover:bg-[var(--color-surface-sunk)] text-[var(--color-ink-soft)] transition-colors"
            title="Edit"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onDelete(template.id)}
            className="rounded-lg p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <p className="mt-2 text-sm text-[var(--color-ink-muted)] line-clamp-2">
        {template.content}
      </p>
      <div className="mt-3 flex flex-wrap gap-1">
        {template.tags?.map((tag, index) => (
          <span
            key={`${template.id}-tag-${index}`}
            className="rounded-full bg-[var(--color-surface-sunk)] px-2 py-0.5 text-xs text-[var(--color-ink-soft)]"
          >
            {tag}
          </span>
        ))}
        {template.isActive !== false && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">
            Active
          </span>
        )}
        {template.usageCount > 0 && (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
            Used {template.usageCount}x
          </span>
        )}
      </div>
    </div>
  );
}

// Add/Edit Template Modal
function TemplateModal({ template, onClose, onSave }) {
  const [form, setForm] = useState({
    id: null, // ✅ Add id field
    name: "",
    type: "call",
    content: "",
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (template) {
      setForm({
        id: template.id || template._id || null, // ✅ Handle both id and _id
        name: template.name || "",
        type: template.type || "call",
        content: template.content || "",
        tags: template.tags || [],
      });
    } else {
      setForm({
        id: null,
        name: "",
        type: "call",
        content: "",
        tags: [],
      });
    }
  }, [template]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!form.name.trim()) {
        throw new Error("Template name is required");
      }
      if (!form.content.trim()) {
        throw new Error("Template content is required");
      }

      // ✅ Pass the id when updating
      const dataToSave = {
        id: form.id, // Include id for updates
        name: form.name,
        type: form.type,
        content: form.content,
        tags: form.tags,
      };

      await onSave(dataToSave);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save template");
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !form.tags.includes(trimmed)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, trimmed] }));
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
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
            {template ? "Edit Template" : "Create Template"}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
              Template Name *
            </label>
            <input
              required
              placeholder="e.g., Sales Call Script"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-dim)]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
              Type *
            </label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, type: e.target.value }))
              }
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-dim)]"
            >
              <option value="call">Call Script</option>
              <option value="email">Email Template</option>
              <option value="sms">SMS Template</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
              Content *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Enter your template content here... Use {variables} for dynamic content"
              value={form.content}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, content: e.target.value }))
              }
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-dim)] resize-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
              Tags
            </label>
            <div className="flex gap-2">
              <input
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-dim)]"
              />
              <button
                type="button"
                onClick={addTag}
                className="rounded-xl bg-[var(--color-accent)] px-4 text-sm text-white hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full bg-[var(--color-accent-dim)] px-2 py-0.5 text-xs text-[var(--color-accent-ink)]"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              {form.tags.length === 0 && (
                <span className="text-xs text-[var(--color-ink-muted)]">
                  No tags added
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--color-accent)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : template ? (
              "Update Template"
            ) : (
              "Create Template"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// Main Templates Page
export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTemplates();
      // ✅ Handle both id and _id from MongoDB
      const formattedData = data.map((t) => ({
        ...t,
        id: t.id || t._id, // Ensure id exists
      }));
      setTemplates(formattedData || []);
    } catch (err) {
      setError(err.message || "Failed to load templates");
      console.error("Failed to load templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return templates;

    return templates.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.content?.toLowerCase().includes(q) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(q)) ||
        t.type?.toLowerCase().includes(q),
    );
  }, [templates, search]);

  const handleCreate = async (data) => {
    try {
      const newTemplate = await createTemplate(data);
      // ✅ Ensure id exists
      const formatted = {
        ...newTemplate,
        id: newTemplate.id || newTemplate._id,
      };
      setTemplates((prev) => [formatted, ...prev]);
      setSuccess("Template created successfully!");
      setTimeout(() => setSuccess(null), 3000);
      return formatted;
    } catch (err) {
      setError(err.message || "Failed to create template");
      setTimeout(() => setError(null), 3000);
      throw err;
    }
  };

  const handleUpdate = async (data) => {
    try {
      // ✅ Make sure we have an id
      if (!data.id) {
        throw new Error("Template ID is missing");
      }

      const updated = await updateTemplate(data.id, data);
      // ✅ Ensure id exists
      const formatted = { ...updated, id: updated.id || updated._id };
      setTemplates((prev) =>
        prev.map((t) => (t.id === formatted.id ? formatted : t)),
      );
      setSuccess("Template updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
      return formatted;
    } catch (err) {
      setError(err.message || "Failed to update template");
      setTimeout(() => setError(null), 3000);
      throw err;
    }
  };

  const handleDelete = async (id) => {
    if (!id) {
      setError("Template ID is missing");
      return;
    }
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setSuccess("Template deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to delete template");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDuplicate = async (template) => {
    try {
      const duplicated = await duplicateTemplate(template.id);
      // ✅ Ensure id exists
      const formatted = { ...duplicated, id: duplicated.id || duplicated._id };
      setTemplates((prev) => [formatted, ...prev]);
      setSuccess("Template duplicated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to duplicate template");
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <DashboardShell
      title="Templates"
      subtitle="Manage your call scripts and message templates"
    >
      {/* Error Message */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
          <X size={18} className="flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 border border-emerald-200">
          <span className="flex-1">{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="text-emerald-500 hover:text-emerald-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 sm:max-w-xs">
          <Search
            size={16}
            className="text-[var(--color-ink-muted)] flex-shrink-0"
          />
          <input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-ink-muted)]">
            {filtered.length} {filtered.length === 1 ? "template" : "templates"}
          </span>
          <button
            onClick={() => {
              setSelectedTemplate(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            <Plus size={16} />
            New Template
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)] mx-auto" />
            <p className="mt-4 text-sm text-[var(--color-ink-muted)]">
              Loading templates...
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((template) => (
            <TemplateCard
              key={template.id || template._id} // ✅ Use id or _id as key
              template={template}
              onEdit={(t) => {
                // ✅ Ensure template has id
                const templateWithId = { ...t, id: t.id || t._id };
                setSelectedTemplate(templateWithId);
                setShowModal(true);
              }}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <FileText className="mx-auto h-12 w-12 text-[var(--color-ink-muted)] opacity-50" />
              <h3 className="mt-4 text-lg font-semibold text-[var(--color-ink)]">
                {search ? "No templates found" : "No templates yet"}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                {search
                  ? `No templates match "${search}"`
                  : "Create your first template to get started"}
              </p>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="mt-4 text-sm text-[var(--color-accent)] hover:underline"
                >
                  Clear search
                </button>
              )}
              {!search && (
                <button
                  onClick={() => {
                    setSelectedTemplate(null);
                    setShowModal(true);
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)] transition-colors"
                >
                  <Plus size={16} />
                  Create Template
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <TemplateModal
          template={selectedTemplate}
          onClose={() => {
            setShowModal(false);
            setSelectedTemplate(null);
          }}
          onSave={selectedTemplate ? handleUpdate : handleCreate}
        />
      )}
    </DashboardShell>
  );
}
