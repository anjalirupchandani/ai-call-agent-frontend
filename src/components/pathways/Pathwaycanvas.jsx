import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Plus, Minus, Maximize, LayoutDashboard } from "lucide-react";
import WorkflowNode from "./Workflownode";
import { NODE_REGISTRY, NODE_WIDTH, NODE_HEIGHT, createNodeId, getNodeOutputs } from "./Noderegistry";

const MIN_SCALE = 0.4;
const MAX_SCALE = 1.75;

function handlePosition(node, meta, handleId) {
  if (handleId === "in") {
    return { x: node.position.x + NODE_WIDTH / 2, y: node.position.y };
  }
  const outputs = getNodeOutputs(node);
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

const GRID = 12; // nodes snap to this grid while dragging, so rows/columns line up

const snap = (v) => Math.round(v / GRID) * GRID;

// A connection is a smooth curve. If the user dragged it, `waypoint` is the
// point the curve is bent through (saved on the edge, so it survives reloads).
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

// Auto-arrange: puts every node on a level (distance from the start node) and
// spreads each level evenly, centred under the one above.
function autoLayout(nodes, edges) {
  const H_GAP = NODE_WIDTH + 72;
  const V_GAP = NODE_HEIGHT + 130;
  const ids = new Set(nodes.map((n) => n.id));
  const level = {};
  const start = nodes.find((n) => n.type === "start") || nodes[0];
  if (!start) return nodes;
  level[start.id] = 0;
  // longest-path levelling, capped so a loop in the flow can't run forever
  for (let pass = 0; pass < nodes.length; pass++) {
    let changed = false;
    for (const e of edges) {
      if (!ids.has(e.source) || !ids.has(e.target) || level[e.source] === undefined) continue;
      const next = level[e.source] + 1;
      if (next < nodes.length && (level[e.target] === undefined || level[e.target] < next)) {
        level[e.target] = next;
        changed = true;
      }
    }
    if (!changed) break;
  }
  const maxLevel = Math.max(0, ...Object.values(level));
  for (const n of nodes) if (level[n.id] === undefined) level[n.id] = maxLevel + 1; // unconnected nodes go last

  const rows = {};
  for (const n of nodes) (rows[level[n.id]] ||= []).push(n);
  // keep left-to-right order stable: use the x the user already has
  Object.values(rows).forEach((row) => row.sort((a, b) => a.position.x - b.position.x));

  const widest = Math.max(...Object.values(rows).map((r) => r.length));
  const centerX = 120 + ((widest - 1) * H_GAP) / 2;
  const pos = {};
  Object.entries(rows).forEach(([lvl, row]) => {
    const startX = centerX - ((row.length - 1) * H_GAP) / 2;
    row.forEach((n, i) => {
      pos[n.id] = { x: snap(startX + i * H_GAP), y: snap(40 + Number(lvl) * V_GAP) };
    });
  });
  return nodes.map((n) => ({ ...n, position: pos[n.id] }));
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
  const hasInitialFit = useRef(false);
  const [pan, setPan] = useState({ x: 140, y: 60 });
  const [scale, setScale] = useState(0.9);
  const [panning, setPanning] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [dragOverCanvas, setDragOverCanvas] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [edgeDragging, setEdgeDragging] = useState(null); // id of the connection being bent

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
            ? { ...n, position: { x: snap(world.x - dragging.offsetX), y: snap(world.y - dragging.offsetY) } }
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

  // ---- bending a connection (drag the line) ----
  useEffect(() => {
    if (!edgeDragging) return;
    function onMove(e) {
      const world = screenToWorld(e.clientX, e.clientY);
      const waypoint = { x: snap(world.x), y: snap(world.y) };
      setEdges((current) =>
        current.map((edge) => (edge.id === edgeDragging ? { ...edge, waypoint } : edge)),
      );
    }
    function onUp() {
      setEdgeDragging(null);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [edgeDragging, screenToWorld, setEdges]);

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

  const fitView = useCallback((targetScale, alignStart = false) => {
    if (nodes.length === 0) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect?.width || !rect.height) return;
    const xs = nodes.map((n) => n.position.x);
    const ys = nodes.map((n) => n.position.y);
    const minX = Math.min(...xs) - 60;
    const minY = Math.min(...ys) - 60;
    const maxX = Math.max(...xs) + NODE_WIDTH + 60;
    const maxY = Math.max(...ys) + NODE_HEIGHT + 60;
    const width = maxX - minX;
    const height = maxY - minY;
    const nextScale = targetScale ?? Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, Math.min(rect.width / width, rect.height / height)),
    );
    setScale(nextScale);
    const startNode = nodes.find((node) => node.type === "start");
    setPan({
      x: (rect.width - width * nextScale) / 2 - minX * nextScale,
      y: alignStart && startNode
        ? 24 - startNode.position.y * nextScale
        : (rect.height - height * nextScale) / 2 - minY * nextScale,
    });
  }, [nodes]);

  useLayoutEffect(() => {
    if (hasInitialFit.current || nodes.length === 0) return;
    hasInitialFit.current = true;
    fitView(0.77, true);
  }, [fitView, nodes]);

  function arrangeNodes() {
    setNodes((current) => autoLayout(current, edges));
    // straight, default curves again — the old bends no longer fit the new layout
    setEdges((current) => current.map(withoutBend));
    setTimeout(() => fitView(), 0);
  }

  function withoutBend(edge) {
    const next = { ...edge };
    delete next.waypoint;
    return next;
  }

  function resetEdgeBend(edgeId) {
    setEdges((current) => current.map((edge) => (edge.id === edgeId ? withoutBend(edge) : edge)));
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
        const condition = sourceNode.data?.conditions?.find(
          (item) => `condition-${item.id}` === edge.sourceHandle,
        );
        const label = condition
          ? `If: ${condition.value || "condition is met"}`
          : edge.sourceHandle === "out-a"
            ? `If: ${sourceNode.data?.ifCondition || "condition is met"}`
            : edge.sourceHandle === "out-b"
              ? `Otherwise: ${sourceNode.data?.otherwise || "other answers"}`
              : "";
        return {
          id: edge.id,
          d: edgePath(from, to, edge.waypoint),
          midX: edge.waypoint ? edge.waypoint.x : (from.x + to.x) / 2,
          midY: edge.waypoint ? edge.waypoint.y : (from.y + to.y) / 2,
          label,
        };
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
    <div className="relative flex-1 overflow-hidden bg-canvas">
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
        className={`h-full w-full cursor-grab active:cursor-grabbing ${
          dragOverCanvas ? "ring-2 ring-inset ring-accent" : ""
        }`}
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
                    style={{ pointerEvents: "stroke", cursor: "move" }}
                    onMouseDown={(e) => {
                      // drag anywhere on the line to bend it
                      e.stopPropagation();
                      setSelectedEdgeId(edge.id);
                      onSelectNode(null);
                      setEdgeDragging(edge.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      resetEdgeBend(edge.id);
                    }}
                  />
                  <path
                    d={edge.d}
                    fill="none"
                    stroke={isSelected ? "#E5484D" : "#5B4FE9"}
                    strokeWidth={isSelected ? 3 : 2}
                    strokeLinecap="round"
                  />
                  {edge.label && (
                    <foreignObject
                      x={edge.midX - 100}
                      y={edge.midY - 15}
                      width={200}
                      height={30}
                      style={{ pointerEvents: "none" }}
                    >
                      <div
                        xmlns="http://www.w3.org/1999/xhtml"
                        className="truncate rounded-full border border-border bg-surface px-2.5 py-1 text-center text-[11px] font-semibold text-ink shadow-(--shadow-card)"
                      >
                        {edge.label}
                      </div>
                    </foreignObject>
                  )}
                  {isSelected && (
                    <circle
                      cx={edge.midX}
                      cy={edge.midY}
                      r={7}
                      fill="white"
                      stroke="#E5484D"
                      strokeWidth={2.5}
                      style={{ pointerEvents: "auto", cursor: "move" }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setEdgeDragging(edge.id);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        resetEdgeBend(edge.id);
                      }}
                    />
                  )}
                  {isSelected && (
                    <g
                      transform={`translate(${edge.midX + 22}, ${edge.midY})`}
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
      <div className="absolute bottom-4 left-4 flex items-center gap-1 rounded-xl border border-border bg-surface p-1 shadow-(--shadow-card)">
        <button
          type="button"
          onClick={() => zoomBy(0.85)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-surface-sunk"
          aria-label="Zoom out"
        >
          <Minus size={15} />
        </button>
        <span className="w-12 text-center text-xs font-medium text-ink-muted">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoomBy(1 / 0.85)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-surface-sunk"
          aria-label="Zoom in"
        >
          <Plus size={15} />
        </button>
        <div className="mx-1 h-5 w-px bg-border-soft" />
        <button
          type="button"
          onClick={() => fitView()}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-surface-sunk"
          aria-label="Fit view"
        >
          <Maximize size={14} />
        </button>
        <div className="mx-1 h-5 w-px bg-border-soft" />
        <button
          type="button"
          onClick={arrangeNodes}
          className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-ink-soft hover:bg-surface-sunk"
          aria-label="Auto-arrange nodes"
          title="Tidy up: line the nodes up in neat rows"
        >
          <LayoutDashboard size={14} />
          Auto-arrange
        </button>
      </div>

      {/* Minimap */}
      <div
        className="absolute bottom-4 right-4 overflow-hidden rounded-xl border border-border bg-surface shadow-(--shadow-card)"
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
