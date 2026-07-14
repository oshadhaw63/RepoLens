"use client";

import { Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { RepoEdge, RepoNode } from "@/lib/repolens/graph-types";

type RepoGraphProps = {
  nodes: RepoNode[];
  edges: RepoEdge[];
  selectedNodeId: string;
  onNodeSelect: (node: RepoNode) => void;
};

export function RepoGraph({
  nodes,
  edges,
  selectedNodeId,
  onNodeSelect,
}: RepoGraphProps) {
  const visibleNodes = nodes.map((node) => ({
    ...node,
    selected: node.id === selectedNodeId,
  }));

  return (
    <ReactFlow
      nodes={visibleNodes}
      edges={edges}
      fitView
      onNodeClick={(_, node) => onNodeSelect(node as RepoNode)}
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}