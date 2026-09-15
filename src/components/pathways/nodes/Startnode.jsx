// Metadata for the Start node — the single, non-deletable entry point of a
// pathway. Not offered in the draggable Node Library (see nodeRegistry.js).
export const StartNodeMeta = {
  label: "Start",
  description: "The first thing your agent says on the call",
  color: "#00B89C",
  defaultData: {
    name: "Start",
    description: "Hey there, how are you doing today?",
    status: "Active",
  },
};