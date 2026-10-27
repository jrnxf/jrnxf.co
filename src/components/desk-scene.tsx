import { useEffect, useRef, useState } from "react";
import type { DeskHandle } from "@/scene/deskapp.js";
import { markSVG } from "@/scene/mark.js";
import { lightForHour } from "@/scene/voxel.js";
import { cn } from "@/lib/utils";

const MARK = markSVG();

const lisbonTime = () =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());

// The homepage hero: a voxel office at golden hour, me at the desk. The room is drawn by
// three.js, which only loads in the browser, so the server renders the words around it.
export function DeskScene() {
  const stageRef = useRef<HTMLDivElement>(null);
  const deskRef = useRef<DeskHandle | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [showingNow, setShowingNow] = useState(false);
  const [time, setTime] = useState<string | null>(null);
  const [phone, setPhone] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let cancelled = false;
    void import("@/scene/deskapp.js").then(({ startDesk }) => {
      if (cancelled) return;
      deskRef.current = startDesk({ stage, onOpenChange: setPanelOpen });
    });
    return () => {
      cancelled = true;
      deskRef.current?.destroy();
      deskRef.current = null;
    };
  }, []);

  useEffect(() => {
    const tick = () => setTime(lisbonTime());
    tick();
    const id = setInterval(tick, 30_000);
    const media = matchMedia("(max-width: 719px)");
    const onMedia = () => setPhone(media.matches);
    onMedia();
    media.addEventListener("change", onMedia);
    return () => {
      clearInterval(id);
      media.removeEventListener("change", onMedia);
    };
  }, []);

  function toggleLight() {
    const next = !showingNow;
    setShowingNow(next);
    const [h, m] = lisbonTime().split(":").map(Number);
    deskRef.current?.setLight(next ? lightForHour(h + m / 60) : "golden");
  }

  const chrome = cn("transition-opacity", panelOpen && "pointer-events-none opacity-0");

  return (
    <section
      aria-label="A voxel office: Colby at a desk by the sea"
      className="relative z-10 h-dvh overflow-hidden bg-[radial-gradient(120%_90%_at_50%_30%,#3b2c3a,#140f16_70%)] font-['Geist',system-ui,sans-serif] text-[#f3ecdf]"
    >
      <div ref={stageRef} className="desk-stage absolute inset-0 [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full" />
      <div
        className={cn(
          "pointer-events-none absolute left-[max(16px,env(safe-area-inset-left))] top-[calc(max(16px,env(safe-area-inset-top))+84px)] z-[3] max-w-[min(420px,calc(100vw-32px))] sm:top-[max(16px,env(safe-area-inset-top))]",
          chrome,
        )}
      >
        <div
          className="w-[110px] drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)] sm:w-[150px] [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: MARK }}
        />
        <p className="mt-2.5 font-['Fraunces',serif] text-base font-light leading-[1.35] text-[rgba(243,236,223,0.95)] [text-shadow:0_1px_2px_rgba(20,15,22,0.55),0_1px_16px_rgba(20,15,22,0.6)] sm:text-[clamp(17px,2vw,21px)]">
          Small, sharp tools, made at a desk by the sea in northern Portugal.
        </p>
      </div>
      {time && (
        <button
          type="button"
          onClick={toggleLight}
          className={cn(
            "absolute right-[max(18px,env(safe-area-inset-right))] top-[max(18px,env(safe-area-inset-top))] z-[3] cursor-pointer rounded-full border border-[rgba(243,236,223,0.2)] bg-[rgba(20,15,22,0.5)] px-3 py-[7px] font-mono text-xs font-medium backdrop-blur-md hover:border-[rgba(243,236,223,0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fb9890]",
            panelOpen && "hidden",
          )}
        >
          {showingNow ? "back to golden hour ↺" : `it's ${time} here: see it ↺`}
        </button>
      )}
      <div
        className={cn(
          "pointer-events-none absolute bottom-[max(18px,env(safe-area-inset-bottom))] left-1/2 z-[3] -translate-x-1/2 whitespace-nowrap font-mono text-[11px] font-medium text-[rgba(243,236,223,0.7)] sm:text-xs",
          chrome,
        )}
      >
        {phone ? "swipe sideways to look · tap the monitor" : "drag to look around · click the monitor"}
      </div>
    </section>
  );
}
