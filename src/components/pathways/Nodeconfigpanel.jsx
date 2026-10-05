import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { NODE_REGISTRY } from "./Noderegistry";
import { getKnowledgeArticles } from "../../services/api";

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[11px] leading-relaxed text-ink-muted">{hint}</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-dim";

// Which node.data keys each node type edits. This is the single source of
// truth for field visibility — a key that isn't listed here is neither shown
// nor written by the panel for that node type.
//
//   description       -> Instructions            (compiler: step text)
//   ifCondition       -> If branch               (conditional steps)
//   otherwise         -> Otherwise branch        (conditional steps)
//   transferNumber    -> Transfer-to number      (Transfer Call only)
//   knowledgeSourceId -> Knowledge source        (Knowledge Base only)
const FIELDS_BY_TYPE = {
  start: ["name", "description"],
  default: ["name", "description", "conditions", "otherwise"],
  route: ["name", "description", "conditions", "otherwise"],
  endCall: [],
  knowledgeBase: ["name", "description", "knowledgeSourceId", "conditions", "otherwise"],
  transferCall: ["name", "transferNumber", "description", "conditions", "otherwise"],

  // Pass-through node types: keep their existing name / instructions /
  // variables fields, scoped to these types only.
  webhook: ["name", "description", "variables", "conditions", "otherwise"],
  sms: ["name", "description", "variables", "conditions", "otherwise"],
  waitForResponse: ["name", "description", "variables", "conditions", "otherwise"],
  transferPathway: ["name", "description", "variables", "conditions", "otherwise"],
  toolLibrary: ["name", "description", "variables", "conditions", "otherwise"],
  pressButton: ["name", "description", "variables", "conditions", "otherwise"],
  customCode: ["name", "description", "variables", "conditions", "otherwise"],
};

// Per-type wording for the Instructions textarea (still data.description).
const INSTRUCTIONS_PLACEHOLDER = {
  start: "The greeting the agent says first, e.g. Hey there, how are you doing today?",
  default: "What the agent should say or do at this step",
  knowledgeBase: "How the agent should use the knowledge source here",
  transferCall: "What the agent says before handing the call over",
};

function fieldsFor(type) {
  return FIELDS_BY_TYPE[type] || ["name", "description"];
}

// Build the form from node.data, containing ONLY this node type's keys.
function buildForm(node) {
  const form = {};
  for (const key of fieldsFor(node.type)) {
    form[key] = key === "conditions"
      ? Array.isArray(node.data?.conditions)
        ? node.data.conditions
        : node.data?.ifCondition
          ? [{ id: "condition-1", value: node.data.ifCondition }]
          : [{ id: "condition-1", value: "" }]
      : node.data?.[key] || "";
  }
  return form;
}

export default function NodeConfigPanel({ node, onClose, onSave, onDelete }) {
  const meta = NODE_REGISTRY[node.type];
  const Icon = meta.icon;
  const fields = fieldsFor(node.type);
  const has = (key) => fields.includes(key);
  const isEndCall = node.type === "endCall";

  const [form, setForm] = useState(() => buildForm(node));
  const [sources, setSources] = useState([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);

  useEffect(() => {
    setForm(buildForm(node));
  }, [node.id]);

  // Knowledge sources are only needed by the Knowledge Base node.
  useEffect(() => {
    if (node.type !== "knowledgeBase") return undefined;
    let cancelled = false;
    setSourcesLoading(true);
    getKnowledgeArticles()
      .then((data) => {
        if (!cancelled) setSources(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setSources([]);
      })
      .finally(() => {
        if (!cancelled) setSourcesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [node.type]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  // Only this node type's keys are sent. Pathways.jsx merges them into
  // node.data via setNodes, so the compiler sees them after Save.
  function handleSave() {
    onSave(node.id, form);
  }

  const sourceIds = sources.map((s) => String(s._id || s.id));
  const selectedSourceMissing =
    form.knowledgeSourceId && !sourceIds.includes(String(form.knowledgeSourceId));

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border-soft px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `${meta.color}1A`, color: meta.color }}
          >
            <Icon size={14} strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{meta.label}</p>
            <p className="text-[11px] text-ink-muted">Node settings</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-sunk"
          aria-label="Close"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {has("name") && (
          <Field label="Step name">
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Confirm appointment"
            />
          </Field>
        )}

        {/* Transfer Call: number first, then instructions */}
        {has("transferNumber") && (
          <Field label="Transfer to number">
            <input
              type="tel"
              className={inputClass}
              value={form.transferNumber}
              onChange={(e) => update("transferNumber", e.target.value)}
              placeholder="e.g. +91 98765 43210"
            />
          </Field>
        )}

        {/* Instructions — data.description (not shown on End Call) */}
        {has("description") && (
          <Field
            label="What should the agent say or do?"
            hint="These instructions guide the agent at this point in the call."
          >
            <textarea
              className={`${inputClass} resize-none`}
              rows={4}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder={
                INSTRUCTIONS_PLACEHOLDER[node.type] || "What the agent says or does at this step"
              }
            />
          </Field>
        )}

        {/* Knowledge Base: source selector */}
        {has("knowledgeSourceId") && (
          <Field label="Knowledge source">
            <select
              className={inputClass}
              value={form.knowledgeSourceId}
              onChange={(e) => update("knowledgeSourceId", e.target.value)}
              disabled={sourcesLoading}
            >
              <option value="">
                {sourcesLoading ? "Loading sources…" : "Select a knowledge source"}
              </option>
              {selectedSourceMissing && (
                <option value={form.knowledgeSourceId}>Unavailable source</option>
              )}
              {sources.map((source) => {
                const id = String(source._id || source.id);
                return (
                  <option key={id} value={id}>
                    {source.title || source.fileName || id}
                  </option>
                );
              })}
            </select>
          </Field>
        )}

        {has("conditions") && (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-ink-soft">If the caller…</p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                Add a condition for each answer path, then connect its matching output to the next step.
              </p>
            </div>
            {form.conditions.map((condition, index) => (
              <div key={condition.id} className="flex gap-2">
                <textarea
                  className={`${inputClass} min-h-16 resize-none`}
                  rows={2}
                  value={condition.value}
                  onChange={(e) => update("conditions", form.conditions.map((item) => item.id === condition.id ? { ...item, value: e.target.value } : item))}
                  placeholder={`e.g. caller chooses option ${index + 1}`}
                />
                {form.conditions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => update("conditions", form.conditions.filter((item) => item.id !== condition.id))}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-warn-ink hover:bg-warn-dim"
                    aria-label={`Remove condition ${index + 1}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => update("conditions", [...form.conditions, { id: `condition-${Date.now()}`, value: "" }])}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-surface-sunk"
            >
              <Plus size={14} /> Add condition
            </button>
          </div>
        )}

        {has("otherwise") && (
          <div>
            <label className="mb-2 block text-xs font-semibold text-ink-soft">
              Otherwise, if the caller…
            </label>
            <p className="mb-1.5 text-[11px] leading-relaxed text-ink-muted">
              Describe what should happen for any other answer, then connect the Otherwise output to its next step.
            </p>

            <textarea
              className="w-full resize-y rounded-lg border border-dashed border-border bg-surface-sunk px-3 py-2.5 text-xs leading-relaxed text-ink-muted outline-none placeholder:text-ink-muted"
              placeholder="e.g. needs a different appointment time"
              rows={3}
              value={form.otherwise}
              onChange={(e) => update("otherwise", e.target.value)}
            />
          </div>
        )}

        {has("variables") && (
          <Field label="Variables">
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              value={form.variables}
              onChange={(e) => update("variables", e.target.value)}
              placeholder="variable_name: description"
            />
          </Field>
        )}

        {/* End Call: nothing to edit */}
        {isEndCall && (
          <p className="rounded-lg border border-dashed border-border bg-surface-sunk px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
            Call will end here
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-border-soft px-4 py-3.5">
        <button
          type="button"
          onClick={() => onDelete(node.id)}
          disabled={node.type === "start"}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-warn-ink transition-colors hover:bg-warn-dim disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Delete node"
          title={node.type === "start" ? "The start node can't be deleted" : "Delete node"}
        >
          <Trash2 size={15} />
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isEndCall}
          className="flex-1 rounded-lg bg-accent py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </aside>
  );
}
