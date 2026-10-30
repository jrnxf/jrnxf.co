import { useEffect, useRef, useState } from "react";
import type React from "react";
import type { DeskHandle } from "@/scene/deskapp.js";
import { markSVG } from "@/scene/mark.js";
import { cn } from "@/lib/utils";
import { ABOUT_LINKS, LinkPills, PROJECTS, pill } from "@/components/projects";

const MARK = markSVG();

// TEMPORARY: three ways to show the projects beside the monitor, switched with a small "<  name  >" control
// at the top right so a favourite can be picked live. Set to false (and keep one option, deleting the rest
// of the OPTIONS code below) once one is chosen.
const SHOW_OPTION_SWITCHER = true;
const OPTIONS = ["index", "note", "strip"] as const;
type Option = (typeof OPTIONS)[number];

// the camera for the projects view: over his right shoulder, a little above his head, looking at the
// monitor from about 20 degrees off its axis so the screen reads nearly face-on, and large in frame
const PROJECTS_POSE = { th: 0.37, ph: 1.4, r: 29, look: [38, 21.5, 5.8] as [number, number, number] };
const WHEEL_STEP = 50; // wheel delta that moves to the next project
const WHEEL_PAUSE = 450; // ms before the wheel can move it again

const PANEL_COLORS = {
  "--p-bg": "#f6f2ec",
  "--p-fg": "#2a2622",
  "--p-muted": "#6d655c",
  "--p-line": "#ddd5ca",
} as React.CSSProperties;

const serif = "font-['Fraunces',serif] font-light";
const muted = "text-[rgba(42,38,34,0.55)]";

// the project on the 3D monitor: its clip plays in an off-screen video the scene copies frames from
function useMonitorScreen(deskRef: React.MutableRefObject<DeskHandle | null>, ready: boolean, index: number | null) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const desk = deskRef.current, v = video.current;
    if (!desk || !v) return;
    if (index === null) {
      v.pause();
      desk.setScreen(null);
      return;
    }
    const project = PROJECTS[index];
    if (project.clip) {
      v.src = `/work/${project.clip}.mp4`;
      v.currentTime = 0;
      void v.play().catch(() => {});
    } else {
      v.pause();
      v.removeAttribute("src");
    }
    desk.setScreen({ name: project.name, video: project.clip ? v : null });
  }, [deskRef, ready, index]);
  return <video ref={video} muted loop playsInline preload="auto" aria-hidden="true" className="pointer-events-none fixed left-0 top-0 h-px w-px opacity-0" />;
}

// ------------------------------------------------------------------------------------------------
// the three displays; each gets the picked project and a way to move, and is placed by its own classes
// ------------------------------------------------------------------------------------------------

type Nav = { index: number; go: (to: number) => void; close: () => void };

// index: a quiet vertical table of contents down the right edge; the picked project opens to its blurb and links
function IndexDisplay({ index, go, close }: Nav) {
  return (
    <nav
      aria-label="Projects"
      className="absolute z-[4] flex flex-col gap-1 max-sm:inset-x-[max(14px,env(safe-area-inset-left))] max-sm:bottom-[max(14px,env(safe-area-inset-bottom))] sm:right-[max(28px,env(safe-area-inset-right))] sm:top-1/2 sm:w-[min(320px,30vw)] sm:-translate-y-1/2"
    >
      <ol className="flex flex-col">
        {PROJECTS.map((p, i) => (
          <li key={p.name} className={cn("border-t border-[rgba(42,38,34,0.12)] last:border-b", i !== index && "max-sm:hidden")}>
            <button
              type="button"
              aria-current={i === index}
              onClick={() => go(i)}
              className="flex w-full cursor-pointer items-baseline gap-3 py-2.5 text-left font-mono text-xs focus-visible:outline-2 focus-visible:outline-[#fb9890]"
            >
              <span className={cn("w-5 tabular-nums", muted)}>{String(i + 1).padStart(2, "0")}</span>
              <span className={cn("transition-colors", i === index ? "text-[#2a2622]" : "text-[rgba(42,38,34,0.55)] hover:text-[#2a2622]")}>{p.name}</span>
            </button>
            {i === index && (
              <div className="flex flex-col gap-3 pb-4 pl-8">
                <p className={cn(serif, "text-[17px] leading-snug text-[rgba(42,38,34,0.88)]")}>{p.blurb}</p>
                <LinkPills links={p.links} />
              </div>
            )}
          </li>
        ))}
      </ol>
      <button type="button" onClick={close} className={cn(pill, "mt-3 self-start")}>
        back to the desk
      </button>
    </nav>
  );
}

// note: one index card, as if pinned beside the monitor, tipped a few degrees, turned over with its arrows
function NoteDisplay({ index, go, close }: Nav) {
  const p = PROJECTS[index];
  return (
    <div className="absolute z-[4] flex flex-col items-end gap-3 max-sm:inset-x-[max(14px,env(safe-area-inset-left))] max-sm:bottom-[max(14px,env(safe-area-inset-bottom))] sm:right-[max(32px,env(safe-area-inset-right))] sm:top-1/2 sm:w-[min(300px,28vw)] sm:-translate-y-1/2">
      <article
        key={p.name}
        className="relative w-full rotate-[1.2deg] bg-[#fbf7ee] px-5 pb-5 pt-7 shadow-[0_1px_0_rgba(42,38,34,0.06),0_16px_30px_-14px_rgba(42,38,34,0.4)]"
        style={{ backgroundImage: "repeating-linear-gradient(transparent 0 27px, rgba(131,160,190,0.22) 27px 28px)", backgroundPosition: "0 52px" }}
      >
        <span aria-hidden="true" className="absolute left-1/2 top-2.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#fc6b83] shadow-[0_2px_3px_rgba(42,38,34,0.35)]" />
        <p className={cn("font-mono text-[11px]", muted)}>
          {String(index + 1).padStart(2, "0")} / {String(PROJECTS.length).padStart(2, "0")}
        </p>
        <h3 className="mt-1 font-mono text-sm font-medium">{p.name}</h3>
        <p className={cn(serif, "mt-2 text-[17px] leading-[28px] text-[rgba(42,38,34,0.88)]")}>{p.blurb}</p>
        <LinkPills links={p.links} className="mt-3" />
      </article>
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Previous project" onClick={() => go(index - 1)} className={cn(pill, "px-3.5")}>
          ←
        </button>
        <button type="button" aria-label="Next project" onClick={() => go(index + 1)} className={cn(pill, "px-3.5")}>
          →
        </button>
        <button type="button" onClick={close} className={pill}>
          back to the desk
        </button>
      </div>
    </div>
  );
}

// strip: a thin numbered list along the bottom edge with progress dots, the blurb above it, and arrow keys
function StripDisplay({ index, go, close }: Nav) {
  const p = PROJECTS[index];
  return (
    <div className="absolute inset-x-0 bottom-0 z-[4] flex flex-col gap-3 bg-gradient-to-t from-[#ebe6de] via-[rgba(235,230,222,0.9)] to-transparent px-[max(16px,env(safe-area-inset-left))] pb-[max(14px,env(safe-area-inset-bottom))] pt-14">
      <div key={p.name} className="mx-auto flex w-full max-w-3xl flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <p className={cn(serif, "max-w-[44ch] text-[17px] leading-snug text-[rgba(42,38,34,0.9)]")}>{p.blurb}</p>
        <LinkPills links={p.links} className="sm:justify-end" />
      </div>
      <nav aria-label="Projects" className="mx-auto flex w-full max-w-3xl items-center gap-4 border-t border-[rgba(42,38,34,0.14)] pt-2.5 font-mono text-xs">
        <ol className="flex min-w-0 flex-1 items-center gap-x-4 overflow-x-auto max-sm:gap-x-3">
          {PROJECTS.map((q, i) => (
            <li key={q.name} className="shrink-0">
              <button
                type="button"
                aria-current={i === index}
                onClick={() => go(i)}
                className={cn("flex cursor-pointer items-center gap-1.5 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-[#fb9890]", i === index ? "text-[#2a2622]" : "text-[rgba(42,38,34,0.5)] hover:text-[#2a2622]")}
              >
                <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", i === index ? "bg-[#2a2622]" : i < index ? "bg-[rgba(42,38,34,0.4)]" : "border border-[rgba(42,38,34,0.35)]")} />
                <span className="max-sm:hidden">{String(i + 1).padStart(2, "0")}</span>
                <span className={cn(i !== index && "max-sm:hidden")}>{q.name}</span>
              </button>
            </li>
          ))}
        </ol>
        <span className={cn("hidden shrink-0 sm:inline", muted)}>← → keys</span>
        <button type="button" onClick={close} className="shrink-0 cursor-pointer text-[rgba(42,38,34,0.6)] underline decoration-[rgba(42,38,34,0.25)] underline-offset-4 hover:text-[#2a2622]">
          close
        </button>
      </nav>
    </div>
  );
}

// The homepage hero: me at my desk in a soft white void, terminals on the screen; "projects" leans in on the
// monitor and shows what is on it. The scene is drawn by three.js, which only loads in the browser, so the
// server renders the words around it.
export function DeskScene() {
  const stageRef = useRef<HTMLDivElement>(null);
  const deskRef = useRef<DeskHandle | null>(null);
  const [ready, setReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [phone, setPhone] = useState(false);
  const [option, setOption] = useState<Option>(OPTIONS[0]);
  const [picked, setPicked] = useState<number | null>(null); // the project on the monitor, or null for the desk

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let cancelled = false;
    void import("@/scene/deskapp.js").then(({ startDesk }) => {
      if (cancelled) return;
      deskRef.current = startDesk({ stage, backdrop: "white", onOpenChange: setPanelOpen });
      setReady(true);
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

  const inProjects = picked !== null;
  const go = (to: number) => setPicked((cur) => (cur === null ? cur : Math.max(0, Math.min(PROJECTS.length - 1, to))));
  const close = () => setPicked(null);

  // the camera leans in on the monitor while a project is picked, and the scene stops taking drags and zoom
  useEffect(() => {
    const desk = deskRef.current;
    if (!desk) return;
    if (inProjects) desk.flyTo(PROJECTS_POSE);
    else desk.flyTo();
    desk.setLocked(inProjects);
  }, [inProjects, ready]);

  // the wheel and the arrow keys step through the projects while the monitor is up
  useEffect(() => {
    if (!inProjects) return;
    let acc = 0, until = 0;
    const onWheel = (e: WheelEvent) => {
      const now = performance.now();
      if (now < until) return;
      acc += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      if (Math.abs(acc) < WHEEL_STEP) return;
      go(Math.sign(acc) + (pickedRef.current ?? 0));
      acc = 0;
      until = now + WHEEL_PAUSE;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const cur = pickedRef.current ?? 0;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") go(cur + 1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(cur - 1);
      else if (e.key === "Escape") close();
      else return;
      e.preventDefault();
    };
    addEventListener("wheel", onWheel, { passive: true });
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("wheel", onWheel);
      removeEventListener("keydown", onKey);
    };
  }, [inProjects]);
  const pickedRef = useRef<number | null>(null);
  pickedRef.current = picked;

  const hiddenVideo = useMonitorScreen(deskRef, ready, picked);
  const chrome = cn("transition-opacity", panelOpen && "pointer-events-none opacity-0");
  const stepOption = (by: number) => setOption((o) => OPTIONS[(OPTIONS.indexOf(o) + by + OPTIONS.length) % OPTIONS.length]);
  const nav: Nav = { index: picked ?? 0, go, close };

  return (
    <section
      aria-label="Colby at a desk, in voxels"
      className="relative z-10 h-dvh overflow-hidden bg-[#ebe6de] font-['Geist',system-ui,sans-serif] text-[#2a2622]"
      style={PANEL_COLORS}
    >
      {hiddenVideo}
      <div ref={stageRef} className="desk-stage absolute inset-0 [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full" />
      <div
        className={cn(
          "pointer-events-none absolute left-[max(16px,env(safe-area-inset-left))] top-[max(16px,env(safe-area-inset-top))] z-[3] max-w-[min(420px,calc(100vw-32px))] transition-opacity",
          (panelOpen || inProjects) && "opacity-0",
        )}
      >
        <div className="w-[110px] sm:w-[150px] [&>svg]:block [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: MARK }} />
        <p className="mt-2.5 font-['Fraunces',serif] text-base font-light leading-[1.35] text-[rgba(42,38,34,0.9)] sm:text-[clamp(17px,2vw,21px)]">
          fast tools, slow mornings
          <br />
          vila chã, portugal
        </p>
      </div>

      {!inProjects && (
        <>
          <div className={cn("pointer-events-none absolute bottom-[max(60px,calc(env(safe-area-inset-bottom)+42px))] left-1/2 z-[3] -translate-x-1/2 whitespace-nowrap font-mono text-[11px] font-medium sm:text-xs", muted, chrome)}>
            {phone ? "swipe to look · pinch to zoom" : "drag to look · scroll to zoom"}
          </div>
          <div className={cn("absolute bottom-[max(14px,env(safe-area-inset-bottom))] left-1/2 z-[3] flex -translate-x-1/2 items-center gap-3", chrome)}>
            <button type="button" onClick={() => setPicked(0)} className={cn(pill, "border-[rgba(42,38,34,0.3)]")}>
              projects →
            </button>
            <ul className="hidden gap-3 font-mono text-xs sm:flex">
              {ABOUT_LINKS.slice(0, 2).map((l) => (
                <li key={l.label}>
                  <a className="text-[rgba(42,38,34,0.6)] underline decoration-[rgba(42,38,34,0.25)] underline-offset-4 hover:text-[#2a2622]" href={l.href} {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {inProjects && option === "index" && <IndexDisplay {...nav} />}
      {inProjects && option === "note" && <NoteDisplay {...nav} />}
      {inProjects && option === "strip" && <StripDisplay {...nav} />}

      {SHOW_OPTION_SWITCHER && (
        <div className={cn("absolute right-[max(14px,env(safe-area-inset-right))] top-[max(14px,env(safe-area-inset-top))] z-[5] flex items-center gap-1.5 font-mono text-[11px]", muted, chrome)}>
          {([-1, 1] as const).map((by) => (
            <button key={by} type="button" aria-label={by < 0 ? "Previous option" : "Next option"} onClick={() => stepOption(by)} className={cn(pill, "px-2.5 py-1 text-[11px]")}>
              {by < 0 ? "<" : ">"}
            </button>
          ))}
          <span className="min-w-[6ch]">{option}</span>
        </div>
      )}
    </section>
  );
}
