import { FileCode2, Folder } from "lucide-react";
import type { RepoNodeData } from "@/lib/repolens/graph-types";

type FileDetailsPanelProps = {
  file: RepoNodeData;
  relatedFiles: string[];
};

const riskStyles = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  high: "border-red-200 bg-red-50 text-red-700",
};

const riskDotStyles = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-red-500",
};

export function FileDetailsPanel({ file, relatedFiles }: FileDetailsPanelProps) {
  const isFolder = file.kind === "folder";
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            {isFolder ? <Folder className="h-4 w-4" /> : <FileCode2 className="h-4 w-4" />}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {file.kind}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">{file.label}</h2>
            <p className="mt-1 break-all text-sm text-slate-500">{file.path}</p>
          </div>
        </div>

        <span
          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${riskStyles[file.risk.level]}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${riskDotStyles[file.risk.level]}`} />
          {file.risk.level} risk
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{file.summary}</p>

      {isFolder ? (
        <DetailList
          title="Contains"
          items={relatedFiles}
          emptyText="No files shown inside this folder."
        />
      ) : (
        <>
          <DetailList title="Dependencies" items={file.dependencies} />
          <DetailList
            title="Related files"
            items={relatedFiles}
            emptyText="No related files."
          />
          <DetailList title="Imports" items={file.imports} />
          <DetailList title="Exports" items={file.exports} />
          <DetailList title="Functions" items={file.functions} />
          <DetailList title="Classes" items={file.classes} />
        </>
      )}

      {!isFolder ? (
        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="text-sm font-medium text-slate-800">Risk note</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
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
    <div className="mt-6 border-t border-slate-200 pt-4">
      <p className="text-sm font-medium text-slate-800">{title}</p>

      {items.length > 0 ? (
        <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
          {items.map((item) => (
            <li key={item} className="rounded-md bg-slate-50 px-2.5 py-1.5 font-mono text-xs text-slate-700">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500">{emptyText}</p>
      )}
    </div>
  );
}
