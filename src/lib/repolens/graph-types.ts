import type { Edge, Node } from "@xyflow/react";

export type RepoNodeKind = "page" | "component" | "library";

export type RepoRiskLevel = "low" | "medium" | "high";

export type RepoNodeData = {
  label: string;
  path: string;
  kind: RepoNodeKind;
  summary: string;
  dependencies: string[];
  imports: string[];
  exports: string[];
  functions: string[];
  risk: {
    level: RepoRiskLevel;
    reason: string;
  };
};

export type RepoNode = Node<RepoNodeData>;

export type RepoEdge = Edge;