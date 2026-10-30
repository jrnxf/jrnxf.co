import { useEffect, useRef, useState } from "react";
import type React from "react";
import type { DeskHandle } from "@/scene/deskapp.js";
import { markSVG } from "@/scene/mark.js";
import { cn } from "@/lib/utils";

const MARK = markSVG();

const INFO = "Hi, I'm Colby. I build small, sharp tools for the terminal and the Mac, from a beach in northern Portugal.";

// the projects, in the order they show. A clip is a small muted loop in /work (re-recorded from demos/*.tape);
// a project without one shows a labelled placeholder until its clip is made.
type Project = { name: string; blurb: string; clip?: string; links: { label: string; href: string }[] };
const PROJECTS: Project[] = [
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
const ABOUT_LINKS = [
  { label: "github", href: "https://github.com/jrnxf" },
  { label: "email", href: "mailto:colby@jrnxf.co" },
  { label: "instagram", href: "https://instagram.com/jrn.xf" },
  { label: "youtube", href: "https://www.youtube.com/@jrnxf" },
  { label: "twitter", href: "https://twitter.com/jrn_xf" },
];

// the panel the page opens, in the same warm off-white as the void
const PANEL_COLORS = {
  "--p-bg": "#f6f2ec",
  "--p-fg": "#2a2622",
  "--p-muted": "#6d655c",
  "--p-line": "#ddd5ca",
} as React.CSSProperties;

// shared bits of the page's quiet style: monospace UI text, a hairline pill border, muted ink that darkens on hover
const pill =
  "cursor-pointer rounded-full border border-[rgba(42,38,34,0.18)] bg-transparent px-3 py-1.5 font-mono text-xs text-[rgba(42,38,34,0.7)] transition-colors hover:border-[rgba(42,38,34,0.4)] hover:text-[#2a2622] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fb9890]";
const link = "text-[rgba(42,38,34,0.7)] underline decoration-[rgba(42,38,34,0.25)] underline-offset-4 transition-colors hover:text-[#2a2622] hover:decoration-[rgba(42,38,34,0.6)]";

function LinkPills({ links, className }: { links: { label: string; href: string }[]; className?: string }) {
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

// a small muted loop that plays only while it is on screen, with a still frame until it loads;
// reduced motion keeps the still frame and never plays
function Clip({ name }: { name: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void video.play().catch(() => {});
      else video.pause();
    }, { threshold: 0.35 });
    io.observe(video);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      className="aspect-video w-full bg-[#141414] object-cover"
      src={`/work/${name}.mp4`}
      poster={`/work/${name}.jpg`}
      muted
      loop
      playsInline
      preload="none"
      aria-label={`${name} in use`}
    />
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-[rgba(42,38,34,0.12)] bg-[#f6f2ec]">
      {project.clip ? (
        <Clip name={project.clip} />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-[#141414] font-mono text-xs text-[rgba(228,228,228,0.4)]">
          {project.name} · clip coming
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-mono text-sm font-medium">{project.name}</h3>
        <p className="font-['Fraunces',serif] text-[17px] font-light leading-snug text-[rgba(42,38,34,0.85)]">{project.blurb}</p>
        <LinkPills links={project.links} className="mt-auto pt-1" />
      </div>
    </article>
  );
}

// The homepage hero: me at my desk in a soft white void, terminals on the screen. The scene is
// drawn by three.js, which only loads in the browser, so the server renders the words around it.
export function DeskScene() {
  const stageRef = useRef<HTMLDivElement>(null);
  const deskRef = useRef<DeskHandle | null>(null);
  const workRef = useRef<HTMLElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [phone, setPhone] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let cancelled = false;
    void import("@/scene/deskapp.js").then(({ startDesk }) => {
      if (cancelled) return;
      deskRef.current = startDesk({ stage, backdrop: "white", onOpenChange: setPanelOpen });
    });
    return () => {
      cancelled = true;
      deskRef.current?.destroy();
      deskRef.current = null;
    };
  }, []);

  useEffect(() => {
    const media = matchMedia("(max-width: 719px)");
    const onMedia = () => setPhone(media.matches);
    onMedia();
    media.addEventListener("change", onMedia);
    return () => {
      media.removeEventListener("change", onMedia);
    };
  }, []);

  const chrome = cn("transition-opacity", panelOpen && "pointer-events-none opacity-0");
  return (
    <>
      <section
        aria-label="Colby at a desk, in voxels"
        className="relative z-10 h-dvh overflow-hidden bg-[#ebe6de] font-['Geist',system-ui,sans-serif] text-[#2a2622]"
        style={PANEL_COLORS}
      >
        <div ref={stageRef} className="desk-stage absolute inset-0 [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full" />
        <div
          className={cn(
            "pointer-events-none absolute left-[max(16px,env(safe-area-inset-left))] top-[max(16px,env(safe-area-inset-top))] z-[3] max-w-[min(420px,calc(100vw-32px))]",
            chrome,
          )}
        >
          <div
            className="w-[110px] sm:w-[150px] [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: MARK }}
          />
          <p className="mt-2.5 font-['Fraunces',serif] text-base font-light leading-[1.35] text-[rgba(42,38,34,0.9)] sm:text-[clamp(17px,2vw,21px)]">
            fast tools, slow mornings
            <br />
            vila chã, portugal
          </p>
        </div>

        <div
          className={cn(
            "pointer-events-none absolute bottom-[max(18px,env(safe-area-inset-bottom))] left-1/2 z-[3] -translate-x-1/2 whitespace-nowrap font-mono text-[11px] font-medium text-[rgba(42,38,34,0.55)] sm:text-xs",
            "bottom-[max(60px,calc(env(safe-area-inset-bottom)+42px))]",
            chrome,
          )}
        >
          {phone ? "swipe to look · pinch to zoom" : "drag to look · scroll to zoom"}
        </div>
        <button
          type="button"
          onClick={() => workRef.current?.scrollIntoView({ behavior: "smooth" })}
          className={cn(pill, "absolute bottom-[max(14px,env(safe-area-inset-bottom))] left-1/2 z-[3] -translate-x-1/2 border-transparent", chrome)}
        >
          work <span aria-hidden="true" className="inline-block motion-safe:animate-bounce">↓</span>
        </button>
      </section>

      <section
        ref={workRef}
        id="work"
        aria-label="Projects"
        className="relative z-10 bg-[#ebe6de] px-[max(16px,env(safe-area-inset-left))] py-16 font-['Geist',system-ui,sans-serif] text-[#2a2622] sm:py-24"
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-10">
          <header className="flex flex-col gap-3">
            <h2 className="font-mono text-xs uppercase tracking-widest text-[rgba(42,38,34,0.55)]">work</h2>
            <p className="max-w-[40ch] font-['Fraunces',serif] text-[clamp(20px,3vw,28px)] font-light leading-snug">{INFO}</p>
          </header>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {PROJECTS.map((project) => (
              <ProjectCard key={project.name} project={project} />
            ))}
          </div>
          <footer className="flex flex-col gap-3 border-t border-[rgba(42,38,34,0.12)] pt-6">
            <LinkPills links={ABOUT_LINKS} />
          </footer>
        </div>
      </section>
    </>
  );
}
