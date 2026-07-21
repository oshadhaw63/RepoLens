export function parseGitHubUrl(url: string) {
  const parsedUrl = new URL(url);

  if (parsedUrl.hostname !== "github.com") {
    throw new Error("Only github.com repository URLs are supported.");
  }

  const [owner, repo] = parsedUrl.pathname.split("/").filter(Boolean);

  if (!owner || !repo) {
    throw new Error("GitHub URL must include an owner and repository name.");
  }

  return {
    owner,
    repo: repo.replace(".git", ""),
  };
}