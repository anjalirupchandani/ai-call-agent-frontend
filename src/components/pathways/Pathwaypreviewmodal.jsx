import { useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { NODE_REGISTRY, NODE_WIDTH, NODE_HEIGHT } from "./Noderegistry";

// Same math PathwayCanvas uses to route a connection between two node
// handles — duplicated here (instead of imported) so the preview stays a
// pure, read-only render of whatever nodes/edges were passed in.
function handlePosition(node, meta, handleId) {
  if (handleId === "in") {
    return { x: node.position.x + NODE_WIDTH / 2, y: node.position.y };
  }
  const outputs = meta?.outputs || [];
  const index = Math.max(
    0,
    outputs.findIndex((o) => o.id === handleId),
  );
  const pct = outputs.length <= 1 ? 50 : (100 / (outputs.length + 1)) * (index + 1);
  return {
    x: node.position.x + (NODE_WIDTH * pct) / 100,
    y: node.position.y + NODE_HEIGHT,
  };
}

function edgePath(from, to, waypoint) {
  if (waypoint) {
    const d1 = Math.max(40, Math.abs(waypoint.y - from.y) / 1.6);
    const d2 = Math.max(40, Math.abs(to.y - waypoint.y) / 1.6);
    return (
      `M ${from.x} ${from.y} C ${from.x} ${from.y + d1}, ${waypoint.x} ${waypoint.y - d1}, ${waypoint.x} ${waypoint.y} ` +
      `C ${waypoint.x} ${waypoint.y + d2}, ${to.x} ${to.y - d2}, ${to.x} ${to.y}`
    );
  }
  const dy = Math.max(60, Math.abs(to.y - from.y) / 1.6);
  return `M ${from.x} ${from.y} C ${from.x} ${from.y + dy}, ${to.x} ${to.y - dy}, ${to.x} ${to.y}`;
}

/**
 * Full-screen, read-only diagram of the pathway currently on the canvas.
 * Opened from the toolbar's Preview button.
 *
 * Deliberately built as a single SVG with a computed viewBox instead of
 * measuring the container with a ref: the browser scales an SVG to fit
 * automatically via viewBox + preserveAspectRatio, so the whole flow is
 * guaranteed to render at the right size on the very first paint — no
 * "measure after mount" timing to get wrong.
 */
export default function PathwayPreviewModal({ nodes, edges, name, description, onClose }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const view = useMemo(() => {
    if (!nodes.length) return null;
    const PAD = 60;
    const xs = nodes.map((n) => n.position.x);
    const ys = nodes.map((n) => n.position.y);
    const minX = Math.min(...xs) - PAD;
    const minY = Math.min(...ys) - PAD;
    const maxX = Math.max(...xs) + NODE_WIDTH + PAD;
    const maxY = Math.max(...ys) + NODE_HEIGHT + PAD;
    const width = Math.max(maxX - minX, NODE_WIDTH + PAD * 2);
    const height = Math.max(maxY - minY, NODE_HEIGHT + PAD * 2);

    const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const edgeLines = edges
      .map((edge) => {
        const sourceNode = nodeById[edge.source];
        const targetNode = nodeById[edge.target];
        if (!sourceNode || !targetNode) return null;
        const from = handlePosition(sourceNode, NODE_REGISTRY[sourceNode.type], edge.sourceHandle || "out");
        const to = handlePosition(targetNode, NODE_REGISTRY[targetNode.type], "in");
        const label =
          edge.sourceHandle === "out-a"
            ? `If: ${sourceNode.data?.ifCondition || "condition is met"}`
            : edge.sourceHandle === "out-b"
              ? `Otherwise: ${sourceNode.data?.otherwise || "other answers"}`
              : "";
        return {
          id: edge.id,
          d: edgePath(from, to, edge.waypoint),
          label,
          labelX: edge.waypoint ? edge.waypoint.x : (from.x + to.x) / 2,
          labelY: edge.waypoint ? edge.waypoint.y : (from.y + to.y) / 2,
        };
      })
      .filter(Boolean);

    return { minX, minY, width, height, edgeLines };
  }, [nodes, edges]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-[94vh] w-full max-w-[1600px] flex-col overflow-hidden rounded-2xl bg-surface shadow-(--shadow-pop)">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-ink">
              {name || "Pathway"} — Preview
            </h2>
            <p className="text-xs text-ink-muted">
              {nodes.length} steps · {edges.length} connections
            </p>
            {description && <p className="mt-1 max-w-3xl text-xs leading-relaxed text-ink-soft">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-soft hover:bg-surface-sunk"
            aria-label="Close preview"
          >
            <X size={16} />
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden bg-canvas">
          {!view ? (
            <div className="flex h-full items-center justify-center text-sm text-ink-muted">
              Nothing to preview yet — add some nodes first.
            </div>
          ) : (
            <svg
              viewBox={`${view.minX} ${view.minY} ${view.width} ${view.height}`}
              preserveAspectRatio="xMidYMid meet"
              className="h-full w-full"
            >
              {view.edgeLines.map((edge) => (
                <path
                  key={edge.id}
                  d={edge.d}
                  fill="none"
                  stroke="#5B4FE9"
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              ))}

              {view.edgeLines.filter((edge) => edge.label).map((edge) => (
                <foreignObject
                  key={`${edge.id}-label`}
                  x={edge.labelX - 100}
                  y={edge.labelY - 14}
                  width={200}
                  height={30}
                >
                  <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    className="truncate rounded-full border border-border bg-surface px-2.5 py-1 text-center text-[11px] font-semibold text-ink shadow-(--shadow-card)"
                  >
                    {edge.label}
                  </div>
                </foreignObject>
              ))}

              {nodes.map((node) => {
                const meta = NODE_REGISTRY[node.type] || {};
                const Icon = meta.icon;
                return (
                  <foreignObject
                    key={node.id}
                    x={node.position.x}
                    y={node.position.y}
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                  >
                    <div
                      xmlns="http://www.w3.org/1999/xhtml"
                      className="h-full w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-(--shadow-card)"
                    >
                      <div className="flex items-center gap-2 border-b border-border-soft px-3.5 py-2.5">
                        {Icon && (
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                            style={{ background: `${meta.color}1A`, color: meta.color }}
                          >
                            <Icon size={15} strokeWidth={2.25} />
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                          {node.data?.name || meta.label}
                        </span>
                      </div>
                      <div className="px-3.5 py-2.5">
                        <p className="line-clamp-3 text-xs leading-relaxed text-ink-muted">
                          {node.data?.description || "No description yet."}
                        </p>
                      </div>
                    </div>
                  </foreignObject>
                );
              })}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}