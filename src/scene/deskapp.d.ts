export interface DeskHandle {
  open(name: "about"): void;
  close(): void;
  destroy(): void;
  /** flies the camera to a pose, or back to the opening view when none is given */
  flyTo(pose?: { th: number; ph: number; r: number; look: [number, number, number] }): void;
  /** shows a project on the monitor instead of the terminals; null brings the terminals back */
  setScreen(screen: { name: string; video?: HTMLVideoElement | null } | null): void;
  /** while locked the scene ignores the wheel and drags, so the page can scroll over it */
  setLocked(locked: boolean): void;
}

export function startDesk(options: {
  stage: HTMLElement;
  /** the colour of the void around the desk */
  backdrop?: "white" | "black";
  onOpenChange?: (open: boolean) => void;
}): DeskHandle;
