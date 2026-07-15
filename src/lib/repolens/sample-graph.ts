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
      imports: ["RepoExplorer from @/components/repo-explorer"],
      exports: ["default Home"],
      functions: ["Home"],
      risk: {
        level: "low",
        reason: "Small entry file with one responsibility: render the explorer.",
      },
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
      dependencies: [
        "components/repo-graph.tsx",
        "components/file-details-panel.tsx",
        "lib/repolens/sample-graph.ts",
      ],
      imports: [
        "useMemo and useState from react",
        "GitBranch and Search from lucide-react",
        "RepoGraph",
        "FileDetailsPanel",
        "sample graph data",
      ],
      exports: ["RepoExplorer"],
      functions: ["RepoExplorer", "filteredNodes search calculation"],
      risk: {
        level: "medium",
        reason:
          "Owns search state, selected file state, filtering, and layout coordination.",
      },
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
      dependencies: ["@xyflow/react", "lib/repolens/graph-types.ts"],
      imports: ["React Flow components", "React Flow styles", "Repo graph types"],
      exports: ["RepoGraph"],
      functions: ["RepoGraph"],
      risk: {
        level: "medium",
        reason:
          "Depends on browser-only graph interactions, so it must stay a client component.",
      },
    },
  },
];

export const sampleEdges: RepoEdge[] = [
  { id: "page-explorer", source: "page", target: "explorer", label: "renders" },
  { id: "explorer-graph", source: "explorer", target: "graph", label: "renders" },
];