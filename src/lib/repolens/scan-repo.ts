import { readdir, readFile } from "fs/promises";
import path from "path";

export type RepoSourceFile = {
  path: string;
  content: string;
};

const ignoredDirectories = new Set([
  ".git",
  ".next",
  "node_modules",
  "dist",
  "build",
]);

const ignoredFileNames = new Set([
  "parser-demo.ts",
  "parser-ddemo.ts",
]);

const supportedExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);

export async function scanRepo(rootDirectory: string) {
  const files: RepoSourceFile[] = [];

  async function walk(currentDirectory: string) {
    const entries = await readdir(currentDirectory, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const fullPath = path.join(currentDirectory, entry.name);

      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) {
          await walk(fullPath);
        }

        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      if (ignoredFileNames.has(entry.name)) {
        continue;
      }

      const extension = path.extname(entry.name);

      if (entry.name.endsWith(".d.ts")) {
        continue;
      }

      if (!supportedExtensions.has(extension)) {
        continue;
      }

      const relativePath = path.relative(rootDirectory, fullPath).replaceAll(path.sep, "/");
      const content = await readFile(fullPath, "utf-8");

      files.push({
        path: relativePath,
        content,
      });
    }
  }

  await walk(rootDirectory);

  return files;
}