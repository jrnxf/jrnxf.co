export interface DeskHandle {
  open(name: "mug"): void;
  close(): void;
  destroy(): void;
  /** TEMPORARY: steps the monitor wallpaper by one either way and returns its name */
  cycleWallpaper(step: 1 | -1): string;
  wallpaperName(): string;
}

export function startDesk(options: {
  stage: HTMLElement;
  /** the colour of the void around the desk */
  backdrop?: "white" | "black";
  onOpenChange?: (open: boolean) => void;
}): DeskHandle;
