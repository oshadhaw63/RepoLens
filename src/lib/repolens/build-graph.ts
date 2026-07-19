import path from "path";

import type { ParsedTypeScriptFile } from "@/lib/repolens/parse-typescript";
import type { RepoEdge, RepoNode, RepoNodeKind } from "@/lib/repolens/graph-types";

function getNodeKind(filePath: string): RepoNodeKind {
  if (filePath.startsWith("src/app/") || filePath.includes("/app/")) {
    return "page";
  }

  if (
    filePath.startsWith("src/components/") ||
    filePath.includes("/components/")
  ) {
    return "component";
  }

  return "library";
}

function createRisk(file: ParsedTypeScriptFile) {
  const score =
    file.imports.length +
    file.functions.length +
    file.exports.length;

  if (score >= 12) {
    return {
      level: "high" as const,
      reason:
        "This file has many imports, functions, or exports, so it may be doing too much.",
    };
  }

  if (score >= 6) {
    return {
      level: "medium" as const,
      reason:
        "This file has a moderate amount of responsibility and may be worth reviewing.",
    };
  }

  return {
    level: "low" as const,
    reason: "This file has a small detected surface area.",
  };
}

function getFileLabel(filePath: string) {
  return path.posix.basename(filePath);
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
  const folderPaths = Array.from(
    new Set(files.map((file) => getFolderPath(file.path))),
  );

  const folderNodes: RepoNode[] = folderPaths.map((folderPath, index) => {
    return {
      id: `folder:${folderPath}`,
      position: {
        x: (index % 4) * 280,
        y: Math.floor(index / 4) * 180,
      },
      data: {
        label: folderPath,
        path: folderPath,
        kind: "folder",
        summary: "Folder containing related source files.",
        dependencies: [],
        imports: [],
        exports: [],
        functions: [],
        risk: {
          level: "low",
          reason: "Folder node used for structural navigation.",
        },
      },
    };
  });
  
  const fileNodes: RepoNode[] = files.map((file, index) => {
    
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
  const nodes = [...folderNodes, ...fileNodes];
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges: RepoEdge[] = [];
  for (const file of files) {
  const folderPath = getFolderPath(file.path);

  edges.push({
    id: `folder:${folderPath}->${file.path}`,
    source: `folder:${folderPath}`,
    target: file.path,
    label: "contains",
  });
}

  for (const file of files) {
    for (const importSummary of file.imports) {
      const importPath = getModulePath(importSummary);
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

  const sourceDirectory = path.posix.dirname(sourceFilePath);

  const basePath = importPath.startsWith("@/")
    ? importPath.replace("@/", "src/")
    : path.posix.normalize(path.posix.join(sourceDirectory, importPath));

  const possibleTargets = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    `${basePath}/index.ts`,
    `${basePath}/index.tsx`,
    `${basePath}/index.js`,
    `${basePath}/index.jsx`,
  ];
  return possibleTargets.find((target) => nodeIds.has(target)) ?? null;
}

function getModulePath(importSummary: string) {
  const fromIndex = importSummary.lastIndexOf(" from ");

  if (fromIndex === -1) {
    return importSummary;
  }

  return importSummary.slice(fromIndex + " from ".length);
}

function getFolderPath(filePath: string) {
  const folderPath = path.posix.dirname(filePath);

  if (folderPath === ".") {
    return "root";
  }

  return folderPath;
}