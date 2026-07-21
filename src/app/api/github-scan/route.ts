import { NextRequest, NextResponse } from "next/server";

import { buildGraphFromParsedFiles } from "@/lib/repolens/build-graph";
import { parseTypeScriptFile } from "@/lib/repolens/parse-typescript";
import { scanGitHubRepo } from "@/lib/repolens/scan-github-repo";

export async function GET(request: NextRequest) {
  try {
    const repoUrl = request.nextUrl.searchParams.get("url");

    if (!repoUrl) {
      return NextResponse.json(
        { error: "Missing GitHub repository URL." },
        { status: 400 },
      );
    }

    const files = await scanGitHubRepo(repoUrl);

    const parsedFiles = files.map((file) => {
      return parseTypeScriptFile(file.path, file.content);
    });

    const graph = buildGraphFromParsedFiles(parsedFiles);

    return NextResponse.json({
      fileCount: parsedFiles.length,
      files: parsedFiles,
      graph,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown GitHub scan error.",
      },
      { status: 500 },
    );
  }
}