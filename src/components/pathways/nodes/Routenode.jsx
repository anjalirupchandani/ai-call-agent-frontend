// Metadata for the Route node — creates conditional branching with two
// labeled output handles (see nodeRegistry.js for handle definitions).
export const RouteNodeMeta = {
  label: "Route",
  description: "Create conditional branching",
  color: "#5B4FE9",
  defaultData: {
    name: "Route",
    description: "Decide the next step based on the caller's response.",
    ifCondition: "Caller asks for support",
    status: "Active",
  },
};