import { useState } from "react";
import { Search, Lock, X } from "lucide-react";
import { LIBRARY_NODE_TYPES } from "./Noderegistry";

export default function NodeLibrary({ onClose }) {
  const [query, setQuery] = useState("");

  const filtered = LIBRARY_NODE_TYPES.filter((item) =>
    item.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const groups = filtered.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="border-b border-[var(--color-border-soft)] px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[var(--color-ink)]">Add a call step</p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunk)] hover:text-[var(--color-ink)]"
            aria-label="Hide call steps sidebar"
            title="Hide sidebar"
          >
            <X size={16} />
          </button>
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-ink-muted)]">Drag a step onto the canvas, then connect its If and Otherwise paths.</p>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-2.5 py-1.5">
          <Search size={14} className="text-[var(--color-ink-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search nodes…"
            className="w-full bg-transparent text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3.5">
        {Object.entries(groups).map(([category, items]) => (
          <div key={category}>
            <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
              {category}
            </p>
            <div className="flex flex-col gap-1.5">
              {items.map((item) => {
                const Icon = item.icon;
                const disabled = !!item.enterprise;
                return (
                  <div
                    key={item.type}
                    draggable={!disabled}
                    onDragStart={(e) => {
                      if (disabled) return;
                      e.dataTransfer.setData("application/pathway-node-type", item.type);
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    className={`flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] px-2.5 py-2 transition-colors ${
                      disabled
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-grab hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-dim)] active:cursor-grabbing"
                    }`}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${item.color}1A`, color: item.color }}
                    >
                      <Icon size={15} strokeWidth={2.25} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-ink)]">
                        {item.label}
                        {disabled && <Lock size={10} className="text-[var(--color-ink-muted)]" />}
                      </span>
                      <span className="block truncate text-[11px] text-[var(--color-ink-muted)]">
                        {item.description}
                      </span>
                    </span>
                    {disabled && (
                      <span className="shrink-0 rounded-full bg-[var(--color-surface-sunk)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--color-ink-muted)]">
                        Enterprise
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="px-1 text-xs text-[var(--color-ink-muted)]">No nodes match “{query}”.</p>
        )}
      </div>
    </aside>
  );
}
