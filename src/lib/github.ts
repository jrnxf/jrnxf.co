import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { fetchPinned } from "./pinned";

export type { GitHubRepo } from "./pinned";

export const getRepos = createServerFn({ method: "GET" }).handler(async () => {
  const token = (env as Record<string, string>).GITHUB_TOKEN ?? "";
  return fetchPinned(token);
});
