import { parseGitHubUrl } from "@/lib/repolens/parse-github-url";
import type { RepoSourceFile } from "@/lib/repolens/scan-repo";

const ignoredPathParts = new Set([
  ".git",
  ".next",
  "node_modules",
  "dist",
  "build",
]);

const supportedExtensions = [".ts", ".tsx", ".js", ".jsx"];

type GitHubRepoResponse = {
  default_branch: string;
};

type GitHubTreeResponse = {
  tree: {
    path: string;
    type: "blob" | "tree";
  }[];
};

export async function scanGitHubRepo(repoUrl: string) {
  const { owner, repo } = parseGitHubUrl(repoUrl);

  const repoResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
  );

  if (!repoResponse.ok) {
    throw new Error("Could not load GitHub repository metadata.");
  }

  const repoData = (await repoResponse.json()) as GitHubRepoResponse;

  const treeResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${repoData.default_branch}?recursive=1`,
  );

  if (!treeResponse.ok) {
    throw new Error("Could not load GitHub repository file tree.");
  }

  const treeData = (await treeResponse.json()) as GitHubTreeResponse;

  const sourceFiles = treeData.tree
    .filter((item) => item.type === "blob")
    .filter((item) => isSupportedSourcePath(item.path))
    .slice(0, 80);

  const files: RepoSourceFile[] = [];

  for (const sourceFile of sourceFiles) {
    const rawResponse = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/${repoData.default_branch}/${sourceFile.path}`,
    );

    if (!rawResponse.ok) {
      continue;
    }

    files.push({
      path: sourceFile.path,
      content: await rawResponse.text(),
    });
  }

  return files;
}

function isSupportedSourcePath(filePath: string) {
  if (filePath.endsWith(".d.ts")) {
    return false;
  }

  if (filePath.split("/").some((part) => ignoredPathParts.has(part))) {
    return false;
  }

  return supportedExtensions.some((extension) => filePath.endsWith(extension));
}