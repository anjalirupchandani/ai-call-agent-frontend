import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Minus, Maximize } from "lucide-react";
import WorkflowNode from "./Workflownode";
import { NODE_REGISTRY, NODE_WIDTH, NODE_HEIGHT, createNodeId } from "./Noderegistry";

const MIN_SCALE = 0.4;
const MAX_SCALE = 1.75;

function handlePosition(node, meta, handleId) {
  if (handleId === "in") {
    return { x: node.position.x + NODE_WIDTH / 2, y: node.position.y };
  }
  const outputs = meta.outputs || [];
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

function edgePath(from, to) {
  const dy = Math.max(60, Math.abs(to.y - from.y) / 1.6);
  return `M ${from.x} ${from.y} C ${from.x} ${from.y + dy}, ${to.x} ${to.y - dy}, ${to.x} ${to.y}`;
}

export default function PathwayCanvas({
  nodes,
  edges,
  setNodes,
  setEdges,
  selectedNodeId,
  onSelectNode,
}) {
  const containerRef = useRef(null);
  const [pan, setPan] = useState({ x: 140, y: 60 });
  const [scale, setScale] = useState(0.9);
  const [panning, setPanning] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [dragOverCanvas, setDragOverCanvas] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);

  const screenToWorld = useCallback(
    (clientX, clientY) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (clientX - rect.left - pan.x) / scale,
        y: (clientY - rect.top - pan.y) / scale,
      };
    },
    [pan, scale],
  );

  // ---- panning (drag on empty canvas) ----
  useEffect(() => {
    if (!panning) return;
    function onMove(e) {
      setPan({ x: panning.panX + (e.clientX - panning.startX), y: panning.panY + (e.clientY - panning.startY) });
    }
    function onUp() {
      setPanning(null);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [panning]);

  // ---- node dragging ----
  useEffect(() => {
    if (!dragging) return;
    function onMove(e) {
      const world = screenToWorld(e.clientX, e.clientY);
      setNodes((current) =>
        current.map((n) =>
          n.id === dragging.nodeId
            ? { ...n, position: { x: world.x - dragging.offsetX, y: world.y - dragging.offsetY } }
            : n,
        ),
      );
    }
    function onUp() {
      setDragging(null);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, screenToWorld, setNodes]);

  // ---- connection drawing ----
  useEffect(() => {
    if (!connecting) return;
    function onMove(e) {
      const world = screenToWorld(e.clientX, e.clientY);
      setConnecting((c) => (c ? { ...c, x: world.x, y: world.y } : c));
    }
    function onUp() {
      setConnecting(null);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [connecting, screenToWorld]);

  // Delete/Backspace removes the selected connection — a quick way to
  // disconnect two nodes without hunting for a tiny target.
  useEffect(() => {
    if (!selectedEdgeId) return;
    function onKeyDown(e) {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        setEdges((current) => current.filter((edge) => edge.id !== selectedEdgeId));
        setSelectedEdgeId(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedEdgeId, setEdges]);

  function handleCanvasMouseDown(e) {
    if (e.target !== e.currentTarget && !e.target.dataset.canvasBg) return;
    onSelectNode(null);
    setSelectedEdgeId(null);
    setPanning({ startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y });
  }

  function handleWheel(e) {
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * (1 - e.deltaY * 0.0012)));
    const worldX = (mouseX - pan.x) / scale;
    const worldY = (mouseY - pan.y) / scale;
    setPan({ x: mouseX - worldX * nextScale, y: mouseY - worldY * nextScale });
    setScale(nextScale);
  }

  function zoomBy(factor) {
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * factor)));
  }

  function fitView() {
    if (nodes.length === 0) return;
    const xs = nodes.map((n) => n.position.x);
    const ys = nodes.map((n) => n.position.y);
    const minX = Math.min(...xs) - 60;
    const minY = Math.min(...ys) - 60;
    const maxX = Math.max(...xs) + NODE_WIDTH + 60;
    const maxY = Math.max(...ys) + NODE_HEIGHT + 60;
    const rect = containerRef.current.getBoundingClientRect();
    const nextScale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, Math.min(rect.width / (maxX - minX), rect.height / (maxY - minY))),
    );
    setScale(nextScale);
    setPan({ x: -minX * nextScale, y: -minY * nextScale });
  }

  function handleHeaderMouseDown(e, node) {
    if (e.target.closest("[data-handle]")) return;
    e.stopPropagation();
    const world = screenToWorld(e.clientX, e.clientY);
    setDragging({ nodeId: node.id, offsetX: world.x - node.position.x, offsetY: world.y - node.position.y });
    onSelectNode(node.id);
    setSelectedEdgeId(null);
  }

  function handleHandleMouseDown(e, nodeId, handleId) {
    e.stopPropagation();
    const world = screenToWorld(e.clientX, e.clientY);
    setConnecting({ sourceNodeId: nodeId, sourceHandleId: handleId, x: world.x, y: world.y });
    setSelectedEdgeId(null);
  }

  // Shared by both drop targets below: the precise "in" dot, and (more
  // forgivingly) the node card as a whole.
  function completeConnection(targetNodeId) {
    if (!connecting || connecting.sourceNodeId === targetNodeId) return;
    setEdges((current) => {
      const exists = current.some(
        (edge) =>
          edge.source === connecting.sourceNodeId &&
          edge.sourceHandle === connecting.sourceHandleId &&
          edge.target === targetNodeId,
      );
      if (exists) return current;
      return [
        ...current,
        {
          id: `edge-${connecting.sourceNodeId}-${connecting.sourceHandleId}-${targetNodeId}`,
          source: connecting.sourceNodeId,
          sourceHandle: connecting.sourceHandleId,
          target: targetNodeId,
        },
      ];
    });
    setConnecting(null);
  }

  function handleHandleMouseUp(e, nodeId) {
    e.stopPropagation();
    completeConnection(nodeId);
  }

  // Lets the user release the connection anywhere on the target node's
  // card, not just its small input dot — much easier to hit, especially
  // right after dropping a brand-new node from the library.
  function handleNodeMouseUp(e, nodeId) {
    if (!connecting) return;
    e.stopPropagation();
    completeConnection(nodeId);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOverCanvas(false);
    const type = e.dataTransfer.getData("application/pathway-node-type");
    const meta = NODE_REGISTRY[type];
    if (!meta) return;
    if (meta.enterprise) return; // library already blocks drag for these
    const world = screenToWorld(e.clientX, e.clientY);
    const id = createNodeId(type);
    setNodes((current) => [
      ...current,
      {
        id,
        type,
        position: { x: world.x - NODE_WIDTH / 2, y: world.y - NODE_HEIGHT / 2 },
        data: { ...meta.defaultData },
      },
    ]);
    onSelectNode(id);
  }

  const edgeGeometry = useMemo(() => {
    const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));
    return edges
      .map((edge) => {
        const sourceNode = nodeById[edge.source];
        const targetNode = nodeById[edge.target];
        if (!sourceNode || !targetNode) return null;
        const sourceMeta = NODE_REGISTRY[sourceNode.type];
        const targetMeta = NODE_REGISTRY[targetNode.type];
        const from = handlePosition(sourceNode, sourceMeta, edge.sourceHandle || "out");
        const to = handlePosition(targetNode, targetMeta, "in");
        return { id: edge.id, d: edgePath(from, to), midX: (from.x + to.x) / 2, midY: (from.y + to.y) / 2 };
      })
      .filter(Boolean);
  }, [nodes, edges]);

  const connectingPath = useMemo(() => {
    if (!connecting) return null;
    const sourceNode = nodes.find((n) => n.id === connecting.sourceNodeId);
    if (!sourceNode) return null;
    const meta = NODE_REGISTRY[sourceNode.type];
    const from = handlePosition(sourceNode, meta, connecting.sourceHandleId);
    return edgePath(from, { x: connecting.x, y: connecting.y });
  }, [connecting, nodes]);

  // ---- minimap ----
  const minimap = useMemo(() => {
    const W = 176;
    const H = 120;
    if (nodes.length === 0) return { W, H, scale: 1, minX: 0, minY: 0, dots: [], viewport: null };
    const xs = nodes.map((n) => n.position.x);
    const ys = nodes.map((n) => n.position.y);
    const minX = Math.min(...xs) - 80;
    const minY = Math.min(...ys) - 80;
    const maxX = Math.max(...xs) + NODE_WIDTH + 80;
    const maxY = Math.max(...ys) + NODE_HEIGHT + 80;
    const mScale = Math.min(W / (maxX - minX), H / (maxY - minY));
    const dots = nodes.map((n) => ({
      id: n.id,
      x: (n.position.x - minX) * mScale,
      y: (n.position.y - minY) * mScale,
      w: Math.max(6, NODE_WIDTH * mScale),
      h: Math.max(6, NODE_HEIGHT * mScale),
    }));
    const rect = containerRef.current?.getBoundingClientRect();
    let viewport = null;
    if (rect) {
      viewport = {
        x: (-pan.x / scale - minX) * mScale,
        y: (-pan.y / scale - minY) * mScale,
        w: (rect.width / scale) * mScale,
        h: (rect.height / scale) * mScale,
      };
    }
    return { W, H, scale: mScale, minX, minY, dots, viewport };
  }, [nodes, pan, scale]);

  return (
    <div className="relative flex-1 overflow-hidden bg-[var(--color-canvas)]">
      <div
        ref={containerRef}
        data-canvas-bg
        onMouseDown={handleCanvasMouseDown}
        onWheel={handleWheel}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverCanvas(true);
        }}
        onDragLeave={() => setDragOverCanvas(false)}
        className={`h-full w-full cursor-grab active:cursor-grabbing ${dragOverCanvas ? "ring-2 ring-inset ring-[var(--color-accent)]" : ""}`}
      >
        <div
          data-canvas-bg
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "0 0",
            width: 4000,
            height: 3000,
            backgroundImage: "radial-gradient(circle, #D8D6E5 1.5px, transparent 1.5px)",
            backgroundSize: "24px 24px",
            position: "relative",
          }}
        >
          <svg
            width={4000}
            height={3000}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}
          >
            {edgeGeometry.map((edge) => {
              const isSelected = edge.id === selectedEdgeId;
              return (
                <g key={edge.id}>
                  {/* Wide invisible stroke so the thin line underneath is
                      easy to click — makes selecting a connection (to then
                      disconnect it) much less fiddly. */}
                  <path
                    d={edge.d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={16}
                    style={{ pointerEvents: "stroke", cursor: "pointer" }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEdgeId(edge.id);
                    }}
                  />
                  <path
                    d={edge.d}
                    fill="none"
                    stroke={isSelected ? "#E5484D" : "#5B4FE9"}
                    strokeWidth={isSelected ? 3 : 2}
                    strokeLinecap="round"
                  />
                  {isSelected && (
                    <g
                      transform={`translate(${edge.midX}, ${edge.midY})`}
                      style={{ pointerEvents: "auto", cursor: "pointer" }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEdges((current) => current.filter((x) => x.id !== edge.id));
                        setSelectedEdgeId(null);
                      }}
                    >
                      <circle r={9} fill="#E5484D" />
                      <line x1={-3.5} y1={-3.5} x2={3.5} y2={3.5} stroke="white" strokeWidth={1.6} strokeLinecap="round" />
                      <line x1={-3.5} y1={3.5} x2={3.5} y2={-3.5} stroke="white" strokeWidth={1.6} strokeLinecap="round" />
                    </g>
                  )}
                </g>
              );
            })}
            {connectingPath && (
              <path d={connectingPath} fill="none" stroke="#5B4FE9" strokeWidth={2} strokeDasharray="6 4" />
            )}
          </svg>

          {nodes.map((node) => (
            <WorkflowNode
              key={node.id}
              node={node}
              meta={NODE_REGISTRY[node.type]}
              selected={node.id === selectedNodeId}
              onHeaderMouseDown={(e) => handleHeaderMouseDown(e, node)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(node.id);
                setSelectedEdgeId(null);
              }}
              onHandleMouseDown={handleHandleMouseDown}
              onHandleMouseUp={handleHandleMouseUp}
              onNodeMouseUp={handleNodeMouseUp}
            />
          ))}
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-4 flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[var(--shadow-card)]">
        <button
          type="button"
          onClick={() => zoomBy(0.85)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-sunk)]"
          aria-label="Zoom out"
        >
          <Minus size={15} />
        </button>
        <span className="w-12 text-center text-xs font-medium text-[var(--color-ink-muted)]">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoomBy(1 / 0.85)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-sunk)]"
          aria-label="Zoom in"
        >
          <Plus size={15} />
        </button>
        <div className="mx-1 h-5 w-px bg-[var(--color-border-soft)]" />
        <button
          type="button"
          onClick={fitView}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-sunk)]"
          aria-label="Fit view"
        >
          <Maximize size={14} />
        </button>
      </div>

      {/* Minimap */}
      <div
        className="absolute bottom-4 right-4 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
        style={{ width: minimap.W, height: minimap.H }}
      >
        <svg width={minimap.W} height={minimap.H}>
          {minimap.dots.map((d) => (
            <rect key={d.id} x={d.x} y={d.y} width={d.w} height={d.h} rx={2} fill="#C9C6DC" />
          ))}
          {minimap.viewport && (
            <rect
              x={minimap.viewport.x}
              y={minimap.viewport.y}
              width={minimap.viewport.w}
              height={minimap.viewport.h}
              fill="rgba(91,79,233,0.08)"
              stroke="#5B4FE9"
              strokeWidth={1.5}
            />
          )}
        </svg>
      </div>
    </div>
  );
}   