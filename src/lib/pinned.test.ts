import { expect, test } from "bun:test";
import { FALLBACK_REPOS, fetchPinned, mapPinned } from "./pinned";

const body = {
  data: {
    user: {
      pinnedItems: {
        nodes: [
          {
            name: "b-repo",
            url: "https://github.com/jrnxf/b-repo",
            description: null,
            stargazerCount: 3,
            forkCount: 1,
            primaryLanguage: null,
          },
          {
            name: "a-repo",
            url: "https://github.com/jrnxf/a-repo",
            description: "desc",
            stargazerCount: 99,
            forkCount: 4,
            primaryLanguage: { name: "Rust", color: "#dea584" },
          },
        ],
      },
    },
  },
};

test("maps pinned nodes in pinned order with null-safe fields", () => {
  const repos = mapPinned(body)!;
  expect(repos.map((r) => r.name)).toEqual(["b-repo", "a-repo"]);
  expect(repos[0]).toMatchObject({ description: "", language: "", languageColor: "#8b8b8b" });
  expect(repos[1]).toMatchObject({ language: "Rust", languageColor: "#dea584", stars: 99, forks: 4 });
});

test("graphql errors / empty data map to null", () => {
  expect(mapPinned({ errors: [{ message: "Bad credentials" }] })).toBeNull();
  expect(mapPinned({ data: { user: { pinnedItems: { nodes: [] } } } })).toBeNull();
});

test("falls back on http error, bad payload, throw, and missing token", async () => {
  const mk = (f: () => Promise<Response>) => f as unknown as typeof fetch;
  expect(await fetchPinned("t", mk(async () => new Response("no", { status: 401 })))).toBe(FALLBACK_REPOS);
  expect(await fetchPinned("t", mk(async () => Response.json({ errors: [] })))).toBe(FALLBACK_REPOS);
  expect(await fetchPinned("t", mk(async () => { throw new Error("net"); }))).toBe(FALLBACK_REPOS);
  expect(await fetchPinned("", mk(async () => Response.json(body)))).toBe(FALLBACK_REPOS);
});

test("fallback has no private repos", () => {
  expect(FALLBACK_REPOS.map((r) => r.name)).not.toContain("dot");
});
