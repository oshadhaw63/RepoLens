"use client";

import { useEffect, useMemo, useState } from "react";
import { GitBranch, Search } from "lucide-react";
import { createOnboardingPath } from "@/lib/repolens/create-onboarding-path";
import { getExternalDependencies } from "@/lib/repolens/get-external-dependencies"
import { FileDetailsPanel } from "@/components/file-details-panel";
import { RepoGraph } from "@/components/repo-graph";
import type {
  RepoEdge,
  RepoGraphData,
  RepoNode,
} from "@/lib/repolens/graph-types";

type RepoScanResponse = {
  fileCount: number;
  graph: RepoGraphData;
};

const emptyGraph: RepoGraphData = {
  nodes: [],
  edges: [],
};

export function RepoExplorer() {
  const [graph, setGraph] = useState<RepoGraphData>(emptyGraph);
  const [selectedNode, setSelectedNode] = useState<RepoNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadRepoGraph() {
      try {
        const response = await fetch("/api/repo-scan");

        if (!response.ok) {
          throw new Error("Could not load repo graph.");
        }

        const data = (await response.json()) as RepoScanResponse;

        setGraph(data.graph);
        setSelectedNode(data.graph.nodes[0] ?? null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unknown error.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadRepoGraph();
  }, []);

  const filteredNodes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return graph.nodes;
    }

    return graph.nodes.filter((node) => {
      const searchableText = [
        node.data.label,
        node.data.path,
        node.data.kind,
        node.data.summary,
        node.data.risk.level,
        node.data.risk.reason,
        ...node.data.dependencies,
        ...node.data.imports,
        ...node.data.exports,
        ...node.data.functions,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [graph.nodes, searchQuery]);

  const filteredNodeIds = useMemo(() => {
    return new Set(filteredNodes.map((node) => node.id));
  }, [filteredNodes]);

  const filteredEdges: RepoEdge[] = useMemo(() => {
    return graph.edges.filter((edge) => {
      return filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target);
    });
  }, [graph.edges, filteredNodeIds]);

  const usedBy = useMemo(() => {
    if (!selectedNode) {
      return [];
    }

    return graph.edges
      .filter((edge) => edge.target === selectedNode.id)
      .map((edge) => edge.source);
  }, [graph.edges, selectedNode]);

  useEffect(() => {
    if (selectedNode && filteredNodeIds.has(selectedNode.id)) {
      return;
    }

    setSelectedNode(filteredNodes[0] ?? null);
  }, [filteredNodes, filteredNodeIds, selectedNode]);

  const graphStats = useMemo(() => {
    return {
      files: graph.nodes.length,
      dependencies: graph.edges.length,
      mediumRiskFiles: graph.nodes.filter(
        (node) => node.data.risk.level === "medium",
      ).length,
      highRiskFiles: graph.nodes.filter((node) => node.data.risk.level === "high")
        .length,
    };
  }, [graph.nodes, graph.edges]);

  const onboardingPath = useMemo(() => {
    return createOnboardingPath(graph.nodes);
  }, [graph.nodes]);

  const externalDependencies = useMemo(() => {
    return getExternalDependencies(graph.nodes);
  }, [graph.nodes]);
  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      <header className="border-b border-stone-300 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <GitBranch className="h-6 w-6 text-teal-700" />
            <h1 className="text-xl font-semibold">RepoLens</h1>
          </div>
          <div className="hidden items-center gap-3 text-xs text-stone-600 md:flex">
            <span>{graphStats.files} files</span>
            <span>{graphStats.dependencies} links</span>
            <span>{graphStats.mediumRiskFiles} medium risk</span>
            <span>{graphStats.highRiskFiles} high risk</span>
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
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-stone-500">
              Loading repository graph...
            </div>
          ) : errorMessage ? (
            <div className="flex h-full items-center justify-center text-sm text-red-600">
              {errorMessage}
            </div>
          ) : (
            <RepoGraph
              nodes={filteredNodes}
              edges={filteredEdges}
              selectedNodeId={selectedNode?.id ?? ""}
              onNodeSelect={setSelectedNode}
            />
          )}
        </div>

        <div className="space-y-6">
          {selectedNode ? (
            <FileDetailsPanel file={selectedNode.data} usedBy={usedBy} />
          ) : (
            <aside className="rounded-lg border border-stone-300 bg-white p-5 text-sm text-stone-500">
              No file selected.
            </aside>
          )}

          <aside className="rounded-lg border border-stone-300 bg-white p-5">
            <p className="text-sm font-medium text-stone-500">Onboarding path</p>
            <h2 className="mt-2 text-lg font-semibold">Suggested reading order</h2>

            <ol className="mt-4 space-y-4">
              {onboardingPath.map((item, index) => (
                <li key={item.path} className="text-sm">
                  <div className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-700 text-xs font-semibold text-white">
                      {index + 1}
                    </span>

                    <div>
                      <p className="font-medium text-stone-800">{item.label}</p>
                      <p className="mt-1 text-xs text-stone-500">{item.path}</p>
                      <p className="mt-2 leading-5 text-stone-700">{item.reason}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </aside>

          <aside className="rounded-lg border border-stone-300 bg-white p-5">
            <p className="text-sm font-medium text-stone-500">External dependencies</p>
            <h2 className="mt-2 text-lg font-semibold">Packages in use</h2>

            {externalDependencies.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {externalDependencies.map((dependency) => (
                  <li
                    key={dependency}
                    className="rounded-md border border-stone-300 bg-stone-50 px-2 py-1 text-xs text-stone-700"
                  >
                    {dependency}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-stone-500">
                No external packages detected yet.
              </p>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}