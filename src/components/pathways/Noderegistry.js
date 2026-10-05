import {
  Play,
  MessageSquare,
  BookOpenCheck,
  PhoneForwarded,
  PhoneOff,
  Webhook,
  Clock,
  Workflow,
  Wrench,
  Hash,
  Route,
  MessageCircle,
  Code2,
} from "lucide-react";

import { StartNodeMeta } from "./nodes/StartNode";
import { EndCallNodeMeta } from "./nodes/EndCallNode";
import { RouteNodeMeta } from "./nodes/Routenode";
import { DefaultNodeMeta } from "./nodes/DefaultNode";

// Fixed footprint used for edge-routing math. Kept generous so text never
// overflows the handle positions.
export const NODE_WIDTH = 232;
export const NODE_HEIGHT = 104;

const BRANCHING_OUTPUTS = [
  { id: "out-a", label: "If" },
  { id: "out-b", label: "Otherwise" },
];

/**
 * Every node type in Pathways is described here in one place: the icon +
 * accent color used to render it (in the library and on the canvas), the
 * default data it's created with, whether it terminates a branch, and how
 * many output handles it exposes.
 *
 * outputs: [] means terminal. Every other step can continue or branch on the caller's answer.
 */
export const NODE_REGISTRY = {
  start: {
    ...StartNodeMeta,
    icon: Play,
    hasInput: false,
    // The call always begins with one greeting, so Start has one connection.
    outputs: [{ id: "out", label: "" }],
    inLibrary: false,
  },
  default: {
    ...DefaultNodeMeta,
    icon: MessageSquare,
    hasInput: true,
    outputs: BRANCHING_OUTPUTS,
    inLibrary: true,
    category: "Conversation",
  },
  knowledgeBase: {
    label: "Knowledge Base",
    description: "Connect AI agent with uploaded knowledge",
    color: "#5B4FE9",
    icon: BookOpenCheck,
    hasInput: true,
    outputs: BRANCHING_OUTPUTS,
    inLibrary: true,
    category: "Data",
    defaultData: {
      name: "Knowledge Base",
      description: "Answer using the connected knowledge base.",
    },
  },
  transferCall: {
    label: "Transfer Call",
    description: "Transfer conversation to human agent",
    color: "#E8A23A",
    icon: PhoneForwarded,
    hasInput: true,
    outputs: BRANCHING_OUTPUTS,
    inLibrary: true,
    category: "Call control",
    defaultData: {
      name: "Transfer Call",
      description: "Transfer this call to a live agent.",
    },
  },
  endCall: {
    ...EndCallNodeMeta,
    icon: PhoneOff,
    hasInput: true,
    // Terminal — the call is over, so there's nowhere left to branch to.
    outputs: [],
    inLibrary: true,
    category: "Call control",
  },
  webhook: {
    label: "Webhook",
    description: "Trigger external action",
    color: "#00B89C",
    icon: Webhook,
    hasInput: true,
    outputs: BRANCHING_OUTPUTS,
    // Integrations section removed from the library — kept in the registry
    // only so an already-placed node of this type keeps rendering/working.
    inLibrary: false,
    category: "Integrations",
    defaultData: {
      name: "Webhook",
      description: "Call an external endpoint and continue.",
    },
  },
  waitForResponse: {
    label: "Wait For Response",
    description: "Pause and wait for user input",
    color: "#5B4FE9",
    icon: Clock,
    hasInput: true,
    outputs: BRANCHING_OUTPUTS,
    inLibrary: true,
    category: "Conversation",
    defaultData: {
      name: "Wait For Response",
      description: "Pause the flow until the caller responds.",
    },
  },
  transferPathway: {
    label: "Transfer Pathway",
    description: "Connect another pathway flow",
    color: "#5B4FE9",
    icon: Workflow,
    hasInput: true,
    outputs: BRANCHING_OUTPUTS,
    // Flow control section removed from the library — kept in the registry
    // only so an already-placed node of this type keeps rendering/working.
    inLibrary: false,
    category: "Flow control",
    defaultData: {
      name: "Transfer Pathway",
      description: "Hand off to another pathway.",
    },
  },
  toolLibrary: {
    label: "Tool From Library",
    description: "Add external tools",
    color: "#00B89C",
    icon: Wrench,
    hasInput: true,
    outputs: BRANCHING_OUTPUTS,
    // Integrations section removed from the library — kept in the registry
    // only so an already-placed node of this type keeps rendering/working.
    inLibrary: false,
    category: "Integrations",
    defaultData: {
      name: "Tool From Library",
      description: "Run a tool from the shared tool library.",
    },
  },
  pressButton: {
    label: "Press Button",
    description: "Detect keypad input",
    color: "#E8A23A",
    icon: Hash,
    hasInput: true,
    outputs: BRANCHING_OUTPUTS,
    inLibrary: true,
    category: "Conversation",
    defaultData: {
      name: "Press Button",
      description: "Listen for a DTMF keypad press.",
    },
  },
  route: {
    ...RouteNodeMeta,
    icon: Route,
    hasInput: true,
    outputs: BRANCHING_OUTPUTS,
    inLibrary: true,
    category: "Flow control",
  },
  sms: {
    label: "SMS",
    description: "Message sending node",
    color: "#837F92",
    icon: MessageCircle,
    hasInput: true,
    outputs: BRANCHING_OUTPUTS,
    inLibrary: false,
    enterprise: true,
    category: "Integrations",
    defaultData: {
      name: "SMS",
      description: "Send an SMS message to the caller.",
    },
  },
  customCode: {
    label: "Custom Code",
    description: "Custom logic node",
    color: "#837F92",
    icon: Code2,
    hasInput: true,
    outputs: BRANCHING_OUTPUTS,
    inLibrary: false,
    enterprise: true,
    category: "Flow control",
    defaultData: {
      name: "Custom Code",
      description: "Run custom logic against the conversation state.",
    },
  },
};

export function getNodeOutputs(node) {
  const conditions = Array.isArray(node?.data?.conditions) ? node.data.conditions : [];
  if (conditions.length > 0) {
    return [
      ...conditions.map((condition, index) => ({
        id: `condition-${condition.id}`,
        label: `If ${index + 1}`,
      })),
      { id: "out-b", label: "Otherwise" },
    ];
  }
  return NODE_REGISTRY[node?.type]?.outputs || [];
}

export const LIBRARY_NODE_TYPES = Object.entries(NODE_REGISTRY)
  .filter(([, meta]) => meta.inLibrary)
  .map(([type, meta]) => ({ type, ...meta }));

let idCounter = 1;
export function createNodeId(type) {
  idCounter += 1;
  return `${type}-${Date.now()}-${idCounter}`;
}
