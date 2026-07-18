import path from "path";

import type { ParsedTypeScriptFile } from "@/lib/repolens/parse-typescript";
import type { RepoEdge, RepoNode, RepoNodeKind } from "@/lib/repolens/graph-types";

function getNodeKind(filePath: string): RepoNodeKind {
  if (filePath.includes(`${path.sep}app${path.sep}`)) {
    return "page";
  }

  if (filePath.includes(`${path.sep}components${path.sep}`)) {
    return "component";
  }

  return "library";
}

function getFileLabel(filePath: string) {
  return path.basename(filePath);
}

function createSummary(file: ParsedTypeScriptFile) {
  const parts = [];

  if (file.functions.length > 0) {
    parts.push(`Defines functions: ${file.functions.join(", ")}.`);
  }

  if (file.classes.length > 0) {
    parts.push(`Defines classes: ${file.classes.join(", ")}.`);
  }

  if (file.imports.length > 0) {
    parts.push(`Imports ${file.imports.length} module(s).`);
  }

  if (parts.length === 0) {
    return "Source file with no detected functions, classes, or imports yet.";
  }

  return parts.join(" ");
}

export function buildGraphFromParsedFiles(files: ParsedTypeScriptFile[]) {
  const nodes: RepoNode[] = files.map((file, index) => {
    return {
      id: file.path,
      position: {
        x: (index % 4) * 280,
        y: Math.floor(index / 4) * 180,
      },
      data: {
        label: getFileLabel(file.path),
        path: file.path,
        kind: getNodeKind(file.path),
        summary: createSummary(file),
        dependencies: file.imports,
        imports: file.imports,
        exports: file.exports,
        functions: file.functions,
        risk: {
          level: file.imports.length > 5 ? "medium" : "low",
          reason:
            file.imports.length > 5
              ? "This file imports several modules, so it may coordinate multiple responsibilities."
              : "This file has a small number of detected imports.",
        },
      },
    };
  });

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges: RepoEdge[] = [];

  for (const file of files) {
    for (const importPath of file.imports) {
      const targetId = resolveImportToNodeId(file.path, importPath, nodeIds);

      if (!targetId) {
        continue;
      }

      edges.push({
        id: `${file.path}->${targetId}`,
        source: file.path,
        target: targetId,
        label: "imports",
      });
    }
  }

  return { nodes, edges };
}

function resolveImportToNodeId(
  sourceFilePath: string,
  importPath: string,
  nodeIds: Set<string>,
) {
  if (!importPath.startsWith(".") && !importPath.startsWith("@/")) {
    return null;
  }

  const sourceDirectory = path.dirname(sourceFilePath);

  const basePath = importPath.startsWith("@/")
    ? importPath.replace("@/", "src/")
    : path.normalize(path.join(sourceDirectory, importPath));

  const possibleTargets = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
    path.join(basePath, "index.js"),
    path.join(basePath, "index.jsx"),
  ];

  return possibleTargets.find((target) => nodeIds.has(target)) ?? null;
}