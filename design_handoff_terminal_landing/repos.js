// Mirrors src/lib/github.ts: same OWNER/REPOS, fetched client-side (unauthenticated) with a static fallback.
export const OWNER = "jrnxf";
export const REPOS = ["thokr", "gh-eco", "fsrx", "dot", "une.haus"];
export const LANGUAGE_COLORS = {
  Rust: "#dea584",
  Go: "#00ADD8",
  Lua: "#6b6bb8",
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Shell: "#89e051",
};

export const FALLBACK = [
  {
    name: "thokr",
    url: "https://github.com/jrnxf/thokr",
    description: "✨ sleek typing tui with visualized results and historical logging",
    language: "Rust",
    stars: 600,
    forks: 18,
  },
  {
    name: "gh-eco",
    url: "https://github.com/jrnxf/gh-eco",
    description: "🦥 gh cli extension to explore the ecosystem",
    language: "Go",
    stars: 479,
    forks: 10,
  },
  {
    name: "fsrx",
    url: "https://github.com/jrnxf/fsrx",
    description: "📚 flow state reading in the terminal",
    language: "Rust",
    stars: 310,
    forks: 7,
  },
  {
    name: "dot",
    url: "https://github.com/jrnxf/dot",
    description: "💩 #!/bin/shit",
    language: "Shell",
    stars: 9,
    forks: 0,
  },
  {
    name: "une.haus",
    url: "https://github.com/jrnxf/une.haus",
    description: "🤘 all things une",
    language: "TypeScript",
    stars: 4,
    forks: 1,
  },
].map((r) => ({ ...r, languageColor: LANGUAGE_COLORS[r.language] ?? "#8b8b8b" }));

let cache = null;
export async function fetchRepos() {
  if (cache) return cache;
  try {
    const results = await Promise.all(
      REPOS.map(async (name) => {
        const res = await fetch(`https://api.github.com/repos/${OWNER}/${name}`, {
          headers: { Accept: "application/vnd.github.v3+json" },
        });
        if (!res.ok) throw new Error(String(res.status));
        const d = await res.json();
        return {
          name: d.name,
          url: d.html_url,
          description: d.description ?? "",
          language: d.language ?? "",
          languageColor: LANGUAGE_COLORS[d.language ?? ""] ?? "#8b8b8b",
          stars: d.stargazers_count,
          forks: d.forks_count,
        };
      }),
    );
    cache = results;
    return results;
  } catch {
    return FALLBACK;
  }
}
