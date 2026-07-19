import { NextResponse } from "next/server";

import { buildGraphFromParsedFiles } from "@/lib/repolens/build-graph";
import { parseTypeScriptFile } from "@/lib/repolens/parse-typescript";
import { scanRepo } from "@/lib/repolens/scan-repo";

export async function GET() {
  const files = await scanRepo(process.cwd());

  const parsedFiles = files.map((file) => {
    return parseTypeScriptFile(file.path, file.content);
  });

  const graph = buildGraphFromParsedFiles(parsedFiles);

  return NextResponse.json({
    fileCount: parsedFiles.length,
    files: parsedFiles,
    graph,
  });
}