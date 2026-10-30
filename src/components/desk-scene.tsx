import { useEffect, useRef, useState } from "react";
import type React from "react";
import type { DeskHandle } from "@/scene/deskapp.js";
import { markSVG } from "@/scene/mark.js";
import { cn } from "@/lib/utils";
import { ABOUT_LINKS, INFO, LinkPills, PROJECTS, ShellSection, WindowsSection, pill } from "@/components/projects";

const MARK = markSVG();

// TEMPORARY: four interactive mock-ups of the projects section, switched with a small "<  name  >" control
// at the top right so a favourite can be picked live. Set to false (and keep one variant, deleting the
// rest of the VARIANTS code below) once one is chosen.
const SHOW_VARIANT_SWITCHER = true;
const VARIANTS = ["monitor", "shell", "story", "windows"] as const;
type Variant = (typeof VARIANTS)[number];

// where the camera goes for a project: the monitor close-up (monitor variant), or the desk object each
// project is tied to (story variant). th / ph / r are the orbit angles and distance, look the point looked at.
type Pose = { th: number; ph: number; r: number; look: [number, number, number] };
const MONITOR_POSE: Pose = { th: 0.75, ph: 1.1, r: 46, look: [40, 20, 6] };
const STORY: { object: string; pose: Pose }[] = [
  { object: "the keyboard", pose: { th: 0.7, ph: 1.1, r: 30, look: [32, 14, 10] } }, // thokr
  { object: "the clock", pose: { th: 0.5, ph: 1.2, r: 26, look: [43, 16.5, 8] } }, // drip
  { object: "the mug", pose: { th: 0.9, ph: 1.15, r: 20, look: [41, 15.5, 11] } }, // okfs
  { object: "the plant", pose: { th: -0.7, ph: 1.15, r: 26, look: [20, 16, 10] } }, // une.haus
  { object: "the monitor", pose: MONITOR_POSE }, // fsrx, whose clip plays on the screen
  { object: "the whole desk", pose: { th: 0.3, ph: 1.1, r: 70, look: [32.5, 13, 14] } }, // vxr, which made it
];
const STEP = 0.8; // dvh of scrolling per story step

// the panel the page opens, in the same warm off-white as the void
const PANEL_COLORS = {
  "--p-bg": "#f6f2ec",
  "--p-fg": "#2a2622",
  "--p-muted": "#6d655c",
  "--p-line": "#ddd5ca",
} as React.CSSProperties;

// a project on the 3D monitor: its clip plays in an off-screen video the scene copies frames from
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
  return (
    <video ref={video} muted loop playsInline preload="auto" aria-hidden="true" className="pointer-events-none fixed left-0 top-0 h-px w-px opacity-0" />
  );
}

function Caption({ index, className, children }: { index: number; className?: string; children?: React.ReactNode }) {
  const project = PROJECTS[index];
  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl border border-[rgba(42,38,34,0.14)] bg-[#f6f2ec] p-4 shadow-[0_18px_40px_-18px_rgba(42,38,34,0.35)]", className)}>
      <h3 className="font-mono text-sm font-medium">{project.name}</h3>
      <p className="font-['Fraunces',serif] text-[17px] font-light leading-snug text-[rgba(42,38,34,0.88)]">{project.blurb}</p>
      <LinkPills links={project.links} />
      {children}
    </div>
  );
}

// The homepage hero: me at my desk in a soft white void, terminals on the screen. The scene is
// drawn by three.js, which only loads in the browser, so the server renders the words around it.
export function DeskScene() {
  const stageRef = useRef<HTMLDivElement>(null);
  const deskRef = useRef<DeskHandle | null>(null);
  const workRef = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [phone, setPhone] = useState(false);
  const [variant, setVariant] = useState<Variant>(VARIANTS[0]);
  const [picked, setPicked] = useState<number | null>(null); // monitor variant: the project on the monitor
  const [step, setStep] = useState(-1); // story variant: the step the scroll is on, -1 before the first

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

  // changing variant starts clean: the opening view, the terminals on the monitor, the page at the top
  useEffect(() => {
    setPicked(null);
    setStep(-1);
    window.scrollTo(0, 0);
    const desk = deskRef.current;
    if (!desk) return;
    desk.flyTo();
    desk.setLocked(variant === "story");
  }, [variant, ready]);

  // monitor variant: the camera leans in on the monitor while a project is picked
  useEffect(() => {
    if (variant !== "monitor") return;
    if (picked === null) deskRef.current?.flyTo();
    else deskRef.current?.flyTo(MONITOR_POSE);
  }, [variant, picked, ready]);

  // story variant: the scroll position picks the step, and each step flies to its object
  useEffect(() => {
    if (variant !== "story") return;
    const onScroll = () => {
      const next = Math.min(STORY.length - 1, Math.floor(window.scrollY / (STEP * innerHeight) + 0.35) - 1);
      setStep((cur) => (cur === next ? cur : next));
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, [variant]);
  useEffect(() => {
    if (variant !== "story") return;
    if (step < 0) deskRef.current?.flyTo();
    else deskRef.current?.flyTo(STORY[step].pose);
  }, [variant, step, ready]);

  const screenIndex = variant === "monitor" ? picked : variant === "story" && step >= 0 && STORY[step].object === "the monitor" ? step : null;
  const hiddenVideo = useMonitorScreen(deskRef, ready, screenIndex);

  const chrome = cn("transition-opacity", panelOpen && "pointer-events-none opacity-0");
  const stepBy = (by: number) => setVariant((v) => VARIANTS[(VARIANTS.indexOf(v) + by + VARIANTS.length) % VARIANTS.length]);
  const lean = variant === "monitor" && picked !== null;
  const inStory = variant === "story";
  const below = variant === "shell" || variant === "windows";
  const storyProject = inStory && step >= 0 ? Math.min(step, PROJECTS.length - 1) : null;

  return (
    <>
      {hiddenVideo}
      <div style={inStory ? { height: `${(STORY.length + 1.4) * STEP * 100}dvh` } : undefined} className="relative">
        <section
          aria-label="Colby at a desk, in voxels"
          className={cn("relative z-10 h-dvh overflow-hidden bg-[#ebe6de] font-['Geist',system-ui,sans-serif] text-[#2a2622]", inStory && "sticky top-0")}
          style={PANEL_COLORS}
        >
          <div ref={stageRef} className="desk-stage absolute inset-0 [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full" />
          <div
            className={cn(
              "pointer-events-none absolute left-[max(16px,env(safe-area-inset-left))] top-[max(16px,env(safe-area-inset-top))] z-[3] max-w-[min(420px,calc(100vw-32px))] transition-opacity",
              (panelOpen || lean || (inStory && step >= 0)) && "opacity-0",
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

          {variant === "monitor" && (
            <div
              className={cn(
                "absolute z-[4] flex gap-2 max-sm:inset-x-[max(12px,env(safe-area-inset-left))] max-sm:bottom-[max(14px,env(safe-area-inset-bottom))] max-sm:flex-col sm:right-[max(20px,env(safe-area-inset-right))] sm:top-1/2 sm:w-[min(340px,34vw)] sm:-translate-y-1/2 sm:flex-col",
                chrome,
              )}
            >
              {picked !== null && (
                <Caption index={picked}>
                  <button type="button" onClick={() => setPicked(null)} className={cn(pill, "self-start")}>
                    back to the desk
                  </button>
                </Caption>
              )}
              <ul className="flex flex-wrap gap-2 sm:justify-end">
                {PROJECTS.map((p, i) => (
                  <li key={p.name}>
                    <button
                      type="button"
                      aria-pressed={picked === i}
                      onClick={() => setPicked(picked === i ? null : i)}
                      className={cn(pill, "bg-[rgba(246,242,236,0.7)]", picked === i && "border-[rgba(42,38,34,0.55)] text-[#2a2622]")}
                    >
                      {p.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {inStory && (
            <>
              <div className={cn("pointer-events-none absolute inset-x-0 bottom-[max(18px,env(safe-area-inset-bottom))] z-[3] text-center font-mono text-[11px] text-[rgba(42,38,34,0.55)] transition-opacity sm:text-xs", step >= 0 && "opacity-0")}>
                scroll <span aria-hidden="true" className="inline-block motion-safe:animate-bounce">↓</span>
              </div>
              {storyProject !== null && (
                <Caption
                  index={storyProject}
                  className="absolute z-[4] max-sm:inset-x-[max(12px,env(safe-area-inset-left))] max-sm:bottom-[max(14px,env(safe-area-inset-bottom))] sm:bottom-10 sm:left-[max(20px,env(safe-area-inset-left))] sm:w-[min(360px,40vw)]"
                >
                  <p className="font-mono text-[11px] text-[rgba(42,38,34,0.5)]">
                    {step + 1} / {STORY.length} · {STORY[step].object}
                  </p>
                </Caption>
              )}
            </>
          )}

          {!inStory && !lean && (
            <>
              <div
                className={cn(
                  "pointer-events-none absolute left-1/2 z-[3] -translate-x-1/2 whitespace-nowrap font-mono text-[11px] font-medium text-[rgba(42,38,34,0.55)] sm:text-xs",
                  below ? "bottom-[max(60px,calc(env(safe-area-inset-bottom)+42px))]" : "bottom-[max(18px,env(safe-area-inset-bottom))]",
                  variant === "monitor" && "max-sm:hidden",
                  chrome,
                )}
              >
                {phone ? "swipe to look · pinch to zoom" : "drag to look · scroll to zoom"}
              </div>
              {below && (
                <button
                  type="button"
                  onClick={() => workRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className={cn(pill, "absolute bottom-[max(14px,env(safe-area-inset-bottom))] left-1/2 z-[3] -translate-x-1/2 border-transparent", chrome)}
                >
                  work <span aria-hidden="true" className="inline-block motion-safe:animate-bounce">↓</span>
                </button>
              )}
            </>
          )}

          {SHOW_VARIANT_SWITCHER && (
            <div
              className={cn(
                "absolute right-[max(14px,env(safe-area-inset-right))] top-[max(14px,env(safe-area-inset-top))] z-[5] flex items-center gap-1.5 font-mono text-[11px] text-[rgba(42,38,34,0.55)]",
                chrome,
              )}
            >
              {([-1, 1] as const).map((by) => (
                <button key={by} type="button" aria-label={by < 0 ? "Previous variant" : "Next variant"} onClick={() => stepBy(by)} className={cn(pill, "px-2.5 py-1 text-[11px]")}>
                  {by < 0 ? "<" : ">"}
                </button>
              ))}
              <span className="min-w-[8ch]">{variant}</span>
            </div>
          )}
        </section>
      </div>

      {below && (
        <section
          ref={workRef}
          id="work"
          aria-label="Projects"
          className="relative z-10 bg-[#ebe6de] px-[max(16px,env(safe-area-inset-left))] py-16 font-['Geist',system-ui,sans-serif] text-[#2a2622] sm:py-24"
        >
          <div className="mx-auto flex max-w-5xl flex-col gap-8">
            <header className="flex flex-col gap-3">
              <h2 className="font-mono text-xs uppercase tracking-widest text-[rgba(42,38,34,0.55)]">work</h2>
              <p className="max-w-[40ch] font-['Fraunces',serif] text-[clamp(20px,3vw,28px)] font-light leading-snug">{INFO}</p>
            </header>
            {variant === "shell" ? <ShellSection /> : <WindowsSection />}
            <footer className="flex flex-col gap-3 border-t border-[rgba(42,38,34,0.12)] pt-6">
              <LinkPills links={ABOUT_LINKS} />
            </footer>
          </div>
        </section>
      )}
    </>
  );
}
