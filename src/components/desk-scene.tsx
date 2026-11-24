import { useEffect, useRef, useState } from "react";
import type React from "react";
import type { DeskHandle } from "@/scene/deskapp.js";
import { markSVG } from "@/scene/mark.js";
import { cn } from "@/lib/utils";
import { ABOUT_LINKS, GithubIcon, PROJECTS, StarIcon, pill, useStars } from "@/components/projects";

const MARK = markSVG();

// below this width a landscape screen (a tablet, a small laptop) shows the projects one at a time in a card,
// like a portrait screen, since the list beside the monitor would sit over the clock on the desk
const LIST_MIN_W = 1200;
// the camera for the projects view: over his right shoulder, a little above his head, looking at the
// monitor from about 20 degrees off its axis so the screen reads nearly face-on, and large in frame
const LIST_POSE = { th: 0.37, ph: 1.4, r: 29, look: [38, 21.5, 5.8] as [number, number, number] };
// with the card: the camera backs off until a w-unit wide span (the monitor is 20) fits across the screen
// and h units fit down it, and `lift` of the visible height moves the monitor up, clear of the card
function cardPose(aspect: number) {
  const [w, h, lift, th, x] = aspect >= 1.1 ? [32, 27, 0.17, 0.6, 35] : [26, 15, 0.08, 0.75, 33.5];
  const t = Math.tan((16 * Math.PI) / 180);
  const r = Math.max(w / (2 * t * aspect), h / (2 * t));
  const visible = 2 * r * t;
  return { th, ph: 1.4, r, look: [x, 21.5 - visible * lift, 5.8] as [number, number, number] };
}
const WHEEL_STEP = 50; // wheel delta that moves to the next project
const WHEEL_PAUSE = 450; // ms before the wheel can move it again

const serif = "font-['Fraunces',serif] font-light";
// a quiet link: muted ink that darkens on hover, with the page's focus ring
const quiet =
  "text-[rgba(42,38,34,0.6)] transition-colors hover:text-[#2a2622] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fb9890]";
const muted = "text-[rgba(42,38,34,0.55)]";

// the project on the 3D monitor: its clip plays in an off-screen video the scene copies frames from
function useMonitorScreen(
  deskRef: React.MutableRefObject<DeskHandle | null>,
  ready: boolean,
  index: number | null,
) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const desk = deskRef.current,
      v = video.current;
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
    <video
      ref={video}
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 h-px w-px opacity-0"
    />
  );
}

// ------------------------------------------------------------------------------------------------
// the projects index: a quiet numbered list down the right edge. The picked project opens to its blurb and
// links; the list comes in once on first show. Keyboard steps change it at once (instant).
// ------------------------------------------------------------------------------------------------

type Nav = { index: number; go: (to: number) => void; close: () => void; instant: boolean };

function IndexDisplay({ index, go, close, instant }: Nav) {
  const stars = useStars();
  return (
    <nav
      aria-label="Projects"
      data-instant={instant ? "" : undefined}
      // top-aligned with short rows, so the list ends above the clock on the desk
      className="absolute right-[max(28px,env(safe-area-inset-right))] top-[max(56px,9dvh)] z-[4] flex max-h-[calc(100dvh-72px)] w-[min(320px,30vw)] flex-col gap-1 overflow-y-auto overscroll-contain"
    >
      <button
        type="button"
        onClick={close}
        style={{ "--i": PROJECTS.length } as React.CSSProperties}
        className={cn(pill, "idx-in mb-3 self-start")}
      >
        back to the desk
      </button>
      <ol className="flex flex-col">
        {PROJECTS.map((p, i) => (
          <li
            key={p.name}
            style={{ "--i": i } as React.CSSProperties}
            className="idx-in border-t border-[rgba(42,38,34,0.12)] last:border-b"
          >
            <button
              type="button"
              aria-current={i === index}
              aria-expanded={i === index}
              onClick={() => go(i)}
              className="group flex min-h-8 w-full cursor-pointer items-center gap-3 py-1 text-left font-mono text-xs focus-visible:outline-2 focus-visible:outline-[#fb9890]"
            >
              <span
                className={cn(
                  "w-5 tabular-nums transition-colors duration-150",
                  i === index ? "text-[#2a2622]" : muted,
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "transition-colors duration-150",
                  i === index
                    ? "text-[#2a2622]"
                    : "text-[rgba(42,38,34,0.55)] group-hover:text-[#2a2622]",
                )}
              >
                {p.name}
              </span>
              {p.repo && (
                <span
                  className={cn(
                    "ml-auto flex items-center gap-1 tabular-nums transition-colors duration-150",
                    i === index ? "text-[rgba(42,38,34,0.7)]" : "text-[rgba(42,38,34,0.4)]",
                  )}
                  title={`${stars[p.name]} GitHub ${stars[p.name] === 1 ? "star" : "stars"}`}
                >
                  <StarIcon />
                  {stars[p.name]}
                </span>
              )}
            </button>
            <div
              className="idx-detail"
              data-open={i === index ? "" : undefined}
              inert={i !== index}
            >
              <div>
                <div className="flex flex-col gap-1 pb-2 pl-8">
                  <p
                    className={cn(
                      serif,
                      "idx-reveal text-[15px] leading-snug text-[rgba(42,38,34,0.88)]",
                    )}
                    style={{ "--d": 0 } as React.CSSProperties}
                  >
                    {p.blurb}
                  </p>
                  {(p.repo || p.demo) && (
                    <div className="idx-reveal" style={{ "--d": 45 } as React.CSSProperties}>
                      <div className="-ml-2.5 flex items-center gap-1 font-mono text-xs">
                        {p.repo && (
                          <a
                            href={`https://github.com/${p.repo}`}
                            target="_blank"
                            rel="noopener"
                            aria-label={`${p.name} on GitHub`}
                            title="GitHub"
                            className={cn(
                              quiet,
                              "inline-flex h-9 w-9 items-center justify-center rounded-full",
                            )}
                          >
                            <GithubIcon className="h-[18px] w-[18px]" />
                          </a>
                        )}
                        {p.demo && (
                          <a
                            href={p.demo}
                            target="_blank"
                            rel="noopener"
                            className={cn(
                              quiet,
                              "inline-flex h-9 items-center gap-1 rounded-full px-2.5",
                            )}
                          >
                            demo
                            <svg
                              viewBox="0 0 12 12"
                              aria-hidden="true"
                              className="h-2.5 w-2.5 fill-none stroke-current"
                              strokeWidth="1.4"
                            >
                              <path d="M4 2h6v6M10 2 3 9" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// portrait screens and smaller landscape ones: one project at a time in a bottom card, stepped with the arrows, the dots or a swipe
function CarouselCard({ index, go, close }: Nav) {
  const stars = useStars();
  const p = PROJECTS[index];
  const start = useRef<number | null>(null);
  const arrow = cn(
    quiet,
    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-mono text-lg disabled:opacity-25",
  );
  return (
    <nav
      aria-label="Projects"
      onPointerDown={(e) => (start.current = e.clientX)}
      onPointerUp={(e) => {
        const dx = start.current === null ? 0 : e.clientX - start.current;
        start.current = null;
        if (Math.abs(dx) > 40) go(index - Math.sign(dx));
      }}
      className="absolute inset-x-0 bottom-0 z-[4] mx-auto flex w-full max-w-[560px] touch-pan-y flex-col gap-2 rounded-t-2xl bg-[rgba(235,230,222,0.94)] px-[max(16px,env(safe-area-inset-left))] pb-[max(14px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_30px_-18px_rgba(42,38,34,0.35)] backdrop-blur-sm"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous project"
          className={arrow}
          disabled={index === 0}
          onClick={() => go(index - 1)}
        >
          ‹
        </button>
        <div className="flex flex-1 items-center justify-center gap-3 font-mono text-[13px]">
          <span className={muted}>{String(index + 1).padStart(2, "0")}</span>
          <span>{p.name}</span>
          {p.repo && (
            <span className="flex items-center gap-1 tabular-nums text-[rgba(42,38,34,0.6)]">
              <StarIcon />
              {stars[p.name]}
            </span>
          )}
        </div>
        <button
          type="button"
          aria-label="Next project"
          className={arrow}
          disabled={index === PROJECTS.length - 1}
          onClick={() => go(index + 1)}
        >
          ›
        </button>
      </div>
      <p
        className={cn(
          serif,
          "min-h-[3lh] text-center text-[17px] leading-snug text-[rgba(42,38,34,0.88)]",
        )}
      >
        {p.blurb}
      </p>
      <div className="flex min-h-11 items-center justify-center gap-1 font-mono text-xs">
        {p.repo && (
          <a
            href={`https://github.com/${p.repo}`}
            target="_blank"
            rel="noopener"
            aria-label={`${p.name} on GitHub`}
            className={cn(quiet, "inline-flex h-11 w-11 items-center justify-center rounded-full")}
          >
            <GithubIcon className="h-[18px] w-[18px]" />
          </a>
        )}
        {p.demo && (
          <a
            href={p.demo}
            target="_blank"
            rel="noopener"
            className={cn(quiet, "inline-flex h-11 items-center rounded-full px-2.5")}
          >
            demo ↗
          </a>
        )}
      </div>
      <div className="flex items-center justify-between">
        <button type="button" onClick={close} className={cn(pill, "min-h-11 px-4")}>
          back to the desk
        </button>
        <div className="flex gap-1.5" aria-hidden="true">
          {PROJECTS.map((q, i) => (
            <button
              key={q.name}
              type="button"
              tabIndex={-1}
              onClick={() => go(i)}
              className={cn(
                "h-2 w-2 rounded-full",
                i === index ? "bg-[#2a2622]" : "bg-[rgba(42,38,34,0.22)]",
              )}
            />
          ))}
        </div>
      </div>
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
  const [phone, setPhone] = useState(false);
  const viaKey = useRef(false); // the last move came from the keyboard
  const [picked, setPicked] = useState<number | null>(null); // the project on the monitor, or null for the desk

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let cancelled = false;
    void import("@/scene/deskapp.js").then(({ startDesk }) => {
      if (cancelled) return;
      deskRef.current = startDesk({ stage, backdrop: "white" });
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
  // portrait or landscape, so the camera refits when a phone turns
  // and whether the list fits beside the monitor or the card shows instead
  const [shape, setShape] = useState("");
  const [card, setCard] = useState(false);
  useEffect(() => {
    const onResize = () => {
      const wide = innerWidth / innerHeight >= 1.1;
      setShape(wide ? "wide" : "tall");
      setCard(!wide || innerWidth < LIST_MIN_W);
    };
    onResize();
    addEventListener("resize", onResize);
    return () => removeEventListener("resize", onResize);
  }, []);
  const go = (to: number, key = false) => {
    viaKey.current = key;
    pick(to);
  };
  const pick = (to: number) =>
    setPicked((cur) => (cur === null ? cur : Math.max(0, Math.min(PROJECTS.length - 1, to))));
  const close = () => setPicked(null);

  // the camera leans in on the monitor while a project is picked, and the scene stops taking drags and zoom
  useEffect(() => {
    const desk = deskRef.current;
    if (!desk) return;
    if (!inProjects) desk.flyTo();
    else desk.flyTo(card ? cardPose(innerWidth / innerHeight) : LIST_POSE);
    desk.setLocked(inProjects);
  }, [inProjects, ready, shape, card]);

  // the wheel and the arrow keys step through the projects while the monitor is up
  useEffect(() => {
    if (!inProjects) return;
    let acc = 0,
      until = 0;
    const onWheel = (e: WheelEvent) => {
      const nav = e.target instanceof Element ? e.target.closest("nav") : null;
      if (nav && nav.scrollHeight > nav.clientHeight) return;
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
  const nav: Nav = { index: picked ?? 0, go: (to) => go(to), close, instant: viaKey.current };

  return (
    <section
      aria-label="Colby at a desk, in voxels"
      className="relative z-10 h-dvh overflow-hidden bg-[#ebe6de] font-['Geist',system-ui,sans-serif] text-[#2a2622]"
    >
      {hiddenVideo}
      <div
        ref={stageRef}
        className="desk-stage absolute inset-0 [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full"
      />
      <div
        className={cn(
          "pointer-events-none absolute left-[max(16px,env(safe-area-inset-left))] top-[max(16px,env(safe-area-inset-top))] z-[3] max-w-[min(420px,calc(100vw-32px))] transition-opacity",
          inProjects && "opacity-0",
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

      {!inProjects && (
        <>
          <div
            className={cn(
              "pointer-events-none absolute bottom-[max(60px,calc(env(safe-area-inset-bottom)+42px))] left-1/2 z-[3] -translate-x-1/2 whitespace-nowrap font-mono text-[11px] font-medium sm:text-xs",
              muted,
            )}
          >
            {phone ? "swipe to look · pinch to zoom" : "drag to look · scroll to zoom"}
          </div>
          <div className="absolute bottom-[max(14px,env(safe-area-inset-bottom))] left-1/2 z-[3] flex -translate-x-1/2 items-center gap-3">
            <button
              type="button"
              onClick={() => setPicked(0)}
              className={cn(pill, "border-[rgba(42,38,34,0.3)] max-sm:min-h-11 max-sm:px-5")}
            >
              projects →
            </button>
            <ul className="hidden gap-3 font-mono text-xs sm:flex">
              {ABOUT_LINKS.slice(0, 2).map((l) => (
                <li key={l.label}>
                  <a
                    className="text-[rgba(42,38,34,0.6)] underline decoration-[rgba(42,38,34,0.25)] underline-offset-4 hover:text-[#2a2622]"
                    href={l.href}
                    {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {inProjects && (card ? <CarouselCard {...nav} /> : <IndexDisplay {...nav} />)}
    </section>
  );
}
