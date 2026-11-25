import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type LinkItem = { label: string; href: string };

// the projects, in the order they show. A clip is a small muted loop in /work (re-recorded from demos/*.tape);
// a project without one shows a labelled placeholder until its clip is made. stars is a snapshot of the
// GitHub star count, shown until a fresh count arrives (see useStars). Every public project shows its count. A
// project with no repo is private: it shows no GitHub link and no count until it is published. The list
// is ordered by that snapshot, most stars first among the projects over SORT_STARS_OVER, the rest after them in
// the order written; the order never changes when live counts arrive.
export type Project = {
  name: string;
  blurb: string;
  clip?: string;
  demo?: string;
  repo?: string;
  stars?: number;
};
const SORT_STARS_OVER = 50;
const WRITTEN: Project[] = [
  {
    name: "thokr",
    blurb:
      "A sleek typing test for the terminal, with visualized results and a log of how you did over time.",
    clip: "thokr",
    demo: "https://thokr.jrnxf.co",
    repo: "jrnxf/thokr",
    stars: 602,
  },
  {
    name: "drip",
    blurb:
      "One command shows a brief native card from your Mac's notch when a build or a coding agent finishes, then gets out of the way.",
    // the clip is the demo from the drip README, cropped to 16:9 round the notch and shrunk to a small mp4
    clip: "drip",
    demo: "https://drip.jrnxf.co",
    repo: "jrnxf/drip",
    stars: 1,
  },
  {
    name: "gh-eco",
    blurb:
      "A GitHub CLI extension for exploring the ecosystem: look anyone up and browse their profile, contributions and repositories in the terminal.",
    // the clip is the demo from the gh-eco README, shrunk to a small mp4 (not recorded from a tape)
    clip: "gh-eco",
    repo: "jrnxf/gh-eco",
    stars: 482,
  },
  {
    name: "une.haus",
    blurb: "A home for unicyclists: a trick encyclopedia, games, tournaments and a video vault.",
    // the clip is a signed-in walk from the home page to users to ask, recorded in a browser (not from a tape)
    clip: "unehaus",
    repo: "jrnxf/une.haus",
    stars: 4,
  },
  {
    name: "fsrx",
    blurb:
      "Flow state reading in the terminal: pipe in any text and the start of each word is bolded so your eyes glide.",
    clip: "fsrx",
    demo: "https://fsrx.jrnxf.co",
    repo: "jrnxf/fsrx",
    stars: 310,
  },
];
export const PROJECTS: Project[] = [...WRITTEN].sort(
  (a, b) =>
    ((b.stars ?? 0) > SORT_STARS_OVER ? (b.stars ?? 0) : 0) -
    ((a.stars ?? 0) > SORT_STARS_OVER ? (a.stars ?? 0) : 0),
);
export const ABOUT_LINKS: LinkItem[] = [
  { label: "github", href: "https://github.com/jrnxf" },
  { label: "email", href: "mailto:colby@jrnxf.co" },
  { label: "instagram", href: "https://instagram.com/jrn.xf" },
  { label: "youtube", href: "https://www.youtube.com/@jrnxf" },
  { label: "twitter", href: "https://twitter.com/jrn_xf" },
];

// shared bits of the page's quiet style: monospace UI text, a hairline pill border, muted ink that darkens on hover
export const pill =
  "cursor-pointer rounded-full border border-[rgba(42,38,34,0.18)] bg-transparent px-3 py-1.5 font-mono text-xs text-[rgba(42,38,34,0.7)] transition-colors hover:border-[rgba(42,38,34,0.4)] hover:text-[#2a2622] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fb9890]";

// ---- GitHub: the mark, the star, and the star counts ----------------------------------------------

export function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={cn("h-4 w-4 fill-current", className)}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={cn("h-3 w-3 fill-current", className)}>
      <path d="M8 .25a.75.75 0 0 1 .67.42l1.88 3.8 4.2.61a.75.75 0 0 1 .42 1.28l-3.04 2.96.72 4.18a.75.75 0 0 1-1.09.79L8 12.3l-3.76 1.98a.75.75 0 0 1-1.09-.79l.72-4.18L.83 6.36a.75.75 0 0 1 .42-1.28l4.2-.61L7.33.67A.75.75 0 0 1 8 .25z" />
    </svg>
  );
}

const STAR_KEY = "jrnxf-stars";
const STAR_TTL = 6 * 60 * 60 * 1000;

// The star count of every project, by name. It starts from the snapshot in PROJECTS (so the first paint has
// numbers and nothing jumps) and is replaced by fresh counts from the GitHub API, cached in the browser for
// hours. If the API refuses (rate limit, offline) the snapshot stays: never an error, never a made-up zero.
export function useStars(): Record<string, number> {
  const [stars, setStars] = useState<Record<string, number>>(() =>
    Object.fromEntries(PROJECTS.flatMap((p) => (p.repo ? [[p.name, p.stars ?? 0]] : []))),
  );
  useEffect(() => {
    let cancelled = false;
    try {
      const cached = JSON.parse(localStorage.getItem(STAR_KEY) ?? "null") as {
        at: number;
        stars: Record<string, number>;
      } | null;
      if (cached && Date.now() - cached.at < STAR_TTL) {
        setStars((cur) => ({ ...cur, ...cached.stars }));
        return;
      }
    } catch {
      // a blocked or empty store just means no cache
    }
    // each repo stands alone: one refusal keeps that project's snapshot, not every project's
    const pub = PROJECTS.filter((p) => p.repo);
    void Promise.allSettled(
      pub.map(async (p) => {
        const res = await fetch(`https://api.github.com/repos/${p.repo}`, {
          headers: { Accept: "application/vnd.github+json" },
        });
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as { stargazers_count?: number };
        if (typeof body.stargazers_count !== "number") throw new Error("no count");
        return [p.name, body.stargazers_count] as const;
      }),
    ).then((results) => {
      if (cancelled) return;
      const pairs = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
      const fresh = Object.fromEntries(pairs);
      setStars((cur) => ({ ...cur, ...fresh }));
      // cache only a full set, so a refused repo is asked again on the next visit
      if (pairs.length < pub.length) return;
      try {
        localStorage.setItem(STAR_KEY, JSON.stringify({ at: Date.now(), stars: fresh }));
      } catch {
        // no cache, fine
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return stars;
}
