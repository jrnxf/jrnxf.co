export interface DeskHandle {
  open(name: "mug"): void;
  close(): void;
  destroy(): void;
  /** jumps the camera to one of the start views (TEMPORARY, for comparing them live) */
  setView(name: "A" | "B" | "C" | "D"): void;
  /** freezes or resumes the auto motion (sway, typing, steam, clock flips) */
  setPaused(paused: boolean): void;
}

export function startDesk(options: {
  stage: HTMLElement;
  /** the colour of the void around the desk */
  backdrop?: "white" | "black";
  onOpenChange?: (open: boolean) => void;
}): DeskHandle;
