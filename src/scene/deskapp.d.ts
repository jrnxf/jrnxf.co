export interface DeskHandle {
  open(name: "about"): void;
  close(): void;
  destroy(): void;
}

export function startDesk(options: {
  stage: HTMLElement;
  /** the colour of the void around the desk */
  backdrop?: "white" | "black";
  onOpenChange?: (open: boolean) => void;
}): DeskHandle;
