"use client";

import { useEffect, useRef } from "react";
import { Background, Controls, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { RepoEdge, RepoNode } from "@/lib/repolens/graph-types";

const FIT_VIEW_OPTIONS = { padding: 0.25, maxZoom: 1.1 };

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fitViewRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const observer = new ResizeObserver(() => {
      fitViewRef.current?.();
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

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
    const isFolder = node.data.kind === "folder";

    return {
      ...node,
      selected: isSelected,
      style: {
        borderRadius: 8,
        boxShadow: isSelected ? "0 0 0 3px rgba(79, 70, 229, 0.15)" : "none",
        border: isSelected
          ? "2px solid #4f46e5"
          : isConnected
            ? "2px solid #818cf8"
            : isFolder
              ? "1px solid #f59e0b"
              : "1px solid #d6d3d1",
        background: isSelected ? "#eef2ff" : isFolder ? "#fffbeb" : "#ffffff",
        color: "#0f172a",
        fontWeight: isSelected ? 600 : 500,
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
        stroke: isConnected ? "#4f46e5" : "#cbd5e1",
        strokeWidth: isConnected ? 2 : 1,
      },
    };
  });

  return (
    <div ref={containerRef} className="h-full w-full">
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        fitView
        fitViewOptions={FIT_VIEW_OPTIONS}
        minZoom={0.2}
        onInit={(instance) => {
          fitViewRef.current = () => instance.fitView(FIT_VIEW_OPTIONS);
        }}
        onNodeClick={(_, node) => onNodeSelect(node as RepoNode)}
      >
        <Background color="#cbd5e1" gap={20} />
        <Controls className="!shadow-md" />
      </ReactFlow>
    </div>
  );
}