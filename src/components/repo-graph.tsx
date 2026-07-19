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
  const connectedNodeIds = new Set<string>();

  for (const edge of edges) {
    if (edge.source === selectedNodeId) {
      connectedNodeIds.add(edge.target);
    }

    if (edge.target === selectedNodeId) {
      connectedNodeIds.add(edge.source);
    }
  }

  const visibleNodes = nodes.map((node) => {
    const isSelected = node.id === selectedNodeId;
    const isConnected = connectedNodeIds.has(node.id);

    return {
      ...node,
      selected: isSelected,
      style: {
        border: isSelected
          ? "2px solid #0f766e"
          : isConnected
            ? "2px solid #14b8a6"
            : "1px solid #d6d3d1",
        background: isSelected ? "#ccfbf1" : "#ffffff",
        color: "#1c1917",
      },
    };
  });

  const visibleEdges = edges.map((edge) => {
    const isConnected =
      edge.source === selectedNodeId || edge.target === selectedNodeId;

    return {
      ...edge,
      animated: isConnected,
      style: {
        stroke: isConnected ? "#0f766e" : "#a8a29e",
        strokeWidth: isConnected ? 2 : 1,
      },
    };
  });

  return (
    <ReactFlow
      nodes={visibleNodes}
      edges={visibleEdges}
      fitView
      onNodeClick={(_, node) => onNodeSelect(node as RepoNode)}
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}