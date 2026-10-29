export type CapDirection = "back" | "front";

export interface DeskHandle {
  open(name: "mug"): void;
  close(): void;
  setCap(dir: CapDirection): void;
  destroy(): void;
}

export function startDesk(options: {
  stage: HTMLElement;
  /** the colour of the void around the desk */
  backdrop?: "white" | "black";
  /** which way the cap is worn */
  cap?: CapDirection;
  onOpenChange?: (open: boolean) => void;
}): DeskHandle;
