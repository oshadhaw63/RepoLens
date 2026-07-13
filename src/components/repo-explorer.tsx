"use client";

import { useMemo, useState } from "react";
import { GitBranch, Search } from "lucide-react";

import { RepoGraph } from "@/components/repo-graph";
import {
  sampleEdges,
  sampleNodes,
  type RepoEdge,
  type RepoNode,
} from "@/lib/repolens/sample-graph";

export function RepoExplorer() {
  const [selectedNode, setSelectedNode] = useState<RepoNode>(sampleNodes[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNodes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return sampleNodes;
    }

    return sampleNodes.filter((node) => {
      const searchableText = [
        node.data.label,
        node.data.path,
        node.data.kind,
        node.data.summary,
        ...node.data.dependencies,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [searchQuery]);

  const filteredNodeIds = new Set(filteredNodes.map((node) => node.id));

  const filteredEdges: RepoEdge[] = sampleEdges.filter((edge) => {
    return filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target);
  });

  const selectedFile = selectedNode.data;

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
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[1fr_320px]">
        <div className="h-[620px] overflow-hidden rounded-lg border border-stone-300 bg-white">
          <RepoGraph
            nodes={filteredNodes}
            edges={filteredEdges}
            selectedNodeId={selectedNode.id}
            onNodeSelect={setSelectedNode}
          />
        </div>

        <aside className="rounded-lg border border-stone-300 bg-white p-5">
          <p className="text-sm font-medium text-stone-500">{selectedFile.kind}</p>
          <h2 className="mt-2 text-lg font-semibold">{selectedFile.label}</h2>
          <p className="mt-1 text-sm text-stone-500">{selectedFile.path}</p>
          <p className="mt-4 text-sm leading-6 text-stone-700">
            {selectedFile.summary}
          </p>

          <div className="mt-6 border-t border-stone-200 pt-4">
            <p className="text-sm font-medium">Dependencies</p>
            <ul className="mt-3 space-y-2 text-sm text-stone-700">
              {selectedFile.dependencies.map((dependency) => (
                <li key={dependency}>{dependency}</li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}