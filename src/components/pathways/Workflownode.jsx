import { NODE_WIDTH, NODE_HEIGHT } from "./Noderegistry";

const STATUS_STYLES = {
  Active: "bg-signal-dim text-signal-ink",
  Draft: "bg-gold-dim text-gold-ink",
};

export default function WorkflowNode({
  node,
  meta,
  selected,
  onHeaderMouseDown,
  onClick,
  onHandleMouseDown,
  onHandleMouseUp,
  onNodeMouseUp,
}) {
  const Icon = meta.icon;
  const status = node.data.status || "Draft";
  const outputs = meta.outputs || [];

  function outputLabel(output) {
    if (output.id === "out-a") return "If";
    if (output.id === "out-b") return "Otherwise";
    return output.label;
  }

  return (
    <div
      data-node-card
      onMouseDown={onHeaderMouseDown}
      onClick={onClick}
      onMouseUp={(e) => onNodeMouseUp?.(e, node.id)}
      style={{
        position: "absolute",
        left: node.position.x,
        top: node.position.y,
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
      }}
      className={`group cursor-grab select-none rounded-2xl border bg-surface shadow-(--shadow-card) transition-shadow active:cursor-grabbing ${
        selected
          ? "border-accent ring-2 ring-accent-dim"
          : "border-border hover:border-ink-muted"
      }`}
    >
      {/* Input handle — hit area is bigger than the visible dot so it's
          easy to drop a connection onto, especially on a freshly-added
          node. Dropping anywhere on the card body also works (see
          onMouseUp above), this is just a precise, visually-anchored target. */}
      {meta.hasInput && (
        <div
          data-handle="in"
          onMouseUp={(e) => onHandleMouseUp?.(e, node.id, "in")}
          className="absolute -top-3 left-1/2 flex h-6 w-6 -translate-x-1/2 cursor-crosshair items-center justify-center"
        >
          <span className="h-3.5 w-3.5 rounded-full border-2 border-surface bg-ink-muted shadow transition-colors group-hover:bg-accent" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border-soft px-3.5 py-2.5">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${meta.color}1A`, color: meta.color }}
        >
          <Icon size={15} strokeWidth={2.25} />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
          {node.data.name}
        </span>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            STATUS_STYLES[status] || STATUS_STYLES.Draft
          }`}
        >
          {status}
        </span>
      </div>

      {/* Body */}
      <div className="px-3.5 py-2.5">
        <p className="line-clamp-3 text-xs leading-relaxed text-ink-muted">
          {node.data.description || "No description yet."}
        </p>
      </div>

      {/* Footer / output handles */}
      {outputs.length > 0 && (
        <div className="relative h-2 px-3.5 pb-2">
          {outputs.map((output, i) => {
            const pct =
              outputs.length === 1 ? 50 : (100 / (outputs.length + 1)) * (i + 1);
            const label = outputLabel(output);
            return (
              <div key={output.id} className="absolute" style={{ left: `${pct}%`, bottom: -16 }}>
                {label && (
                  <span className="absolute bottom-5.75 left-1/2 max-w-27.5 -translate-x-1/2 truncate whitespace-nowrap rounded-full bg-surface-sunk px-1.5 py-0.5 text-[9px] font-medium text-ink-soft">
                    {label}
                  </span>
                )}
                {/* Bigger invisible hit area around the visible dot — same
                    reasoning as the input handle above. */}
                <div
                  data-handle={output.id}
                  title={
                    output.id === "out-a"
                      ? `Connect the If path: ${node.data.ifCondition || "caller confirms"}`
                      : output.id === "out-b"
                        ? `Connect the Otherwise path: ${node.data.otherwise || "other answers"}`
                        : "Connect the next step"
                  }
                  onMouseDown={(e) => onHandleMouseDown?.(e, node.id, output.id)}
                  className="flex h-6 w-6 -translate-x-1/2 cursor-crosshair items-center justify-center"
                >
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-surface bg-accent shadow transition-transform hover:scale-125" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
