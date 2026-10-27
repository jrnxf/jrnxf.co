export type DeskLight = "golden" | "day" | "night";
export type CapDirection = "back" | "front";

export interface DeskHandle {
  open(name: "mug" | "window"): void;
  close(): void;
  setLight(name: DeskLight): void;
  setCap(dir: CapDirection): void;
  destroy(): void;
}

export function startDesk(options: {
  stage: HTMLElement;
  light?: DeskLight;
  /** a plain void around the desk instead of the room */
  backdrop?: "white" | "black" | null;
  /** which way the cap is worn */
  cap?: CapDirection;
  onOpenChange?: (open: boolean) => void;
}): DeskHandle;
