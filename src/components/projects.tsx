import { cn } from "@/lib/utils";

export const INFO = "Hi, I'm Colby. I build small, sharp tools for the terminal and the Mac, from a beach in northern Portugal.";

type LinkItem = { label: string; href: string };

// the projects, in the order they show. A clip is a small muted loop in /work (re-recorded from demos/*.tape);
// a project without one shows a labelled placeholder until its clip is made.
export type Project = { name: string; blurb: string; clip?: string; links: LinkItem[] };
export const PROJECTS: Project[] = [
  {
    name: "thokr",
    blurb: "A sleek typing test for the terminal, with visualized results and a log of how you did over time.",
    clip: "thokr",
    links: [
      { label: "github", href: "https://github.com/jrnxf/thokr" },
      { label: "cargo install thokr", href: "https://crates.io/crates/thokr" },
    ],
  },
  {
    name: "drip",
    blurb: "One command shows a brief native card from your Mac's notch when a build or a coding agent finishes, then gets out of the way.",
    links: [{ label: "github", href: "https://github.com/jrnxf/drip" }],
  },
  {
    name: "okfs",
    blurb: "A web file browser in one binary. Run it in a folder and flip through every file inside.",
    links: [{ label: "github", href: "https://github.com/jrnxf/okfs" }],
  },
  {
    name: "une.haus",
    blurb: "A home for unicyclists: a trick encyclopedia, games, tournaments and a video vault.",
    links: [
      { label: "site", href: "https://une.haus" },
      { label: "github", href: "https://github.com/jrnxf/une.haus" },
    ],
  },
  {
    name: "fsrx",
    blurb: "Flow state reading in the terminal: pipe in any text and the start of each word is bolded so your eyes glide.",
    clip: "fsrx",
    links: [
      { label: "github", href: "https://github.com/jrnxf/fsrx" },
      { label: "cargo install fsrx", href: "https://crates.io/crates/fsrx" },
    ],
  },
  {
    name: "vxr",
    blurb: "Fast voxel scenes: a MagicaVoxel-compatible editor for the Mac and the browser. This desk was made in it.",
    links: [
      { label: "site", href: "https://vxr.jrnxf.co" },
      { label: "github", href: "https://github.com/jrnxf/vxr" },
    ],
  },
];
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

export function LinkPills({ links, className }: { links: LinkItem[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {links.map(({ label, href }) => (
        <li key={label}>
          <a className={pill} href={href} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}>
            {label}
          </a>
        </li>
      ))}
    </ul>
  );
}
