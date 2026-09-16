import { useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { NODE_REGISTRY } from "./Noderegistry";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-dim";

export default function NodeConfigPanel({ node, onClose, onSave, onDelete }) {
  const meta = NODE_REGISTRY[node.type];
  const Icon = meta.icon;
  const hasBranching = (meta.outputs || []).some((o) => o.id === "out-a");
  const [form, setForm] = useState({
    name: node.data.name || "",
    description: node.data.description || "",
    instructions: node.data.instructions || "",
    ifCondition: node.data.ifCondition || "",
    variables: node.data.variables || "",
  });

  useEffect(() => {
    setForm({
      name: node.data.name || "",
      description: node.data.description || "",
      instructions: node.data.instructions || "",
      ifCondition: node.data.ifCondition || "",
      variables: node.data.variables || "",
    });
  }, [node.id]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSave() {
    onSave(node.id, form);
  }

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
        <Field label="Node name">
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Confirm appointment"
          />
        </Field>

        <Field label="Description">
          <textarea
            className={`${inputClass} resize-none`}
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="What the agent says or does at this step"
          />
        </Field>

        <Field label="Instructions">
          <textarea
            className={`${inputClass} resize-none`}
            rows={3}
            value={form.instructions}
            onChange={(e) => update("instructions", e.target.value)}
            placeholder="Extra guidance the model should follow here"
          />
        </Field>

        {hasBranching ? (
          <>
            <Field label="If">
              <textarea
                className={`${inputClass} resize-none`}
                rows={2}
                value={form.ifCondition}
                onChange={(e) => update("ifCondition", e.target.value)}
                placeholder="e.g. caller asks for support"
              />
            </Field>

            <div>
              <label className="mb-2 block text-xs font-semibold text-ink-soft">
                Otherwise
              </label>

              <textarea
                className="w-full resize-y rounded-lg border border-dashed border-border bg-surface-sunk px-3 py-2.5 text-xs leading-relaxed text-ink-muted outline-none placeholder:text-ink-muted"
                placeholder="Write what should happen otherwise..."
                rows={3}
              />
            </div>
          </>
        ) : null}

        <Field label="Variables">
          <textarea
            className={`${inputClass} resize-none`}
            rows={2}
            value={form.variables}
            onChange={(e) => update("variables", e.target.value)}
            placeholder="variable_name: description"
          />
        </Field>
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
          className="flex-1 rounded-lg bg-accent py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Save
        </button>
      </div>
    </aside>
  );
}