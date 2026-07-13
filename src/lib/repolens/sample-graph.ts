import type { Edge, Node } from "@xyflow/react";

export const sampleNodes: Node[] = [
  {
    id: "app",
    type: "input",
    position: { x: 80, y: 120 },
    data: { label: "src/app/page.tsx" },
  },
  {
    id: "graph",
    position: { x: 380, y: 80 },
    data: { label: "components/repo-graph.tsx" },
  },
  {
    id: "auth",
    position: { x: 380, y: 240 },
    data: { label: "lib/auth.ts" },
  },
  {
    id: "db",
    type: "output",
    position: { x: 700, y: 240 },
    data: { label: "lib/db.ts" },
  },
];

export const sampleEdges: Edge[] = [
  { id: "app-graph", source: "app", target: "graph", label: "renders" },
  { id: "app-auth", source: "app", target: "auth", label: "imports" },
  { id: "auth-db", source: "auth", target: "db", label: "queries" },
];