"use client";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { sampleEdges, sampleNodes } from "@/lib/repolens/sample-graph";

export function RepoGraph() {
  return (
    <ReactFlow nodes={sampleNodes} edges={sampleEdges} fitView>
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}