export interface GitHubRepo {
  name: string;
  url: string;
  description: string;
  language: string;
  languageColor: string;
  stars: number;
  forks: number;
}

export const OWNER = "jrnxf";

export const PINNED_QUERY = `query($login: String!) {
  user(login: $login) {
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes {
        ... on Repository {
          name
          url
          description
          stargazerCount
          forkCount
          primaryLanguage { name color }
        }
      }
    }
  }
}`;

// Shown when the GraphQL call fails. Public repos only.
export const FALLBACK_REPOS: GitHubRepo[] = [
  "thokr",
  "gh-eco",
  "fsrx",
  "une.haus",
].map((name) => ({
  name,
  url: `https://github.com/${OWNER}/${name}`,
  description: "",
  language: "",
  languageColor: "#8b8b8b",
  stars: 0,
  forks: 0,
}));

interface PinnedNode {
  name?: string;
  url?: string;
  description?: string | null;
  stargazerCount?: number;
  forkCount?: number;
  primaryLanguage?: { name: string; color: string | null } | null;
}

/** Maps a GraphQL response to repos in pinned order; null if the shape is unusable. */
export function mapPinned(json: unknown): GitHubRepo[] | null {
  const nodes = (json as { data?: { user?: { pinnedItems?: { nodes?: PinnedNode[] } } } })?.data
    ?.user?.pinnedItems?.nodes;
  if (!Array.isArray(nodes)) return null;
  const repos = nodes
    .filter((n): n is PinnedNode => !!n && typeof n.name === "string" && typeof n.url === "string")
    .map((n) => ({
      name: n.name as string,
      url: n.url as string,
      description: n.description ?? "",
      language: n.primaryLanguage?.name ?? "",
      languageColor: n.primaryLanguage?.color ?? "#8b8b8b",
      stars: n.stargazerCount ?? 0,
      forks: n.forkCount ?? 0,
    }));
  return repos.length > 0 ? repos : null;
}

export async function fetchPinned(token: string, fetchFn: typeof fetch = fetch): Promise<GitHubRepo[]> {
  if (token === "") return FALLBACK_REPOS;
  try {
    const res = await fetchFn("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `bearer ${token}`,
        "User-Agent": "jrnxf-worker",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: PINNED_QUERY, variables: { login: OWNER } }),
    });
    if (!res.ok) return FALLBACK_REPOS;
    return mapPinned(await res.json()) ?? FALLBACK_REPOS;
  } catch {
    return FALLBACK_REPOS;
  }
}
