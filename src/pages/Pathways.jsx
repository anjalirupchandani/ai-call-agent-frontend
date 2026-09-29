import { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PathwayToolbar from "../components/pathways/Pathwaytoolbar";
import NodeLibrary from "../components/pathways/Nodelibrary";
import NodeConfigPanel from "../components/pathways/Nodeconfigpanel";
import PathwayCanvas from "../components/pathways/Pathwaycanvas";
import PathwayPreviewModal from "../components/pathways/Pathwaypreviewmodal";
import { NODE_REGISTRY } from "../components/pathways/Noderegistry";
import { getPathways, createPathway, updatePathway } from "../services/api";

const DEFAULT_NODES = [
  {
    id: "start-1",
    type: "start",
    position: { x: 120, y: 40 },
    data: {
      ...NODE_REGISTRY.start.defaultData,
      description: "Hi, this is Riley calling to confirm your appointment for Thursday at 2 PM. Does that still work for you?",
    },
  },
  {
    id: "route-1",
    type: "route",
    position: { x: 120, y: 240 },
    data: {
      ...NODE_REGISTRY.route.defaultData,
      ifCondition: "Caller confirms the appointment still works",
      otherwise: "Caller needs a different time",
    },
  },
  {
    id: "greeting-1",
    type: "default",
    position: { x: -140, y: 460 },
    data: {
      name: "Confirm appointment",
      description: "Thank them and repeat the appointment details so they know it is confirmed.",
      status: "Active",
    },
  },
  {
    id: "endcall-1",
    type: "endCall",
    position: { x: 120, y: 660 },
    data: { ...NODE_REGISTRY.endCall.defaultData },
  },
  {
    id: "newconvo-1",
    type: "default",
    position: { x: 340, y: 460 },
    data: {
      name: "Offer to rebook",
      description: "Ask what time works better and explain the next step to reschedule.",
      status: "Draft",
    },
  },
];

const DEFAULT_EDGES = [
  { id: "edge-start-route", source: "start-1", sourceHandle: "out", target: "route-1" },
  { id: "edge-route-greeting", source: "route-1", sourceHandle: "out-a", target: "greeting-1" },
  { id: "edge-greeting-endcall", source: "greeting-1", sourceHandle: "out", target: "endcall-1" },
  { id: "edge-route-newconvo", source: "route-1", sourceHandle: "out-b", target: "newconvo-1" },
  { id: "edge-newconvo-endcall", source: "newconvo-1", sourceHandle: "out", target: "endcall-1" },
];

const DEMO_POSITIONS = {
  "start-1": { x: 450, y: 20 },
  "route-1": { x: 450, y: 150 },
  "greeting-1": { x: 20, y: 300 },
  "newconvo-1": { x: 880, y: 300 },
  "endcall-1": { x: 450, y: 450 },
};
const DEMO_NODES = DEFAULT_NODES.map((node) => ({
  ...node,
  position: DEMO_POSITIONS[node.id],
}));

export default function Pathways() {
  const [pathwayId, setPathwayId] = useState(null);
  const [pathwayName, setPathwayName] = useState("Appointment confirmation");
  const [nodes, setNodes] = useState(DEFAULT_NODES);
  const [edges, setEdges] = useState(DEFAULT_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  // Load the most recently saved pathway on first visit. If the user has
  // never saved one yet, fall back to the default starter flow above —
  // it stays purely local (unsaved) until they hit Save/Deploy.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const pathways = await getPathways();
        if (!cancelled && pathways?.length) {
          const latest = pathways[0];
          setPathwayId(latest._id);
          setPathwayName(latest.name || "Appointment confirmation");
          setNodes(latest.nodes?.length ? latest.nodes : DEFAULT_NODES);
          setEdges(latest.edges?.length ? latest.edges : DEFAULT_EDGES);
        }
      } catch (err) {
        console.error("Failed to load pathways:", err);
        setToast("Couldn't load saved pathways — starting from a draft");
        setTimeout(() => setToast(null), 2600);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const deleteNode = useCallback(
    (nodeId) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node || node.type === "start") return;
      setNodes((current) => current.filter((n) => n.id !== nodeId));
      setEdges((current) => current.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNodeId(null);
    },
    [nodes],
  );

  // Delete/Backspace removes the selected node, unless typing in a field.
  useEffect(() => {
    function onKeyDown(e) {
      if (!selectedNodeId) return;
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        deleteNode(selectedNodeId);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedNodeId, deleteNode]);

  function handleSaveNode(nodeId, form) {
    setNodes((current) =>
      current.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...form } } : n)),
    );
  }

  // Persist the pathway. `status` is optional — omit it for a normal save
  // (keeps whatever is already stored) and pass "deployed" for Deploy.
  async function persist(status) {
    const payload = { name: pathwayName, nodes, edges };
    if (status) payload.status = status;

    if (pathwayId) {
      return updatePathway(pathwayId, payload);
    }

    const created = await createPathway(payload);
    setPathwayId(created._id);
    return created;
  }

  async function handleSaveFlow() {
    try {
      await persist();
      setSavedAt(
        new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
      );
    } catch (err) {
      console.error("Failed to save pathway:", err);
      setToast("Save failed — check your connection and try again");
      setTimeout(() => setToast(null), 2600);
    }
  }

  async function handleDeploy() {
    try {
      await persist("deployed");
      setSavedAt(
        new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
      );
      setToast("Pathway deployed");
    } catch (err) {
      console.error("Failed to deploy pathway:", err);
      setToast("Deploy failed — check your connection and try again");
    } finally {
      setTimeout(() => setToast(null), 2200);
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas md:flex-row">
      <Sidebar />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <PathwayToolbar
          savedAt={savedAt}
          onSave={handleSaveFlow}
          onDeploy={handleDeploy}
          onPreview={() => setShowPreview(true)}
          onDemo={() => setShowDemo(true)}
          name={pathwayName}
          onNameChange={setPathwayName}
        />

        <div className="flex min-h-0 flex-1">
          {loading ? (
            <div className="flex flex-1 items-center justify-center text-sm text-ink-muted">
              Loading pathway…
            </div>
          ) : (
            <PathwayCanvas
              nodes={nodes}
              edges={edges}
              setNodes={setNodes}
              setEdges={setEdges}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
            />
          )}

          {selectedNode ? (
            <NodeConfigPanel
              node={selectedNode}
              onClose={() => setSelectedNodeId(null)}
              onSave={handleSaveNode}
              onDelete={deleteNode}
            />
          ) : (
            <NodeLibrary />
          )}
        </div>

        {toast && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-(--shadow-pop)">
            {toast}
          </div>
        )}

        {showPreview && (
          <PathwayPreviewModal
            nodes={nodes}
            edges={edges}
            name={pathwayName}
            onClose={() => setShowPreview(false)}
          />
        )}

        {showDemo && (
          <PathwayPreviewModal
            nodes={DEMO_NODES}
            edges={DEFAULT_EDGES}
            name="Appointment confirmation demo"
            description="IF the caller confirms the time, the agent confirms the appointment. OTHERWISE, the agent offers to rebook. Follow the labeled branches to see where each answer goes."
            onClose={() => setShowDemo(false)}
          />
        )}
      </div>
    </div>
  );
}
