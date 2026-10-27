import { useEffect, useRef, useState } from "react";
import type React from "react";
import type { CapDirection, DeskHandle } from "@/scene/deskapp.js";
import { markSVG } from "@/scene/mark.js";
import { cn } from "@/lib/utils";

const MARK = markSVG();

// the small cards the mug opens, in the same warm off-white as the void
const PANEL_COLORS = {
  "--p-bg": "#f6f2ec",
  "--p-fg": "#2a2622",
  "--p-muted": "#6d655c",
  "--p-line": "#ddd5ca",
  "--p-key": "#efe9e1",
} as React.CSSProperties;

// the visitor's last cap choice, kept in this browser only
const CAP_KEY = "desk-cap";
function savedCap(): CapDirection {
  try {
    return localStorage.getItem(CAP_KEY) === "front" ? "front" : "back";
  } catch {
    return "back";
  }
}

// The homepage hero: me at my desk in a soft white void, terminals on the screen. The scene is
// drawn by three.js, which only loads in the browser, so the server renders the words around it.
export function DeskScene() {
  const stageRef = useRef<HTMLDivElement>(null);
  const deskRef = useRef<DeskHandle | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [phone, setPhone] = useState(false);
  const [cap, setCap] = useState<CapDirection>("back");

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let cancelled = false;
    const initialCap = savedCap();
    setCap(initialCap);
    void import("@/scene/deskapp.js").then(({ startDesk }) => {
      if (cancelled) return;
      deskRef.current = startDesk({ stage, backdrop: "white", cap: initialCap, onOpenChange: setPanelOpen });
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

  function flipCap() {
    const next = cap === "back" ? "front" : "back";
    setCap(next);
    deskRef.current?.setCap(next);
    try {
      localStorage.setItem(CAP_KEY, next);
    } catch {
      // the choice just won't be remembered
    }
  }

  const chrome = cn("transition-opacity", panelOpen && "pointer-events-none opacity-0");

  return (
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
          Small, sharp tools, made at a desk by the sea in northern Portugal.
        </p>
      </div>
      <button
        type="button"
        onClick={flipCap}
        aria-pressed={cap === "front"}
        className={cn(
          "absolute right-[max(18px,env(safe-area-inset-right))] top-[max(18px,env(safe-area-inset-top))] z-[3] cursor-pointer rounded-full border border-[rgba(42,38,34,0.18)] bg-[rgba(255,255,255,0.55)] px-3 py-[7px] font-mono text-xs font-medium text-[#2a2622] backdrop-blur-md hover:border-[rgba(42,38,34,0.4)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fb9890]",
          panelOpen && "hidden",
        )}
      >
        {cap === "back" ? "cap: backwards ↺" : "cap: forwards ↺"}
      </button>
      <div
        className={cn(
          "pointer-events-none absolute bottom-[max(18px,env(safe-area-inset-bottom))] left-1/2 z-[3] -translate-x-1/2 whitespace-nowrap font-mono text-[11px] font-medium text-[rgba(42,38,34,0.55)] sm:text-xs",
          chrome,
        )}
      >
        {phone ? "swipe sideways to look · tap the mug" : "drag to look around · click the mug"}
      </div>
    </section>
  );
}
