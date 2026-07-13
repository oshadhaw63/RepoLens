"use client";

import { Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { sampleEdges, sampleNodes, type RepoNode } from "@/lib/repolens/sample-graph";

type RepoGraphProps = {
  selectedNodeId: string;
  onNodeSelect: (node: RepoNode) => void;
};

export function RepoGraph({ selectedNodeId, onNodeSelect }: RepoGraphProps) {
  const visibleNodes = sampleNodes.map((node) => ({
    ...node,
    selected: node.id === selectedNodeId,
  }));

  return (
    <ReactFlow
      nodes={visibleNodes}
      edges={sampleEdges}
      fitView
      onNodeClick={(_, node) => onNodeSelect(node as RepoNode)}
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}