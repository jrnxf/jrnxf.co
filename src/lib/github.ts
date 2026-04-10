import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

export interface GitHubRepo {
  name: string;
  url: string;
  description: string;
  language: string;
  languageColor: string;
  stars: number;
  forks: number;
}

const OWNER = "jrnxf";
const REPOS = ["thokr", "gh-eco", "fsrx", "dot", "une.haus"];

const LANGUAGE_COLORS: Record<string, string> = {
  Rust: "#dea584",
  Go: "#00ADD8",
  Lua: "#6b6bb8",
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Shell: "#89e051",
};

async function fetchRepos(token: string): Promise<GitHubRepo[]> {
  const results = await Promise.all(
    REPOS.map(async (name) => {
      const res = await fetch(`https://api.github.com/repos/${OWNER}/${name}`, {
        headers: {
          Authorization: `token ${token}`,
          "User-Agent": "jrnxf-worker",
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as Record<string, unknown>;
      return {
        name: data.name as string,
        url: data.html_url as string,
        description: (data.description as string) ?? "",
        language: (data.language as string) ?? "",
        languageColor: LANGUAGE_COLORS[(data.language as string) ?? ""] ?? "#8b8b8b",
        stars: data.stargazers_count as number,
        forks: data.forks_count as number,
      };
    }),
  );
  return results.filter((r): r is GitHubRepo => r !== null);
}

export const getRepos = createServerFn({ method: "GET" }).handler(async () => {
  const token = (env as Record<string, string>).GITHUB_TOKEN ?? "";
  if (!token) return [];
  return fetchRepos(token);
});
