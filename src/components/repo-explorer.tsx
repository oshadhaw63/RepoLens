"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  FileWarning,
  GitBranch,
  HardDrive,
  Link2,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  ShieldAlert,
  UploadCloud,
} from "lucide-react";
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
  const [apiStatus, setApiStatus] = useState<"checking" | "ok" | "error">(
    "checking",
  );
  const [isGraphExpanded, setIsGraphExpanded] = useState(false);

  useEffect(() => {
    loadGraphFromUrl("");
  }, []);

  useEffect(() => {
    if (!isGraphExpanded) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsGraphExpanded(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isGraphExpanded]);

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

  return (
    <main className="flex min-h-screen flex-col bg-slate-50 text-slate-900 lg:h-screen lg:overflow-hidden">
      <header className="sticky top-0 z-20 shrink-0 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1800px] flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-500 shadow-sm shadow-indigo-500/30">
              <GitBranch className="h-5 w-5 text-white" />
            </span>
            <div>
              <h1 className="text-lg font-semibold leading-tight tracking-tight">
                RepoLens
              </h1>
              <p className="text-xs text-slate-500">Repository intelligence</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <StatPill label="files" value={graphStats.files} tone="slate" />
            <StatPill label="links" value={graphStats.dependencies} tone="slate" icon={<Link2 className="h-3.5 w-3.5" />} />
            <StatPill
              label="medium risk"
              value={graphStats.mediumRiskFiles}
              tone="amber"
              icon={<FileWarning className="h-3.5 w-3.5" />}
            />
            <StatPill
              label="high risk"
              value={graphStats.highRiskFiles}
              tone="red"
              icon={<ShieldAlert className="h-3.5 w-3.5" />}
            />
            <span
              className={`ml-1 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                apiStatus === "ok"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : apiStatus === "error"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  apiStatus === "ok"
                    ? "bg-emerald-500"
                    : apiStatus === "error"
                      ? "bg-red-500"
                      : "animate-pulse bg-slate-400"
                }`}
              />
              API {apiStatus}
            </span>
          </div>

          <label className="flex w-full items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm shadow-sm transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 sm:w-80">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
              placeholder="Search files, functions, or features"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
        </div>
      </header>

      <section className="shrink-0 border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1800px] flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Repository source
            </p>
            <h2 className="mt-1 truncate text-base font-semibold text-slate-800">
              {sourceLabel}
            </h2>
            {scanLimitMessage ? (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {scanLimitMessage}
              </p>
            ) : null}
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
            <div className="flex flex-wrap items-center gap-2">
              <input
                className={`w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500/20 sm:w-96 ${
                  isRepoUrlValid
                    ? "border-slate-300 focus:border-indigo-500"
                    : "border-red-400 focus:border-red-500"
                }`}
                placeholder="https://github.com/vercel/swr"
                value={repoUrl}
                onChange={(event) => setRepoUrl(event.target.value)}
              />

              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                disabled={isLoading || !isRepoUrlValid}
              >
                <UploadCloud className="h-4 w-4" />
                <span>Import</span>
              </button>

              <button
                type="button"
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                disabled={isLoading}
                onClick={() => {
                  setRepoUrl("");
                  loadGraphFromUrl("");
                }}
              >
                <HardDrive className="h-4 w-4" />
                <span>Local</span>
              </button>

              <button
                type="button"
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                disabled={isLoading || !isRepoUrlValid}
                onClick={() => {
                  loadGraphFromUrl(repoUrl);
                }}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            {isRepoUrlValid ? null : (
              <p className="flex items-center gap-1.5 text-xs text-red-600">
                <AlertTriangle className="h-3.5 w-3.5" />
                Enter a valid GitHub repository URL.
              </p>
            )}
          </form>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1800px] grid-cols-1 gap-6 px-6 py-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-10">
        <div
          className={
            isGraphExpanded
              ? "fixed inset-0 z-50 flex flex-col overflow-hidden bg-white"
              : "flex h-[620px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:h-full lg:min-h-0"
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-semibold text-slate-700">Dependency graph</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <LegendDot color="#4f46e5" label="Selected" />
              <LegendDot color="#818cf8" label="Connected" />
              <LegendDot color="#f59e0b" label="Folder" />
              <LegendDot color="#d6d3d1" label="File" />
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                onClick={() => setIsGraphExpanded((expanded) => !expanded)}
                aria-label={isGraphExpanded ? "Exit full screen" : "Expand to full screen"}
              >
                {isGraphExpanded ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
                {isGraphExpanded ? "Exit full screen" : "Full screen"}
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            {isLoading ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                Loading {loadingLabel}...
              </div>
            ) : errorMessage ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-red-600">
                <AlertTriangle className="h-6 w-6" />
                {errorMessage}
              </div>
            ) : filteredNodes.length === 0 ? (
              <div className="flex h-full items-center justify-center px-6 text-center">
                <div>
                  <Search className="mx-auto h-6 w-6 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-700">No matching files</p>
                  <p className="mt-1 text-sm text-slate-500">
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
        </div>

        <div className="space-y-6 overflow-y-auto pb-2 lg:h-full lg:min-h-0 lg:pr-1">
          {searchQuery.trim() ? (
            <Card eyebrow="Search results" title="Best matches">
              {searchResults.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {searchResults.map((result) => (
                    <li key={result.path}>
                      <button
                        type="button"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-indigo-400 hover:bg-indigo-50/60"
                        onClick={() => {
                          const matchingNode = graph.nodes.find(
                            (node) => node.data.path === result.path,
                          );

                          if (matchingNode) {
                            setSelectedNode(matchingNode);
                          }
                        }}
                      >
                        <p className="text-sm font-medium text-slate-800">
                          {result.label}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{result.path}</p>
                        <p className="mt-2 text-xs leading-5 text-slate-600">
                          Matched {result.matches.join(", ")}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-500">No matching files found.</p>
              )}
            </Card>
          ) : null}
          {selectedNode ? (
            <FileDetailsPanel file={selectedNode.data} relatedFiles={relatedFiles} />
          ) : (
            <Card eyebrow="File details" title="Nothing selected">
              <p className="mt-3 text-sm text-slate-500">
                Select a node in the graph to see its details.
              </p>
            </Card>
          )}

          <Card eyebrow="Onboarding path" title="Suggested reading order">
            <ol className="mt-4 space-y-4">
              {onboardingPath.map((item, index) => (
                <li key={item.path} className="text-sm">
                  <div className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-xs font-semibold text-white">
                      {index + 1}
                    </span>

                    <div>
                      <p className="font-medium text-slate-800">{item.label}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.path}</p>
                      <p className="mt-2 leading-5 text-slate-600">{item.reason}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card eyebrow="External dependencies" title="Packages in use">
            {externalDependencies.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {externalDependencies.map((dependency) => (
                  <li
                    key={dependency}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600"
                  >
                    {dependency}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                No external packages detected yet.
              </p>
            )}
          </Card>
        </div>
      </section>

      <footer className="shrink-0 border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1800px] flex-wrap items-center justify-between gap-2 px-6 py-4 text-xs text-slate-500 lg:px-10">
          <p>RepoLens MVP: JavaScript and TypeScript repository maps.</p>
          <p>Supports local workspace scans and public GitHub repositories.</p>
        </div>
      </footer>
    </main>
  );
}

type CardProps = {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
};

function Card({ eyebrow, title, children }: CardProps) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </aside>
  );
}

type StatPillProps = {
  label: string;
  value: number;
  tone: "slate" | "amber" | "red";
  icon?: React.ReactNode;
};

const statPillTones: Record<StatPillProps["tone"], string> = {
  slate: "border-slate-200 bg-slate-50 text-slate-600",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-red-200 bg-red-50 text-red-700",
};

function StatPill({ label, value, tone, icon }: StatPillProps) {
  return (
    <span
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statPillTones[tone]}`}
    >
      {icon}
      <span className="font-semibold">{value}</span>
      {label}
    </span>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}


