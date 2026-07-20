import type { RepoNode } from "@/lib/repolens/graph-types";

export type RepoSearchResult = {
  path: string;
  label: string;
  summary: string;
  score: number;
  matches: string[];
};

export function searchRepo(nodes: RepoNode[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return nodes
    .map((node) => {
      const matches: string[] = [];
      let score = 0;

      score += scoreField(node.data.label, normalizedQuery, "file name", matches, 5);
      score += scoreField(node.data.path, normalizedQuery, "path", matches, 4);
      score += scoreField(node.data.summary, normalizedQuery, "summary", matches, 3);
      score += scoreList(node.data.functions, normalizedQuery, "function", matches, 4);
      score += scoreList(node.data.classes, normalizedQuery, "class", matches, 4);
      score += scoreList(node.data.imports, normalizedQuery, "import", matches, 2);
      score += scoreList(node.data.exports, normalizedQuery, "export", matches, 3);

      return {
        path: node.data.path,
        label: node.data.label,
        summary: node.data.summary,
        score,
        matches,
      };
    })
    .filter((result) => result.score > 0)
    .sort((first, second) => second.score - first.score)
    .slice(0, 5);
}

function scoreField(
  value: string,
  query: string,
  matchLabel: string,
  matches: string[],
  weight: number,
) {
  if (!value.toLowerCase().includes(query)) {
    return 0;
  }

  matches.push(matchLabel);
  return weight;
}

function scoreList(
  values: string[],
  query: string,
  matchLabel: string,
  matches: string[],
  weight: number,
) {
  let score = 0;

  for (const value of values) {
    if (value.toLowerCase().includes(query)) {
      matches.push(`${matchLabel}: ${value}`);
      score += weight;
    }
  }

  return score;
}