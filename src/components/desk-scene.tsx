import { useEffect, useRef, useState } from "react";
import type React from "react";
import type { DeskHandle } from "@/scene/deskapp.js";
import { markSVG } from "@/scene/mark.js";
import { cn } from "@/lib/utils";

const MARK = markSVG();

// TEMPORARY: mock-ups of an easy-to-find "more info" section, switched with a small "<  name  >" control
// at the top right so a favourite can be picked live. Set to false (and keep one variant, deleting the
// rest of the VARIANTS code below) once one is chosen.
const SHOW_VARIANT_SWITCHER = true;
const VARIANTS = ["about link", "bottom bar", "scroll section", "info chip"] as const;
type Variant = (typeof VARIANTS)[number];

const INFO = "Hi, I'm Colby. I build small, sharp tools for the terminal and the Mac, from a beach in northern Portugal.";
const LINKS = [
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

function Links({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {LINKS.map(({ label, href }) => (
        <li key={label}>
          <a className={pill} href={href} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}>
            {label}
          </a>
        </li>
      ))}
    </ul>
  );
}

// The homepage hero: me at my desk in a soft white void, terminals on the screen. The scene is
// drawn by three.js, which only loads in the browser, so the server renders the words around it.
export function DeskScene() {
  const stageRef = useRef<HTMLDivElement>(null);
  const deskRef = useRef<DeskHandle | null>(null);
  const moreRef = useRef<HTMLElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [phone, setPhone] = useState(false);
  const [variant, setVariant] = useState<Variant>(VARIANTS[0]);
  const [chipOpen, setChipOpen] = useState(false);

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
  const openAbout = () => deskRef.current?.open("about");
  const step = (by: number) => {
    setChipOpen(false);
    setVariant((v) => VARIANTS[(VARIANTS.indexOf(v) + by + VARIANTS.length) % VARIANTS.length]);
  };

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
          {variant === "about link" && (
            <button type="button" onClick={openAbout} className={cn(link, "pointer-events-auto mt-3 cursor-pointer font-mono text-xs")}>
              about →
            </button>
          )}
        </div>

        {/* how to move around the scene; the bottom bar variant carries it at its right end instead */}
        {variant !== "bottom bar" && (
          <div
            className={cn(
              "pointer-events-none absolute bottom-[max(18px,env(safe-area-inset-bottom))] left-1/2 z-[3] -translate-x-1/2 whitespace-nowrap font-mono text-[11px] font-medium text-[rgba(42,38,34,0.55)] sm:text-xs",
              variant === "scroll section" && "bottom-[max(60px,calc(env(safe-area-inset-bottom)+42px))]",
              chrome,
            )}
          >
            {phone ? "swipe to look · pinch to zoom" : "drag to look · scroll to zoom"}
          </div>
        )}

        {variant === "bottom bar" && (
          <nav
            aria-label="More about me"
            className={cn(
              "absolute inset-x-0 bottom-0 z-[3] flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-[rgba(42,38,34,0.12)] bg-[rgba(235,230,222,0.82)] px-[max(16px,env(safe-area-inset-left))] pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5 font-mono text-xs backdrop-blur-sm",
              chrome,
            )}
          >
            <button type="button" onClick={openAbout} className={cn(link, "cursor-pointer")}>
              about
            </button>
            <a className={link} href="https://github.com/jrnxf" target="_blank" rel="noopener">
              github
            </a>
            <a className={link} href="mailto:colby@jrnxf.co">
              email
            </a>
            <span className="ml-auto hidden text-[11px] text-[rgba(42,38,34,0.5)] sm:inline">drag to look · scroll to zoom</span>
          </nav>
        )}

        {variant === "scroll section" && (
          <button
            type="button"
            onClick={() => moreRef.current?.scrollIntoView({ behavior: "smooth" })}
            className={cn(
              pill,
              "absolute bottom-[max(14px,env(safe-area-inset-bottom))] left-1/2 z-[3] -translate-x-1/2 border-transparent",
              chrome,
            )}
          >
            more <span aria-hidden="true" className="inline-block motion-safe:animate-bounce">↓</span>
          </button>
        )}

        {variant === "info chip" && (
          <div
            className={cn(
              "absolute bottom-[max(16px,env(safe-area-inset-bottom))] right-[max(16px,env(safe-area-inset-right))] z-[4] flex flex-col items-end gap-2",
              chrome,
            )}
          >
            {chipOpen && (
              <div
                id="info-card"
                role="region"
                aria-label="About"
                className="w-[min(320px,calc(100vw-32px))] rounded-2xl border border-[rgba(42,38,34,0.14)] bg-[#f6f2ec] p-4 shadow-[0_18px_40px_-18px_rgba(42,38,34,0.35)]"
              >
                <p className="font-['Fraunces',serif] text-[17px] font-light leading-snug text-[rgba(42,38,34,0.92)]">{INFO}</p>
                <Links className="mt-3" />
              </div>
            )}
            <button
              type="button"
              aria-expanded={chipOpen}
              aria-controls="info-card"
              aria-label={chipOpen ? "Close info" : "About me"}
              onClick={() => setChipOpen((o) => !o)}
              className={cn(pill, "flex h-9 w-9 items-center justify-center bg-[#ebe6de] px-0 py-0 text-sm")}
            >
              {chipOpen ? "×" : "i"}
            </button>
          </div>
        )}

        {SHOW_VARIANT_SWITCHER && (
          <div
            className={cn(
              "absolute right-[max(14px,env(safe-area-inset-right))] top-[max(14px,env(safe-area-inset-top))] z-[5] flex items-center gap-1.5 font-mono text-[11px] text-[rgba(42,38,34,0.55)]",
              chrome,
            )}
          >
            {([-1, 1] as const).map((by) => (
              <button key={by} type="button" aria-label={by < 0 ? "Previous variant" : "Next variant"} onClick={() => step(by)} className={cn(pill, "px-2.5 py-1 text-[11px]")}>
                {by < 0 ? "<" : ">"}
              </button>
            ))}
            <span className="min-w-[10ch]">{variant}</span>
          </div>
        )}
      </section>

      {variant === "scroll section" && (
        <section
          ref={moreRef}
          id="more"
          aria-label="More about me"
          className="relative z-10 flex min-h-[70dvh] flex-col items-center justify-center gap-6 bg-[#ebe6de] px-6 py-16 text-center font-['Geist',system-ui,sans-serif] text-[#2a2622]"
        >
          <div className="w-[110px] [&>svg]:block [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: MARK }} />
          <p className="max-w-[34ch] font-['Fraunces',serif] text-[clamp(20px,3vw,26px)] font-light leading-snug">{INFO}</p>
          <Links className="justify-center" />
        </section>
      )}
    </>
  );
}
