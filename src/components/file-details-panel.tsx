import type { RepoNodeData } from "@/lib/repolens/graph-types";

type FileDetailsPanelProps = {
  
  file: RepoNodeData;
  usedBy: string[];
};

const riskStyles = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  high: "border-red-200 bg-red-50 text-red-700",
};

export function FileDetailsPanel({ file, usedBy }: FileDetailsPanelProps) {
  const isFolder = file.kind === "folder";
  return (
    <aside className="rounded-lg border border-stone-300 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-stone-500">{file.kind}</p>
          <h2 className="mt-2 text-lg font-semibold">{file.label}</h2>
          <p className="mt-1 text-sm text-stone-500">{file.path}</p>
        </div>

        <span
          className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${riskStyles[file.risk.level]}`}
        >
          {file.risk.level} risk
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-stone-700">{file.summary}</p>

      {isFolder ? (
        <DetailList
          title="Contains"
          items={usedBy}
          emptyText="No files shown inside this folder."
        />
      ) : (
        <>
          <DetailList title="Dependencies" items={file.dependencies} />
          <DetailList
            title="Used by"
            items={usedBy}
            emptyText="No files import this file."
          />
          <DetailList title="Imports" items={file.imports} />
          <DetailList title="Exports" items={file.exports} />
          <DetailList title="Functions" items={file.functions} />
        </>
      )}

      {!isFolder ? (
        <div className="mt-6 border-t border-stone-200 pt-4">
          <p className="text-sm font-medium">Risk note</p>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            {file.risk.reason}
          </p>
        </div>
      ) : null}
    </aside>
  );
}

type DetailListProps = {
  title: string;
  items: string[];
  emptyText?: string;
};

function DetailList({ title, items, emptyText = "None detected." }: DetailListProps) {
  return (
    <div className="mt-6 border-t border-stone-200 pt-4">
      <p className="text-sm font-medium">{title}</p>

      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm text-stone-700">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-stone-500">{emptyText}</p>
      )}
    </div>
  );
}