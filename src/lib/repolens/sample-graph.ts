import type { RepoEdge, RepoNode } from "@/lib/repolens/graph-types";

export const sampleNodes: RepoNode[] = [
  {
    id: "page",
    type: "input",
    position: { x: 80, y: 140 },
    data: {
      label: "page.tsx",
      path: "src/app/page.tsx",
      kind: "page",
      summary: "Entry page that renders the RepoLens explorer.",
      dependencies: ["components/repo-explorer.tsx"],
    },
  },
  {
    id: "explorer",
    position: { x: 380, y: 120 },
    data: {
      label: "repo-explorer.tsx",
      path: "src/components/repo-explorer.tsx",
      kind: "component",
      summary: "Controls the selected file state and page layout.",
      dependencies: ["components/repo-graph.tsx", "lib/repolens/sample-graph.ts"],
    },
  },
  {
    id: "graph",
    type: "output",
    position: { x: 720, y: 120 },
    data: {
      label: "repo-graph.tsx",
      path: "src/components/repo-graph.tsx",
      kind: "component",
      summary: "Displays the interactive dependency graph.",
      dependencies: ["@xyflow/react", "lib/repolens/sample-graph.ts"],
    },
  },
];

export const sampleEdges: RepoEdge[] = [
  { id: "page-explorer", source: "page", target: "explorer", label: "renders" },
  { id: "explorer-graph", source: "explorer", target: "graph", label: "renders" },
];