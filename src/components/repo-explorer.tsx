"use client";

import { useEffect, useMemo, useState } from "react";
import { GitBranch, Search } from "lucide-react";
import { createOnboardingPath } from "@/lib/repolens/create-onboarding-path";
import { getExternalDependencies } from "@/lib/repolens/get-external-dependencies"
import { FileDetailsPanel } from "@/components/file-details-panel";
import { RepoGraph } from "@/components/repo-graph";
import { searchRepo } from "@/lib/repolens/search-repo";
import type {
  RepoEdge,
  RepoGraphData,
  RepoNode,
} from "@/lib/repolens/graph-types";

type RepoScanResponse = {
  fileCount: number;
  graph: RepoGraphData;
  scanLimit: number;
  isLimited: boolean;
};

type ApiHealthResponse = {
  status: string;
  service: string;
};

const emptyGraph: RepoGraphData = {
  nodes: [],
  edges: [],
};

function isGitHubRepoUrl(value: string) {
  if (!value.trim()) {
    return true;
  }

  try {
    const url = new URL(value);

    return url.hostname === "github.com" && url.pathname.split("/").filter(Boolean).length >= 2;
  } catch {
    return false;
  }
}

export function RepoExplorer() {
  const [graph, setGraph] = useState<RepoGraphData>(emptyGraph);
  const [selectedNode, setSelectedNode] = useState<RepoNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [repoUrl, setRepoUrl] = useState("");
  const isRepoUrlValid = isGitHubRepoUrl(repoUrl);
  const [sourceLabel, setSourceLabel] = useState("Local RepoLens workspace");
  const [loadingLabel, setLoadingLabel] = useState("repository graph");
  const [scanLimitMessage, setScanLimitMessage] = useState<string | null>(null);

  useEffect(() => {
    loadGraphFromUrl("");
  }, []);

  useEffect(() => {
    async function checkApiHealth() {
      try {
        const response = await fetch("/api/health");

        if (!response.ok) {
          throw new Error("Health check failed.");
        }

        const data = (await response.json()) as ApiHealthResponse;

        setApiStatus(data.status === "ok" ? "ok" : "error");
      } catch {
        setApiStatus("error");
      }
    }

    checkApiHealth();
  }, []);

  async function loadGraphFromUrl(url: string) {
    setIsLoading(true);
    setErrorMessage(null);
    setLoadingLabel(url.trim() ? "GitHub repository graph" : "local repository graph");
    try {
      const endpoint = url.trim()
        ? `/api/github-scan?url=${encodeURIComponent(url.trim())}`
        : "/api/repo-scan";

      const response = await fetch(endpoint);

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Could not load repository graph.");
      }

      const data = (await response.json()) as RepoScanResponse;

      setGraph(data.graph);
      setSelectedNode(data.graph.nodes[0] ?? null);
      setSourceLabel(url.trim() ? url.trim() : "Local RepoLens workspace");
      setScanLimitMessage(
        data.isLimited && data.scanLimit
          ? `Showing first ${data.scanLimit} supported files for faster GitHub scanning.`
          : null,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unknown repository import error.",
      );
    } finally {
      setIsLoading(false);
    }
  }

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
        ...node.data.classes,
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

  const relatedFiles = useMemo(() => {
    if (!selectedNode) {
      return [];
    }

    if (selectedNode.data.kind === "folder") {
      return graph.edges
        .filter((edge) => edge.source === selectedNode.id)
        .map((edge) => edge.target);
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

  const searchResults = useMemo(() => {
    return searchRepo(graph.nodes, searchQuery);
  }, [graph.nodes, searchQuery]);

  const [apiStatus, setApiStatus] = useState<"checking" | "ok" | "error">(
    "checking",
  );

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
            <span
              className={
                apiStatus === "ok"
                  ? "text-emerald-700"
                  : apiStatus === "error"
                    ? "text-red-600"
                    : "text-stone-500"
              }
            >
              API {apiStatus}
            </span>
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

      <section className="border-b border-stone-300 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-sm font-medium text-stone-500">Repository source</p>
            <h2 className="mt-1 text-base font-semibold">{sourceLabel}</h2>
          </div>

          <form
            className="flex flex-col items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();

              if (!isRepoUrlValid) {
                return;
              }

              loadGraphFromUrl(repoUrl);
            }}
          >
            <div className="flex items-center gap-2">
              <input
                className={`w-96 rounded-md border bg-stone-50 px-3 py-2 text-sm outline-none ${isRepoUrlValid ? "border-stone-300" : "border-red-400"
                  }`}
                placeholder="https://github.com/vercel/swr"
                value={repoUrl}
                onChange={(event) => setRepoUrl(event.target.value)}
              />

              <button
                type="submit"
                className="rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:bg-stone-300 disabled:text-stone-600"
                disabled={isLoading || !isRepoUrlValid}
              >
                Import
              </button>

              <button
                type="button"
                className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:text-stone-400"
                disabled={isLoading}
                onClick={() => {
                  setRepoUrl("");
                  loadGraphFromUrl("");
                }}
              >
                Local
              </button>
            </div>

            {isRepoUrlValid ? null : (
              <p className="text-xs text-red-600">
                Enter a valid GitHub repository URL.
              </p>
            )}
          </form>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[1fr_320px]">
        <div className="h-[620px] overflow-hidden rounded-lg border border-stone-300 bg-white">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-stone-500">
              Loading {loadingLabel}...
            </div>
          ) : errorMessage ? (
            <div className="flex h-full items-center justify-center text-sm text-red-600">
              {errorMessage}
            </div>
          ) : filteredNodes.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div>
                <p className="text-sm font-medium text-stone-700">No matching files</p>
                <p className="mt-2 text-sm text-stone-500">
                  Try searching for a file name, function, import, or package.
                </p>
              </div>
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
          {searchQuery.trim() ? (
            <aside className="rounded-lg border border-stone-300 bg-white p-5">
              <p className="text-sm font-medium text-stone-500">Search results</p>
              <h2 className="mt-2 text-lg font-semibold">Best matches</h2>

              {searchResults.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {searchResults.map((result) => (
                    <li key={result.path}>
                      <button
                        type="button"
                        className="w-full rounded-md border border-stone-200 bg-stone-50 p-3 text-left hover:border-teal-500 hover:bg-teal-50"
                        onClick={() => {
                          const matchingNode = graph.nodes.find(
                            (node) => node.data.path === result.path,
                          );

                          if (matchingNode) {
                            setSelectedNode(matchingNode);
                          }
                        }}
                      >
                        <p className="text-sm font-medium text-stone-800">
                          {result.label}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">{result.path}</p>
                        <p className="mt-2 text-xs leading-5 text-stone-700">
                          Matched {result.matches.join(", ")}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-stone-500">No matching files found.</p>
              )}
            </aside>
          ) : null}
          {selectedNode ? (
            <FileDetailsPanel file={selectedNode.data} relatedFiles={relatedFiles} />
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