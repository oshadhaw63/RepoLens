import type { RepoNode } from "@/lib/repolens/graph-types";

export function getExternalDependencies(nodes: RepoNode[]) {
  const packages = new Set<string>();

  for (const node of nodes) {
    for (const importPath of node.data.imports) {
      if (isExternalImport(importPath)) {
        packages.add(getPackageName(importPath));
      }
    }
  }

  return Array.from(packages).sort();
}

function isExternalImport(importPath: string) {
  return !importPath.startsWith(".") && !importPath.startsWith("@/");
}

function getPackageName(importPath: string) {
  if (!importPath.startsWith("@")) {
    return importPath.split("/")[0];
  }

  const [scope, packageName] = importPath.split("/");

  return `${scope}/${packageName}`;
}