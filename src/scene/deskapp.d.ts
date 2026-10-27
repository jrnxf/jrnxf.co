export type DeskLight = "golden" | "day" | "night";

export interface DeskHandle {
  open(name: "monitor" | "mug" | "poster" | "window"): void;
  close(): void;
  setLight(name: DeskLight): void;
  destroy(): void;
}

export function startDesk(options: {
  stage: HTMLElement;
  light?: DeskLight;
  onOpenChange?: (open: boolean) => void;
}): DeskHandle;
