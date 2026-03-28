"use client";

import { PlayerCanvas } from "./canvas";
import { CanvasBackground } from "./canvas-background";
import { CanvasVideo } from "./canvas-video";
import { CanvasError } from "./canvas-error";

// Assemble compound component
const Canvas = Object.assign(PlayerCanvas, {
  Background: CanvasBackground,
  Video: CanvasVideo,
  Error: CanvasError,
});

export const Player = { Canvas };

// Hooks
export { usePlayback } from "./context/use-playback";
export { useAppearance } from "./context/use-appearance";

// Context (escape hatch)
export { PlayerContext } from "./context/context";

// Types
export type {
  PlayerContextValue,
  PlayerState,
  PlayerMeta,
  PlaybackSource,
  PlaybackState,
  VideoAppearance,
  VideoAppearanceStore,
  UsePlaybackReturn,
  UseAppearanceReturn,
  PlayerCanvasProps,
  CanvasBackgroundProps,
  CanvasVideoProps,
} from "./types";
export type { CanvasErrorProps } from "./canvas-error";
