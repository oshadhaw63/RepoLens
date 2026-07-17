import { parseTypeScriptFile } from "@/lib/repolens/parse-typescript";

const sampleSource = `
import { RepoExplorer } from "@/components/repo-explorer";
import type { RepoNode } from "@/lib/repolens/graph-types";

export default function Home() {
  return <RepoExplorer />;
}

export const helper = () => {
  return "demo";
};

class InternalTool {}
`;

export const parserDemoResult = parseTypeScriptFile(
  "src/app/page.tsx",
  sampleSource,
);