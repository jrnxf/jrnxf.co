import { useEffect, useRef, useState } from "react";
import type React from "react";
import type { DeskHandle } from "@/scene/deskapp.js";
import { markSVG } from "@/scene/mark.js";
import { cn } from "@/lib/utils";

const MARK = markSVG();

// TEMPORARY: a small "<  name  >" control at the bottom right that steps through the monitor's wallpaper
// options, so a favourite can be picked live. Set to false (or delete this const, the state and the
// control below) once one is chosen.
const SHOW_WALLPAPER_PICKER = true;

// the small cards the mug opens, in the same warm off-white as the void
const PANEL_COLORS = {
  "--p-bg": "#f6f2ec",
  "--p-fg": "#2a2622",
  "--p-muted": "#6d655c",
  "--p-line": "#ddd5ca",
} as React.CSSProperties;

// The homepage hero: me at my desk in a soft white void, terminals on the screen. The scene is
// drawn by three.js, which only loads in the browser, so the server renders the words around it.
export function DeskScene() {
  const stageRef = useRef<HTMLDivElement>(null);
  const deskRef = useRef<DeskHandle | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [phone, setPhone] = useState(false);
  const [wallpaper, setWallpaper] = useState("");

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let cancelled = false;
    void import("@/scene/deskapp.js").then(({ startDesk }) => {
      if (cancelled) return;
      deskRef.current = startDesk({ stage, backdrop: "white", onOpenChange: setPanelOpen });
      setWallpaper(deskRef.current.wallpaperName());
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
          chrome,
        )}
      >
        {phone ? "swipe to look · pinch to zoom · tap the mug" : "drag to look · scroll to zoom · click the mug"}
      </div>
      {SHOW_WALLPAPER_PICKER && (
        <div
          className={cn(
            "absolute bottom-[max(14px,env(safe-area-inset-bottom))] right-[max(14px,env(safe-area-inset-right))] z-[4] flex items-center gap-1.5 font-mono text-[11px] text-[rgba(42,38,34,0.55)]",
            chrome,
          )}
        >
          {([-1, 1] as const).map((step) => (
            <button
              key={step}
              type="button"
              aria-label={step < 0 ? "Previous wallpaper" : "Next wallpaper"}
              onClick={() => setWallpaper(deskRef.current?.cycleWallpaper(step) ?? "")}
              className="cursor-pointer rounded-full border border-[rgba(42,38,34,0.18)] bg-transparent px-2.5 py-1 hover:text-[rgba(42,38,34,0.85)]"
            >
              {step < 0 ? "<" : ">"}
            </button>
          ))}
          <span className="min-w-[8ch]">{wallpaper || "wallpaper"}</span>
        </div>
      )}
    </section>
  );
}
