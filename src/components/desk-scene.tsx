import { useEffect, useRef, useState } from "react";
import type React from "react";
import type { DeskHandle } from "@/scene/deskapp.js";
import { markSVG } from "@/scene/mark.js";
import { cn } from "@/lib/utils";
import { ABOUT_LINKS, LinkPills, PROJECTS, pill } from "@/components/projects";

const MARK = markSVG();

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
// the projects index: a quiet numbered list down the right edge. The picked project opens to its blurb and
// links; the list comes in once on first show. Keyboard steps change it at once (instant).
// ------------------------------------------------------------------------------------------------

type Nav = { index: number; go: (to: number) => void; close: () => void; instant: boolean };

function IndexDisplay({ index, go, close, instant }: Nav) {
  return (
    <nav
      aria-label="Projects"
      data-instant={instant ? "" : undefined}
      className="absolute z-[4] flex flex-col gap-1 max-sm:inset-x-[max(14px,env(safe-area-inset-left))] max-sm:bottom-[max(14px,env(safe-area-inset-bottom))] sm:right-[max(28px,env(safe-area-inset-right))] sm:top-1/2 sm:w-[min(320px,30vw)] sm:-translate-y-1/2"
    >
      <ol className="flex flex-col">
        {PROJECTS.map((p, i) => (
          <li
            key={p.name}
            style={{ "--i": i } as React.CSSProperties}
            className={cn("idx-in border-t border-[rgba(42,38,34,0.12)] last:border-b", i !== index && "max-sm:hidden")}
          >
            <button
              type="button"
              aria-current={i === index}
              aria-expanded={i === index}
              onClick={() => go(i)}
              className="group flex w-full cursor-pointer items-baseline gap-3 py-2.5 text-left font-mono text-xs focus-visible:outline-2 focus-visible:outline-[#fb9890]"
            >
              <span className={cn("w-5 tabular-nums transition-colors duration-150", i === index ? "text-[#2a2622]" : muted)}>{String(i + 1).padStart(2, "0")}</span>
              <span className={cn("transition-colors duration-150", i === index ? "text-[#2a2622]" : "text-[rgba(42,38,34,0.55)] group-hover:text-[#2a2622]")}>{p.name}</span>
            </button>
            <div className="idx-detail" data-open={i === index ? "" : undefined} inert={i !== index}>
              <div>
                <div className="flex flex-col gap-3 pb-4 pl-8">
                  <p className={cn(serif, "idx-reveal text-[17px] leading-snug text-[rgba(42,38,34,0.88)]")} style={{ "--d": 0 } as React.CSSProperties}>
                    {p.blurb}
                  </p>
                  <div className="idx-reveal" style={{ "--d": 45 } as React.CSSProperties}>
                    <LinkPills links={p.links} />
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" onClick={close} style={{ "--i": PROJECTS.length } as React.CSSProperties} className={cn(pill, "idx-in mt-3 self-start")}>
        back to the desk
      </button>
    </nav>
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
  const viaKey = useRef(false); // the last move came from the keyboard
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
  const go = (to: number, key = false) => {
    viaKey.current = key;
    pick(to);
  };
  const pick = (to: number) => setPicked((cur) => (cur === null ? cur : Math.max(0, Math.min(PROJECTS.length - 1, to))));
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
      if (e.key === "ArrowRight" || e.key === "ArrowDown") go(cur + 1, true);
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(cur - 1, true);
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
  const nav: Nav = { index: picked ?? 0, go: (to) => go(to), close, instant: viaKey.current };

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

      {inProjects && <IndexDisplay {...nav} />}
    </section>
  );
}
