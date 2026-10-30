import { useEffect, useRef, useState } from "react";
import type React from "react";
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
const serif = "font-['Fraunces',serif] font-light";
const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

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

// a small muted loop with a still frame until it loads. With `always` it plays whenever it is mounted;
// otherwise only while it is on screen. Reduced motion keeps the still frame and never plays.
export function Clip({ name, className, always }: { name: string; className?: string; always?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video || reducedMotion()) return;
    if (always) {
      void video.play().catch(() => {});
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, [always]);
  return (
    <video
      ref={ref}
      className={cn("aspect-video w-full bg-[#141414] object-cover", className)}
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

export function Screen({ project, className }: { project: Project; className?: string }) {
  return project.clip ? (
    <Clip key={project.name} name={project.clip} always className={className} />
  ) : (
    <div className={cn("flex aspect-video w-full items-center justify-center bg-[#141414] font-mono text-xs text-[rgba(228,228,228,0.4)]", className)}>
      {project.name} · clip coming
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------
// shell: a fake terminal where a visitor types or taps commands and gets the project back
// ---------------------------------------------------------------------------------------------------

type Line = { kind: "in" | "out" | "project"; text?: string; project?: Project };
const names = PROJECTS.map((p) => p.name);
const prompt = "~ ❯";

function runCommand(raw: string): Line[] {
  const [cmd = "", ...args] = raw.trim().split(/\s+/);
  const find = (n?: string) => PROJECTS.find((p) => p.name === (n ?? "").replace(/^\.\//, ""));
  if (!cmd) return [];
  if (cmd === "help") return [{ kind: "out", text: "ls · open <project> · <project> · about · clear" }];
  if (cmd === "ls") return [{ kind: "out", text: names.join("   ") }];
  if (cmd === "about") return [{ kind: "out", text: INFO }];
  if (cmd === "open" || cmd === "cat") {
    const p = find(args[0]);
    return p ? [{ kind: "project", project: p }] : [{ kind: "out", text: args[0] ? `${cmd}: ${args[0]}: no such project (try ls)` : `${cmd}: which project? try ls` }];
  }
  const p = find(cmd);
  if (p) return args.includes("--help") || args.includes("-h") ? [{ kind: "out", text: `${p.name}: ${p.blurb}` }] : [{ kind: "project", project: p }];
  return [{ kind: "out", text: `${cmd}: command not found (try help)` }];
}

export function ShellSection() {
  const [lines, setLines] = useState<Line[]>([
    { kind: "out", text: "welcome. type ls, or tap a project below." },
    { kind: "in", text: "ls" },
    { kind: "out", text: names.join("   ") },
  ]);
  const [value, setValue] = useState("");
  const log = useRef<HTMLDivElement>(null);
  const run = (cmd: string) => {
    if (cmd.trim() === "clear") return setLines([]);
    setLines((l) => [...l, { kind: "in", text: cmd }, ...runCommand(cmd)]);
  };
  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  return (
    <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-[rgba(228,228,228,0.07)] bg-[#141414] font-mono text-[13px] leading-6 text-[#e4e4e4eb] shadow-[0_24px_60px_-28px_rgba(42,38,34,0.6)]">
      <div className="flex items-center gap-1.5 border-b border-[rgba(228,228,228,0.08)] px-4 py-2.5 text-[11px] text-[rgba(228,228,228,0.5)]">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="mx-auto">zsh</span>
      </div>
      <div ref={log} className="max-h-[min(60dvh,520px)] overflow-y-auto px-4 py-3">
        {lines.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-words">
            {line.kind === "in" && (
              <>
                <span className="text-[#b48ead]">{prompt} </span>
                {line.text}
              </>
            )}
            {line.kind === "out" && <span className="text-[#e4e4e45e]">{line.text}</span>}
            {line.kind === "project" && line.project && (
              <div className="my-2 flex flex-col gap-2 sm:flex-row">
                <div className="w-full overflow-hidden rounded-md sm:w-64 sm:shrink-0">
                  <Screen project={line.project} />
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-[#e4e4e4eb]">{line.project.blurb}</p>
                  <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[#81a1c1]">
                    {line.project.links.map((l) => (
                      <li key={l.label}>
                        <a className="underline decoration-[rgba(129,161,193,0.4)] underline-offset-4 hover:decoration-current" href={l.href} target="_blank" rel="noopener">
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
        <form
          className="flex items-center"
          onSubmit={(e) => {
            e.preventDefault();
            run(value);
            setValue("");
          }}
        >
          <label htmlFor="shell-input" className="text-[#b48ead]">
            {prompt}&nbsp;
          </label>
          <input
            id="shell-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            aria-label="Type a command"
            className="min-w-0 flex-1 bg-transparent text-[#e4e4e4] caret-[#e4e4e4] outline-none"
          />
        </form>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-[rgba(228,228,228,0.08)] px-4 py-3">
        {names.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => run(`open ${n}`)}
            className="cursor-pointer rounded-full border border-[rgba(228,228,228,0.16)] px-2.5 py-1 text-[11px] text-[rgba(228,228,228,0.7)] transition-colors hover:border-[rgba(228,228,228,0.4)] hover:text-[#e4e4e4]"
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------
// windows: a desktop of project icons; each opens in a window you can drag, raise and close
// ---------------------------------------------------------------------------------------------------

type Win = { name: string; x: number; y: number; z: number };

export function WindowsSection() {
  const desk = useRef<HTMLDivElement>(null);
  const [wins, setWins] = useState<Win[]>([]);
  const top = useRef(1);
  const drag = useRef<{ name: string; dx: number; dy: number } | null>(null);

  const raise = (name: string) => setWins((w) => w.map((x) => (x.name === name ? { ...x, z: ++top.current } : x)));
  const open = (name: string) =>
    setWins((w) => {
      if (w.some((x) => x.name === name)) return w.map((x) => (x.name === name ? { ...x, z: ++top.current } : x));
      const n = w.length;
      return [...w, { name, x: 120 + n * 28, y: 20 + n * 26, z: ++top.current }];
    });
  const close = (name: string) => setWins((w) => w.filter((x) => x.name !== name));

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current, box = desk.current?.getBoundingClientRect();
    if (!d || !box) return;
    setWins((w) => w.map((x) => (x.name === d.name ? { ...x, x: Math.max(0, Math.min(box.width - 120, e.clientX - box.left - d.dx)), y: Math.max(0, Math.min(box.height - 40, e.clientY - box.top - d.dy)) } : x)));
  };

  return (
    <div
      ref={desk}
      onPointerMove={onMove}
      onPointerUp={() => (drag.current = null)}
      className="relative mx-auto h-[min(78dvh,640px)] w-full max-w-5xl select-none overflow-hidden rounded-2xl border border-[rgba(228,228,228,0.07)] bg-[#16181a] shadow-[0_24px_60px_-28px_rgba(42,38,34,0.6)]"
    >
      <ul className="absolute inset-y-0 left-0 z-0 flex w-24 flex-col gap-3 p-3 sm:w-28">
        {PROJECTS.map((p) => (
          <li key={p.name}>
            <button
              type="button"
              onClick={() => open(p.name)}
              className="flex w-full cursor-pointer flex-col items-center gap-1 rounded-lg p-1.5 font-mono text-[11px] text-[rgba(228,228,228,0.75)] hover:bg-[rgba(228,228,228,0.08)] focus-visible:outline-2 focus-visible:outline-[#fb9890]"
            >
              <span className="flex h-10 w-12 items-center justify-center rounded-md border border-[rgba(228,228,228,0.18)] bg-[#141414] text-[10px] text-[rgba(228,228,228,0.5)]">▶</span>
              {p.name}
            </button>
          </li>
        ))}
      </ul>
      {wins.length === 0 && <p className="absolute inset-0 flex items-center justify-center px-28 text-center font-mono text-xs text-[rgba(228,228,228,0.4)]">open a project</p>}
      {wins.map((w) => {
        const p = PROJECTS.find((x) => x.name === w.name)!;
        return (
          <article
            key={w.name}
            onPointerDown={() => raise(w.name)}
            style={{ left: w.x, top: w.y, zIndex: w.z }}
            className="absolute w-[min(360px,calc(100%-8rem))] overflow-hidden rounded-xl border border-[rgba(228,228,228,0.1)] bg-[#181818] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)]"
          >
            <header
              onPointerDown={(e) => {
                const box = e.currentTarget.parentElement!.getBoundingClientRect();
                drag.current = { name: w.name, dx: e.clientX - box.left, dy: e.clientY - box.top };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              className="flex cursor-grab touch-none items-center gap-1.5 border-b border-[rgba(228,228,228,0.08)] bg-[#141414] px-3 py-2 font-mono text-[11px] text-[rgba(228,228,228,0.55)] active:cursor-grabbing"
            >
              <button
                type="button"
                aria-label={`Close ${p.name}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => close(w.name)}
                className="h-2.5 w-2.5 cursor-pointer rounded-full bg-[#ff5f57]"
              />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              <span className="mx-auto">{p.name}</span>
            </header>
            <Screen project={p} />
            <div className="flex flex-col gap-3 p-4 text-[#e4e4e4eb]">
              <p className={cn(serif, "text-[15px] leading-snug")}>{p.blurb}</p>
              <ul className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-[#81a1c1]">
                {p.links.map((l) => (
                  <li key={l.label}>
                    <a className="underline decoration-[rgba(129,161,193,0.4)] underline-offset-4 hover:decoration-current" href={l.href} target="_blank" rel="noopener">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        );
      })}
    </div>
  );
}
