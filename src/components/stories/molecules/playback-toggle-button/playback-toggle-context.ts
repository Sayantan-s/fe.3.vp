import { createContext } from "react";

export type PlaybackMode = "play" | "pause" | "replay";

export interface PlaybackToggleContextValue {
  mode: PlaybackMode;
  onToggle: () => void;
}

export const PlaybackToggleContext =
  createContext<PlaybackToggleContextValue | null>(null);
