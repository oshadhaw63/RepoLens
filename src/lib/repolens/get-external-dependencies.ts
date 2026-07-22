import type { RepoNode } from "@/lib/repolens/graph-types";

export function getExternalDependencies(nodes: RepoNode[]) {
  const packages = new Set<string>();

  for (const node of nodes) {
    for (const importSummary of node.data.imports) {
      const importPath = getModulePath(importSummary);

      if (isExternalImport(importPath)) {
        packages.add(getPackageName(importPath));
      }
    }
  }

  return Array.from(packages).sort();
}

function getModulePath(importSummary: string) {
  const fromIndex = importSummary.lastIndexOf(" from ");

  if (fromIndex === -1) {
    return importSummary;
  }

  return importSummary.slice(fromIndex + " from ".length);
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