import type { RepoNodeData } from "@/lib/repolens/graph-types";

type FileDetailsPanelProps = {
  file: RepoNodeData;
};

export function FileDetailsPanel({ file }: FileDetailsPanelProps) {
  return (
    <aside className="rounded-lg border border-stone-300 bg-white p-5">
      <p className="text-sm font-medium text-stone-500">{file.kind}</p>
      <h2 className="mt-2 text-lg font-semibold">{file.label}</h2>
      <p className="mt-1 text-sm text-stone-500">{file.path}</p>
      <p className="mt-4 text-sm leading-6 text-stone-700">{file.summary}</p>

      <div className="mt-6 border-t border-stone-200 pt-4">
        <p className="text-sm font-medium">Dependencies</p>
        <ul className="mt-3 space-y-2 text-sm text-stone-700">
          {file.dependencies.map((dependency) => (
            <li key={dependency}>{dependency}</li>
          ))}
        </ul>
      </div>
    </aside>
  );
}