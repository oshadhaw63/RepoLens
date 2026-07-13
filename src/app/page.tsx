"use client";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { GitBranch, Search } from "lucide-react";

const nodes: Node[] = [
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

const edges: Edge[] = [
  {
    id: "app-graph",
    source: "app",
    target: "graph",
    label: "renders",
  },
  {
    id: "app-auth",
    source: "app",
    target: "auth",
    label: "imports",
  },
  {
    id: "auth-db",
    source: "auth",
    target: "db",
    label: "queries",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      <header className="border-b border-stone-300 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <GitBranch className="h-6 w-6 text-teal-700" />
            <h1 className="text-xl font-semibold">RepoLens</h1>
          </div>

          <label className="flex w-80 items-center gap-2 rounded-md border border-stone-300 bg-stone-50 px-3 py-2 text-sm">
            <Search className="h-4 w-4 text-stone-500" />
            <input
              className="w-full bg-transparent outline-none"
              placeholder="Search files, functions, or features"
            />
          </label>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl grid-cols-[1fr_320px] gap-6 px-6 py-6">
        <div className="h-[620px] overflow-hidden rounded-lg border border-stone-300 bg-white">
          <ReactFlow nodes={nodes} edges={edges} fitView>
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        <aside className="rounded-lg border border-stone-300 bg-white p-5">
          <p className="text-sm font-medium text-stone-500">Selected file</p>
          <h2 className="mt-2 text-lg font-semibold">src/app/page.tsx</h2>
          <p className="mt-3 text-sm leading-6 text-stone-700">
            Main application screen. It renders the RepoLens interface and
            connects the graph view to the rest of the app.
          </p>

          <div className="mt-6 border-t border-stone-200 pt-4">
            <p className="text-sm font-medium">Dependencies</p>
            <ul className="mt-3 space-y-2 text-sm text-stone-700">
              <li>@xyflow/react</li>
              <li>lucide-react</li>
              <li>lib/auth.ts</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}