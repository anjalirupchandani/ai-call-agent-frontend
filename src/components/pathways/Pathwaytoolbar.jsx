import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Play, Save, Rocket, Check } from "lucide-react";

export default function PathwayToolbar({
  savedAt,
  onSave,
  onDeploy,
  onPreview,
  onDemo,
  name,
  onNameChange,
}) {
  const navigate = useNavigate();
  const [justSaved, setJustSaved] = useState(false);

  function handleSave() {
    onSave();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1600);
  }

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border text-ink-soft hover:bg-surface-sunk"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={16} />
        </button>

        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Pathway name"
          className="w-36 shrink-0 rounded-lg border border-border bg-canvas px-2.5 py-1.5 text-sm font-medium text-ink focus:border-accent focus:outline-none"
        />

        {savedAt && !justSaved && (
          <span className="hidden shrink-0 text-xs text-ink-muted lg:inline">Saved {savedAt}</span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onDemo}
          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-xs font-semibold text-ink-soft hover:bg-surface-sunk"
        >
          <Play size={13} />
          Demo
        </button>
        <button
          type="button"
          onClick={onPreview}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-ink-soft hover:bg-surface-sunk"
        >
          <Eye size={14} />
          Preview
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-ink-soft hover:bg-surface-sunk"
        >
          {justSaved ? <Check size={14} className="text-signal" /> : <Save size={14} />}
          {justSaved ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          onClick={onDeploy}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-white shadow-(--shadow-pop) hover:bg-accent-hover"
        >
          <Rocket size={14} />
          Deploy
        </button>
      </div>
    </header>
  );
}
