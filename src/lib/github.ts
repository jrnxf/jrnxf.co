export interface GitHubRepo {
  name: string
  url: string
  description: string
  language: string
  languageColor: string
  stars: number
  forks: number
}

const LANGUAGE_COLORS: Record<string, string> = {
  Rust: '#dea584',
  Go: '#00ADD8',
  Lua: '#6b6bb8',
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Shell: '#89e051',
}

const WORKER_URL = import.meta.env.DEV
  ? 'http://localhost:8787'
  : 'https://api.jrnxf.co'

const CACHE_TTL = 10 * 60 * 1000 // 10 minutes
let cache: { data: GitHubRepo[]; ts: number } | null = null

export async function fetchPinnedRepos(): Promise<GitHubRepo[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) return cache.data

  const res = await fetch(`${WORKER_URL}/repos`)
  if (!res.ok) return []

  const data: GitHubRepo[] = await res.json()
  const repos = data.map((r) => ({
    ...r,
    languageColor: LANGUAGE_COLORS[r.language] ?? '#8b8b8b',
  }))

  cache = { data: repos, ts: Date.now() }
  return repos
}
