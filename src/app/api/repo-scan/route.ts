import { NextResponse } from "next/server";

import { parseTypeScriptFile } from "@/lib/repolens/parse-typescript";
import { scanRepo } from "@/lib/repolens/scan-repo";

export async function GET() {
  const files = await scanRepo(process.cwd());

  const parsedFiles = files.map((file) => {
    return parseTypeScriptFile(file.path, file.content);
  });

  return NextResponse.json({
    fileCount: parsedFiles.length,
    files: parsedFiles,
  });
}