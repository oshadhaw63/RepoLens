import type { Edge, Node } from "@xyflow/react";

export type RepoNodeKind = "page" | "component" | "library";

export type RepoNodeData = {
  label: string;
  path: string;
  kind: RepoNodeKind;
  summary: string;
  dependencies: string[];
};

export type RepoNode = Node<RepoNodeData>;

export type RepoEdge = Edge;