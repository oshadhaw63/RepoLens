import type { RepoNode } from "@/lib/repolens/graph-types";

export function createOnboardingPath(nodes: RepoNode[]) {
  const pages = nodes.filter((node) => node.data.kind === "page");
  const components = nodes.filter((node) => node.data.kind === "component");
  const libraries = nodes.filter((node) => node.data.kind === "library");

  return [...pages, ...components, ...libraries].slice(0, 6).map((node) => {
    return {
      path: node.data.path,
      label: node.data.label,
      reason: createReason(node),
    };
  });
}

function createReason(node: RepoNode) {
  if (node.data.kind === "page") {
    return "Start here because pages show how users enter the application.";
  }

  if (node.data.kind === "component") {
    return "Read this next because components explain how the interface is assembled.";
  }

  return "Review this after the UI files because library files usually hold shared logic.";
}