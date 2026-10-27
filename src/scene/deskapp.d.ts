export type DeskLight = "golden" | "day" | "night";

export interface DeskHandle {
  open(name: "mug" | "window"): void;
  close(): void;
  setLight(name: DeskLight): void;
  destroy(): void;
}

export function startDesk(options: {
  stage: HTMLElement;
  light?: DeskLight;
  /** a plain void around the desk instead of the room */
  backdrop?: "white" | "black" | null;
  onOpenChange?: (open: boolean) => void;
}): DeskHandle;
