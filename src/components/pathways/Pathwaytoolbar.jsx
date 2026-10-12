import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Play, Save, Rocket, Check, Plus, ChevronDown } from "lucide-react";

export default function PathwayToolbar({
  savedAt,
  onSave,
  onDeploy,
  onPreview,
  onDemo,
  onNew,
  onSelectSavedPathway,
  staticPathways,
  savedPathways,
  isLoading,
  name,
  onNameChange,
}) {
  const navigate = useNavigate();
  const [justSaved, setJustSaved] = useState(false);
  const [selectedStaticPathway, setSelectedStaticPathway] = useState("");
  const vPanditPathway = savedPathways.find((pathway) =>
    pathway.name?.toLowerCase().startsWith("v pandit"),
  );

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
        <button
          type="button"
          onClick={onNew}
          disabled={isLoading}
          title="Create a new pathway"
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-sm font-medium text-ink-soft hover:bg-surface-sunk disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={14} />
          New pathway
        </button>
        <div className="relative shrink-0">
          <select
            aria-label="Choose a pathway"
            value={selectedStaticPathway}
            onChange={(event) => {
              const value = event.target.value;
              if (value.startsWith("saved:")) onSelectSavedPathway(value.slice(6));
              else if (value) onNew(value);
              setSelectedStaticPathway("");
            }}
            disabled={isLoading}
            className="h-9 appearance-none rounded-lg border border-border bg-surface px-3 pr-8 text-sm font-medium text-ink-soft hover:bg-surface-sunk disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>Choose a pathway</option>
            {vPanditPathway && (
              <option value={`saved:${vPanditPathway._id || vPanditPathway.id}`}>
                {vPanditPathway.name}
              </option>
            )}
            {staticPathways.map((pathway) => (
              <option key={pathway} value={pathway}>{pathway}</option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted"
          />
        </div>

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
